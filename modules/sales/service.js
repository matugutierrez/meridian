const crypto = require("crypto");
const Repository = require("../../core/db/repository");
const { BadRequest, NotFound, Conflict } = require("../../core/errors");

const IVA = 0.21;

module.exports = (app) => {
	const products = new Repository(app.store, "products");
	const customers = new Repository(app.store, "customers");
	const invoices = new Repository(app.store, "invoices");
	const orders = new Repository(app.store, "orders");
	const entries = new Repository(app.store, "entries");
	const cash = new Repository(app.store, "cash");

	const postEntry = (memo, lines) => {
		const debit = lines.reduce((s, l) => s + (l.debit || 0), 0);
		const credit = lines.reduce((s, l) => s + (l.credit || 0), 0);
		if (debit !== credit) throw new Conflict("Asiento descuadrado: debe " + debit + " ≠ haber " + credit);
		return entries.insert({ date: new Date().toISOString(), memo, lines });
	};

	const service = {
		IVA,

		totals(lines) {
			const net = Math.round(lines.reduce((s, l) => s + l.qty * l.price, 0));
			const iva = Math.round(net * IVA);
			return { net, iva, total: net + iva };
		},

		cae() {
			return "7" + String(Math.floor(Math.random() * 9e12)).padStart(13, "0");
		},

		normalizeLines(rawLines) {
			if (!Array.isArray(rawLines) || rawLines.length === 0) throw new BadRequest("La venta necesita al menos una línea");
			return rawLines.map((l) => {
				const product = products.find(l.productId);
				if (!product) throw new NotFound("Producto inexistente: " + l.productId);
				const qty = Number(l.qty);
				if (!Number.isFinite(qty) || qty <= 0) throw new BadRequest("Cantidad inválida para " + product.name);
				return { productId: product.id, name: product.name, qty, price: product.price };
			});
		},

		/* Venta completa (POS o pedido). method: efectivo | tarjeta | qr | cta */
		registerSale({ customerId, lines: rawLines, method }) {
			const validMethods = ["efectivo", "tarjeta", "qr", "cta"];
			if (!validMethods.includes(method)) throw new BadRequest("Medio de pago inválido: " + method);
			const customer = customers.find(customerId) || customers.find("cf");
			if (!customer) throw new NotFound("Cliente inexistente");
			const lines = this.normalizeLines(rawLines);

			/* Chequeo de stock ANTES de tocar nada (pseudo-transacción) */
			for (const l of lines) {
				const p = products.find(l.productId);
				if (p.stock < l.qty) throw new Conflict("Stock insuficiente de " + p.name + ": hay " + p.stock + ", se pidieron " + l.qty);
			}

			const t = this.totals(lines);
			const paid = method !== "cta";
			const number = "0001-" + String(app.store.counter("invoice")).padStart(8, "0");

			lines.forEach((l) => {
				const p = products.find(l.productId);
				products.update(p.id, { stock: p.stock - l.qty });
			});

			const invoice = invoices.insert({
				number, date: new Date().toISOString(),
				customerId: customer.id, customer: customer.name,
				net: t.net, iva: t.iva, total: t.total,
				status: paid ? "pagada" : "pendiente",
				cae: this.cae(), lines,
			});

			postEntry("Venta " + number + " — " + customer.name, [
				{ account: paid ? "1.1 Caja" : "1.3 Créditos por ventas", debit: t.total, credit: 0 },
				{ account: "4.1 Ventas", debit: 0, credit: t.net },
				{ account: "2.1 IVA Débito Fiscal", debit: 0, credit: t.iva },
			]);

			const cost = Math.round(lines.reduce((s, l) => {
				const p = products.find(l.productId);
				return s + (p ? p.cost * l.qty : 0);
			}, 0));
			if (cost > 0) {
				postEntry("Costo mercadería " + number, [
					{ account: "5.1 Costo de mercadería vendida", debit: cost, credit: 0 },
					{ account: "1.4 Mercaderías", debit: 0, credit: cost },
				]);
			}

			if (paid) cash.insert({ date: new Date().toISOString(), memo: "Cobro " + number + " — " + customer.name, amount: t.total, method });

			app.bus.emit("sales.registered", { invoiceId: invoice.id, total: t.total, method });
			return invoice;
		},

		/* Pedido de venta: registra la venta a cta cte y crea el pedido enlazado */
		createOrder({ customerId, lines }) {
			const invoice = this.registerSale({ customerId, lines, method: "cta" });
			const order = orders.insert({
				number: app.store.counter("order"),
				date: new Date().toISOString(),
				customerId: invoice.customerId, customer: invoice.customer,
				lines: invoice.lines, total: invoice.total,
				status: "confirmado", invoiceNumber: invoice.number,
			});
			return { order, invoice };
		},

		/* Cobro de factura pendiente */
		collect(invoiceId, method) {
			const inv = invoices.find(invoiceId);
			if (!inv) throw new NotFound("Factura inexistente");
			if (inv.status !== "pendiente") throw new Conflict("La factura " + inv.number + " no está pendiente (estado: " + inv.status + ")");
			invoices.update(inv.id, { status: "pagada" });
			postEntry("Cobro " + inv.number + " — " + inv.customer, [
				{ account: "1.1 Caja", debit: inv.total, credit: 0 },
				{ account: "1.3 Créditos por ventas", debit: 0, credit: inv.total },
			]);
			cash.insert({ date: new Date().toISOString(), memo: "Cobro " + inv.number + " — " + inv.customer, amount: inv.total, method: method || "efectivo" });
			app.bus.emit("sales.collected", { invoiceId: inv.id });
			return invoices.find(inv.id);
		},

		/* Anulación con nota de crédito: reversa contable + stock + caja si corresponde */
		voidInvoice(invoiceId) {
			const inv = invoices.find(invoiceId);
			if (!inv) throw new NotFound("Factura inexistente");
			if (inv.status === "anulada") throw new Conflict("La factura ya está anulada");
			const wasPaid = inv.status === "pagada";
			invoices.update(inv.id, { status: "anulada" });
			postEntry("NC anulación " + inv.number + " — " + inv.customer, [
				{ account: "4.1 Ventas", debit: inv.net, credit: 0 },
				{ account: "2.1 IVA Débito Fiscal", debit: inv.iva, credit: 0 },
				{ account: wasPaid ? "1.1 Caja" : "1.3 Créditos por ventas", debit: 0, credit: inv.total },
			]);
			if (wasPaid) cash.insert({ date: new Date().toISOString(), memo: "Devolución NC " + inv.number, amount: -inv.total, method: "efectivo" });
			(inv.lines || []).forEach((l) => {
				const p = products.find(l.productId);
				if (p) products.update(p.id, { stock: p.stock + l.qty });
			});
			app.bus.emit("sales.voided", { invoiceId: inv.id });
			return invoices.find(inv.id);
		},

		/* Ajuste de inventario con su asiento */
		adjustStock({ productId, delta, reason }) {
			const p = products.find(productId);
			if (!p) throw new NotFound("Producto inexistente");
			delta = Number(delta);
			if (!Number.isFinite(delta) || delta === 0) throw new BadRequest("El ajuste debe ser distinto de 0");
			products.update(p.id, { stock: p.stock + delta });
			const value = Math.abs(Math.round(delta * p.cost));
			if (value > 0) {
				postEntry("Ajuste stock " + p.sku + " (" + (reason || "sin motivo") + ")", delta > 0
					? [{ account: "1.4 Mercaderías", debit: value, credit: 0 }, { account: "2.2 Proveedores", debit: 0, credit: value }]
					: [{ account: "5.2 Ajustes de inventario", debit: value, credit: 0 }, { account: "1.4 Mercaderías", debit: 0, credit: value }]);
			}
			return products.find(p.id);
		},

		/* Movimiento manual de tesorería con su asiento */
		cashMove({ kind, memo, amount, method }) {
			amount = Number(amount);
			if (!memo || !Number.isFinite(amount) || amount <= 0) throw new BadRequest("Concepto e importe positivo son obligatorios");
			const signed = kind === "out" ? -amount : amount;
			const move = cash.insert({ date: new Date().toISOString(), memo, amount: signed, method: method || "efectivo" });
			postEntry(memo, kind === "out"
				? [{ account: "5.3 Gastos generales", debit: amount, credit: 0 }, { account: "1.1 Caja", debit: 0, credit: amount }]
				: [{ account: "1.1 Caja", debit: amount, credit: 0 }, { account: "4.2 Otros ingresos", debit: 0, credit: amount }]);
			return move;
		},
	};

	return service;
};
