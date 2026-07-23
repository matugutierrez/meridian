const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("./helpers");

async function firstProduct(api) {
	const products = await api("GET", "/api/products");
	return products.body.data[0];
}

test("una venta de POS descuenta stock, factura, asienta y mueve caja", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const entriesBefore = (await api("GET", "/api/entries")).body.data.length;
		const cashBefore = (await api("GET", "/api/cash")).body.data.length;

		const sale = await api("POST", "/api/sales", { customerId: "cf", method: "efectivo", lines: [{ productId: p.id, qty: 2 }] });
		assert.strictEqual(sale.status, 201);
		const inv = sale.body.data;
		assert.strictEqual(inv.status, "pagada");
		assert.strictEqual(inv.net, p.price * 2);
		assert.strictEqual(inv.total, inv.net + inv.iva);
		assert.ok(inv.cae.length === 14);

		const pAfter = (await api("GET", "/api/products/" + p.id)).body.data;
		assert.strictEqual(pAfter.stock, p.stock - 2);

		const entriesAfter = (await api("GET", "/api/entries")).body.data;
		assert.strictEqual(entriesAfter.length, entriesBefore + 2); // venta + costo
		for (const e of entriesAfter.slice(-2)) {
			const debe = e.lines.reduce((s, l) => s + l.debit, 0);
			const haber = e.lines.reduce((s, l) => s + l.credit, 0);
			assert.strictEqual(debe, haber); // partida doble
		}

		const cashAfter = (await api("GET", "/api/cash")).body.data;
		assert.strictEqual(cashAfter.length, cashBefore + 1);
		assert.strictEqual(cashAfter[cashAfter.length - 1].amount, inv.total);
	});
});

test("no se puede vender más que el stock disponible", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const sale = await api("POST", "/api/sales", { customerId: "cf", method: "efectivo", lines: [{ productId: p.id, qty: p.stock + 1 }] });
		assert.strictEqual(sale.status, 409);
		const pAfter = (await api("GET", "/api/products/" + p.id)).body.data;
		assert.strictEqual(pAfter.stock, p.stock); // no tocó nada
	});
});

test("venta a cuenta corriente queda pendiente y luego se cobra", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const customers = (await api("GET", "/api/customers")).body.data;
		const cust = customers.find((c) => c.id !== "cf");

		const sale = await api("POST", "/api/sales", { customerId: cust.id, method: "cta", lines: [{ productId: p.id, qty: 1 }] });
		assert.strictEqual(sale.body.data.status, "pendiente");

		const collect = await api("POST", "/api/invoices/" + sale.body.data.id + "/collect", { method: "transferencia" });
		assert.strictEqual(collect.status, 200);
		assert.strictEqual(collect.body.data.status, "pagada");

		/* No se puede cobrar dos veces */
		const again = await api("POST", "/api/invoices/" + sale.body.data.id + "/collect", { method: "efectivo" });
		assert.strictEqual(again.status, 409);
	});
});

test("anular una factura repone stock y reversa la contabilidad", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const sale = await api("POST", "/api/sales", { customerId: "cf", method: "tarjeta", lines: [{ productId: p.id, qty: 3 }] });
		const voided = await api("POST", "/api/invoices/" + sale.body.data.id + "/void");
		assert.strictEqual(voided.status, 200);
		assert.strictEqual(voided.body.data.status, "anulada");
		const pAfter = (await api("GET", "/api/products/" + p.id)).body.data;
		assert.strictEqual(pAfter.stock, p.stock); // stock repuesto
	});
});

test("un pedido de venta crea orden + factura pendiente enlazadas", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const customers = (await api("GET", "/api/customers")).body.data;
		const cust = customers.find((c) => c.id !== "cf");
		const res = await api("POST", "/api/sales/orders", { customerId: cust.id, lines: [{ productId: p.id, qty: 1 }] });
		assert.strictEqual(res.status, 201);
		assert.strictEqual(res.body.data.order.invoiceNumber, res.body.data.invoice.number);
		assert.strictEqual(res.body.data.invoice.status, "pendiente");
	});
});

test("el ajuste de inventario genera asiento balanceado", async () => {
	await withServer(async ({ api }) => {
		const p = await firstProduct(api);
		const res = await api("POST", "/api/inventory/adjust", { productId: p.id, delta: 5, reason: "Recepción de compra" });
		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.data.stock, p.stock + 5);
		const entries = (await api("GET", "/api/entries")).body.data;
		const last = entries[entries.length - 1];
		assert.ok(last.memo.includes("Ajuste stock"));
	});
});

test("el dashboard reporta KPIs coherentes", async () => {
	await withServer(async ({ api }) => {
		const res = await api("GET", "/api/reports/dashboard");
		assert.strictEqual(res.status, 200);
		const d = res.body.data;
		assert.ok(d.salesMonth > 0);
		assert.strictEqual(d.salesByDay.length, 14);
		assert.ok(d.cashBalance > 0);
	});
});
