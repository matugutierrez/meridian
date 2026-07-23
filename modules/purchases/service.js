const Repository = require("../../core/db/repository");
const { BadRequest, NotFound, Conflict } = require("../../core/errors");

module.exports = (app) => {
	const purchases = new Repository(app.store, "purchases");
	const suppliers = new Repository(app.store, "suppliers");
	const products = new Repository(app.store, "products");
	const entries = new Repository(app.store, "entries");
	const cash = new Repository(app.store, "cash");

	const postEntry = (memo, lines) => {
		const debit = lines.reduce((s, l) => s + (l.debit || 0), 0);
		const credit = lines.reduce((s, l) => s + (l.credit || 0), 0);
		if (debit !== credit) throw new Conflict("Asiento descuadrado: " + debit + " ≠ " + credit);
		return entries.insert({ date: new Date().toISOString(), memo, lines });
	};

	return {
		/* Crea una orden de compra en estado borrador contable (sin asiento hasta recibir) */
		create({ supplierId, lines: rawLines }) {
			const supplier = suppliers.find(supplierId);
			if (!supplier) throw new NotFound("Proveedor inexistente");
			if (!Array.isArray(rawLines) || rawLines.length === 0) throw new BadRequest("La orden necesita al menos una línea");
			const lines = rawLines.map((l) => {
				const p = products.find(l.productId);
				if (!p) throw new NotFound("Producto inexistente: " + l.productId);
				const qty = Number(l.qty);
				const cost = l.cost != null ? Number(l.cost) : p.cost;
				if (!Number.isFinite(qty) || qty <= 0) throw new BadRequest("Cantidad inválida para " + p.name);
				if (!Number.isFinite(cost) || cost < 0) throw new BadRequest("Costo inválido para " + p.name);
				return { productId: p.id, name: p.name, qty, cost };
			});
			const total = Math.round(lines.reduce((s, l) => s + l.qty * l.cost, 0));
			const po = purchases.insert({
				number: "OC-" + String(app.store.counter("purchase")).padStart(6, "0"),
				date: new Date().toISOString(),
				supplierId: supplier.id, supplier: supplier.name,
				lines, total, status: "pendiente",
			});
			app.bus.emit("purchases.created", po);
			return po;
		},

		/* Recepción: suma stock, actualiza costo de reposición y asienta la deuda */
		receive(id) {
			const po = purchases.find(id);
			if (!po) throw new NotFound("Orden de compra inexistente");
			if (po.status !== "pendiente") throw new Conflict("La orden " + po.number + " no está pendiente (estado: " + po.status + ")");
			po.lines.forEach((l) => {
				const p = products.find(l.productId);
				if (p) products.update(p.id, { stock: p.stock + l.qty, cost: l.cost });
			});
			postEntry("Recepción " + po.number + " — " + po.supplier, [
				{ account: "1.4 Mercaderías", debit: po.total, credit: 0 },
				{ account: "2.2 Proveedores", debit: 0, credit: po.total },
			]);
			purchases.update(po.id, { status: "recibida" });
			app.bus.emit("purchases.received", { id: po.id });
			return purchases.find(po.id);
		},

		/* Pago: cancela la deuda con el proveedor y sale de caja */
		pay(id, method) {
			const po = purchases.find(id);
			if (!po) throw new NotFound("Orden de compra inexistente");
			if (po.status !== "recibida") throw new Conflict("Solo se pagan órdenes recibidas (estado: " + po.status + ")");
			postEntry("Pago " + po.number + " — " + po.supplier, [
				{ account: "2.2 Proveedores", debit: po.total, credit: 0 },
				{ account: "1.1 Caja", debit: 0, credit: po.total },
			]);
			cash.insert({ date: new Date().toISOString(), memo: "Pago " + po.number + " — " + po.supplier, amount: -po.total, method: method || "transferencia" });
			purchases.update(po.id, { status: "pagada" });
			app.bus.emit("purchases.paid", { id: po.id });
			return purchases.find(po.id);
		},

		/* Cancela una orden pendiente (sin efectos contables porque nunca se recibió) */
		cancel(id) {
			const po = purchases.find(id);
			if (!po) throw new NotFound("Orden de compra inexistente");
			if (po.status !== "pendiente") throw new Conflict("Solo se cancelan órdenes pendientes");
			purchases.update(po.id, { status: "cancelada" });
			app.bus.emit("purchases.cancelled", { id: po.id });
			return purchases.find(po.id);
		},

		list() { return purchases.all(); },
	};
};
