const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("./helpers");

test("una orden de compra recibida suma stock y asienta la deuda; pagarla mueve caja", async () => {
	await withServer(async ({ api }) => {
		const supplier = (await api("GET", "/api/suppliers")).body.data[0];
		const p = (await api("GET", "/api/products")).body.data[0];
		const cashBefore = (await api("GET", "/api/cash")).body.data.reduce((s, m) => s + m.amount, 0);

		const po = await api("POST", "/api/purchases", { supplierId: supplier.id, lines: [{ productId: p.id, qty: 10, cost: 1000 }] });
		assert.strictEqual(po.status, 201);
		assert.strictEqual(po.body.data.status, "pendiente");
		assert.strictEqual(po.body.data.total, 10000);

		const payEarly = await api("POST", "/api/purchases/" + po.body.data.id + "/pay");
		assert.strictEqual(payEarly.status, 409);

		const received = await api("POST", "/api/purchases/" + po.body.data.id + "/receive");
		assert.strictEqual(received.status, 200);
		assert.strictEqual(received.body.data.status, "recibida");
		const pAfter = (await api("GET", "/api/products/" + p.id)).body.data;
		assert.strictEqual(pAfter.stock, p.stock + 10);
		assert.strictEqual(pAfter.cost, 1000); // costo de reposición actualizado

		const paid = await api("POST", "/api/purchases/" + po.body.data.id + "/pay", { method: "transferencia" });
		assert.strictEqual(paid.body.data.status, "pagada");
		const cashAfter = (await api("GET", "/api/cash")).body.data.reduce((s, m) => s + m.amount, 0);
		assert.strictEqual(cashAfter, cashBefore - 10000);
	});
});

test("una orden pendiente se puede cancelar sin efectos contables", async () => {
	await withServer(async ({ api }) => {
		const supplier = (await api("GET", "/api/suppliers")).body.data[0];
		const p = (await api("GET", "/api/products")).body.data[0];
		const entriesBefore = (await api("GET", "/api/entries")).body.data.length;
		const po = await api("POST", "/api/purchases", { supplierId: supplier.id, lines: [{ productId: p.id, qty: 1 }] });
		const cancelled = await api("POST", "/api/purchases/" + po.body.data.id + "/cancel");
		assert.strictEqual(cancelled.body.data.status, "cancelada");
		const entriesAfter = (await api("GET", "/api/entries")).body.data.length;
		assert.strictEqual(entriesAfter, entriesBefore);
	});
});

test("el libro mayor cierra balanceado y el estado de resultados es coherente", async () => {
	await withServer(async ({ api }) => {
		const ledger = await api("GET", "/api/reports/ledger");
		assert.strictEqual(ledger.status, 200);
		assert.strictEqual(ledger.body.data.balanced, true);
		assert.strictEqual(ledger.body.data.totalDebit, ledger.body.data.totalCredit);

		const income = await api("GET", "/api/reports/income");
		assert.strictEqual(income.body.data.netIncome, income.body.data.totalRevenue - income.body.data.totalExpenses);

		const iva = await api("GET", "/api/reports/iva");
		assert.ok(iva.body.data.periods.length >= 1);
	});
});

test("el export CSV devuelve un archivo con encabezados", async () => {
	await withServer(async ({ base, token }) => {
		const res = await fetch(base + "/api/reports/export/products", { headers: { Authorization: "Bearer " + token } });
		assert.strictEqual(res.status, 200);
		assert.ok((res.headers.get("content-type") || "").includes("text/csv"));
		const text = await res.text();
		assert.ok(text.includes("sku"));
	});
});

test("la auditoría registra eventos y es solo para admins", async () => {
	await withServer(async ({ base, api }) => {
		await api("POST", "/api/products", { sku: "AUD-01", name: "Producto auditado", cost: 1, price: 2, stock: 1 });
		const audit = await api("GET", "/api/audit");
		assert.strictEqual(audit.status, 200);
		assert.ok(audit.body.data.some((a) => a.event === "products.created"));

		const loginCaja = await fetch(base + "/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "caja@meridian.app", password: "caja123" }),
		});
		const cajaToken = (await loginCaja.json()).token;
		const forbidden = await api("GET", "/api/audit", undefined, { token: cajaToken });
		assert.strictEqual(forbidden.status, 403);
		const prod = (await api("GET", "/api/products")).body.data[0];
		const delForbidden = await api("DELETE", "/api/products/" + prod.id, undefined, { token: cajaToken });
		assert.strictEqual(delForbidden.status, 403);
	});
});

test("el stream SSE de eventos emite eventos de dominio en vivo", async () => {
	await withServer(async ({ base, api, token }) => {
		const res = await fetch(base + "/api/events?token=" + encodeURIComponent(token));
		assert.strictEqual(res.status, 200);
		assert.ok((res.headers.get("content-type") || "").includes("text/event-stream"));

		const reader = res.body.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		await api("POST", "/api/products", { sku: "SSE-01", name: "Producto en vivo", cost: 1, price: 2, stock: 1 });
		const deadline = Date.now() + 4000;
		while (Date.now() < deadline && !buffer.includes("products.created")) {
			const { value, done } = await Promise.race([
				reader.read(),
				new Promise((resolve) => setTimeout(() => resolve({ value: undefined, done: false }), 500)),
			]);
			if (done) break;
			if (value) buffer += decoder.decode(value, { stream: true });
		}
		await reader.cancel();
		assert.ok(buffer.includes("event: hello"), "debe saludar al conectar");
		assert.ok(buffer.includes("products.created"), "debe emitir el evento de dominio");
	});
});
