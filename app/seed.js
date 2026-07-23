
const { hash } = require("../core/security/hash");
const crypto = require("crypto");

const uid = () => crypto.randomUUID();

function rng(s) {
	return () => {
		s = (s * 1664525 + 1013904223) % 4294967296;
		return s / 4294967296;
	};
}

module.exports = function seed(app) {
	const store = app.store;
	if (store.collection("users").length > 0) return; // ya inicializado

	app.logger.info("Sembrando datos de demostración...");

	store.collection("users").push(
		{ id: uid(), name: "Admin Demo", email: "admin@meridian.app", role: "admin", password: hash("admin123"), createdAt: new Date().toISOString() },
		{ id: uid(), name: "Cajero Demo", email: "caja@meridian.app", role: "cajero", password: hash("caja123"), createdAt: new Date().toISOString() },
	);

	const products = [
		{ sku: "NB-001", name: 'Notebook 15" i5 16GB', cat: "Tecnología", cost: 520000, price: 780000, stock: 14, min: 5 },
		{ sku: "MN-002", name: 'Monitor 27" IPS', cat: "Tecnología", cost: 180000, price: 265000, stock: 22, min: 8 },
		{ sku: "TK-003", name: "Teclado mecánico", cat: "Periféricos", cost: 38000, price: 62000, stock: 35, min: 10 },
		{ sku: "MS-004", name: "Mouse inalámbrico", cat: "Periféricos", cost: 14000, price: 24500, stock: 48, min: 15 },
		{ sku: "AU-005", name: "Auriculares BT", cat: "Audio", cost: 32000, price: 54000, stock: 6, min: 10 },
		{ sku: "SL-006", name: "Silla ergonómica", cat: "Mobiliario", cost: 145000, price: 230000, stock: 9, min: 4 },
		{ sku: "ES-007", name: "Escritorio 140cm", cat: "Mobiliario", cost: 98000, price: 165000, stock: 7, min: 3 },
		{ sku: "IM-008", name: "Impresora láser", cat: "Oficina", cost: 210000, price: 320000, stock: 5, min: 4 },
		{ sku: "WC-009", name: "Webcam Full HD", cat: "Periféricos", cost: 26000, price: 43000, stock: 18, min: 6 },
		{ sku: "HD-010", name: "Disco SSD 1TB", cat: "Tecnología", cost: 68000, price: 105000, stock: 30, min: 10 },
		{ sku: "RT-011", name: "Router WiFi 6", cat: "Redes", cost: 55000, price: 89000, stock: 12, min: 5 },
		{ sku: "CB-012", name: "Hub USB-C 7 en 1", cat: "Periféricos", cost: 19000, price: 34000, stock: 3, min: 8 },
	].map((p) => Object.assign({ id: uid(), createdAt: new Date().toISOString() }, p));
	store.collection("products").push(...products);

	const customers = [
		{ id: "cf", name: "Consumidor Final", cuit: "—", email: "—", terms: "Contado" },
		{ id: uid(), name: "Acme Distribuciones SA", cuit: "30-71234567-8", email: "compras@acme.com.ar", terms: "Cta cte 30 días" },
		{ id: uid(), name: "Librería El Ateneo SRL", cuit: "30-65432109-2", email: "admin@elateneo.ar", terms: "Cta cte 15 días" },
		{ id: uid(), name: "Estudio Contable Rivas", cuit: "27-28765432-1", email: "mrivas@estudiorivas.ar", terms: "Contado" },
		{ id: uid(), name: "Clínica San Martín", cuit: "30-70987654-3", email: "compras@clinicasm.ar", terms: "Cta cte 30 días" },
		{ id: uid(), name: "Transporte Lagos SRL", cuit: "30-69876543-4", email: "info@tlagos.com.ar", terms: "Cta cte 60 días" },
		{ id: uid(), name: "Panadería Don Julio", cuit: "20-32109876-5", email: "donjulio@gmail.com", terms: "Contado" },
		{ id: uid(), name: "Gimnasio FitPlus", cuit: "30-71112223-6", email: "admin@fitplus.ar", terms: "Cta cte 15 días" },
	];
	store.collection("customers").push(...customers);

	store.collection("leads").push(
		{ id: uid(), name: "Hotel Costa Azul", contact: "Laura Méndez", source: "Web", status: "nuevo", note: "Pidió cotización de 10 PCs" },
		{ id: uid(), name: "Ferretería Central", contact: "Oscar Duarte", source: "Referido", status: "contactado", note: "Busca sistema + hardware POS" },
		{ id: uid(), name: "Veterinaria Patitas", contact: "Sofía Gil", source: "Instagram", status: "nuevo", note: "Equipamiento consultorio" },
		{ id: uid(), name: "Colegio San Andrés", contact: "Rodrigo Paz", source: "Web", status: "contactado", note: "Aula de informática: 25 equipos" },
		{ id: uid(), name: "Café Martina", contact: "Julieta Ríos", source: "Referido", status: "nuevo", note: "2 cajas + impresora de tickets" },
	);

	store.collection("opportunities").push(
		{ id: uid(), name: "Renovación parque PCs", customer: "Acme Distribuciones SA", amount: 4200000, stage: 1 },
		{ id: uid(), name: "Sucursal nueva — mobiliario", customer: "Gimnasio FitPlus", amount: 1150000, stage: 2 },
		{ id: uid(), name: "Kit home office x12", customer: "Estudio Contable Rivas", amount: 2760000, stage: 0 },
		{ id: uid(), name: "Servidores + backup", customer: "Clínica San Martín", amount: 3900000, stage: 2 },
		{ id: uid(), name: "Impresoras piso técnico", customer: "Transporte Lagos SRL", amount: 960000, stage: 1 },
		{ id: uid(), name: "Upgrade red interna", customer: "Librería El Ateneo SRL", amount: 620000, stage: 3 },
	);

	/* Historia: 14 días de facturas con asientos y caja */
	const r = rng(42);
	let n = 1201;
	for (let i = 13; i >= 0; i--) {
		const day = new Date(Date.now() - i * 86400000);
		day.setHours(10 + Math.floor(r() * 8), Math.floor(r() * 59), 0, 0);
		const count = 1 + Math.floor(r() * 3);
		for (let j = 0; j < count; j++) {
			const net = Math.round(15000 + r() * 320000);
			const iva = Math.round(net * 0.21);
			const total = net + iva;
			const cust = customers[Math.floor(r() * customers.length)];
			const paid = r() > 0.3;
			const num = "0001-" + String(n++).padStart(8, "0");
			const date = day.toISOString();
			store.collection("invoices").push({ id: uid(), number: num, date, customerId: cust.id, customer: cust.name, net, iva, total, status: paid ? "pagada" : "pendiente", cae: "7" + String(Math.floor(r() * 9e12)).padStart(13, "0"), lines: [] });
			store.collection("entries").push({ id: uid(), date, memo: "Venta " + num, lines: [
				{ account: paid ? "1.1 Caja" : "1.3 Créditos por ventas", debit: total, credit: 0 },
				{ account: "4.1 Ventas", debit: 0, credit: net },
				{ account: "2.1 IVA Débito Fiscal", debit: 0, credit: iva },
			] });
			if (paid) store.collection("cash").push({ id: uid(), date, memo: "Cobro " + num, amount: total, method: r() > 0.5 ? "efectivo" : "tarjeta" });
		}
	}

	/* Proveedores y órdenes de compra (con su historia contable) */
	const suppliers = [
		{ id: uid(), name: "TecnoImport SA", cuit: "30-71555666-7", email: "ventas@tecnoimport.com.ar", phone: "011-4555-1000", terms: "Cta cte 30 días" },
		{ id: uid(), name: "Mayorista Norte SRL", cuit: "30-70888999-1", email: "pedidos@mayoristanorte.ar", phone: "011-4777-2000", terms: "Cta cte 15 días" },
		{ id: uid(), name: "Muebles del Sur", cuit: "30-69333444-5", email: "info@mueblesdelsur.ar", phone: "0291-455-3000", terms: "Contado" },
		{ id: uid(), name: "Logística Pampa", cuit: "30-71222333-9", email: "admin@logpampa.com.ar", phone: "011-4999-4000", terms: "Cta cte 60 días" },
	];
	store.collection("suppliers").push(...suppliers);

	const poDay = (offset) => new Date(Date.now() - offset * 86400000).toISOString();
	const po1lines = [
		{ productId: products[0].id, name: products[0].name, qty: 5, cost: products[0].cost },
		{ productId: products[9].id, name: products[9].name, qty: 10, cost: products[9].cost },
	];
	const po1total = Math.round(po1lines.reduce((sum, l) => sum + l.qty * l.cost, 0));
	const po2lines = [{ productId: products[4].id, name: products[4].name, qty: 12, cost: products[4].cost }];
	const po2total = Math.round(po2lines.reduce((sum, l) => sum + l.qty * l.cost, 0));
	const po3lines = [{ productId: products[5].id, name: products[5].name, qty: 4, cost: products[5].cost }];
	const po3total = Math.round(po3lines.reduce((sum, l) => sum + l.qty * l.cost, 0));

	/* OC-000001: recibida y pagada hace una semana */
	store.collection("purchases").push({ id: uid(), number: "OC-000001", date: poDay(9), supplierId: suppliers[0].id, supplier: suppliers[0].name, lines: po1lines, total: po1total, status: "pagada" });
	store.collection("entries").push({ id: uid(), date: poDay(8), memo: "Recepción OC-000001 — " + suppliers[0].name, lines: [
		{ account: "1.4 Mercaderías", debit: po1total, credit: 0 },
		{ account: "2.2 Proveedores", debit: 0, credit: po1total },
	] });
	store.collection("entries").push({ id: uid(), date: poDay(7), memo: "Pago OC-000001 — " + suppliers[0].name, lines: [
		{ account: "2.2 Proveedores", debit: po1total, credit: 0 },
		{ account: "1.1 Caja", debit: 0, credit: po1total },
	] });
	store.collection("cash").push({ id: uid(), date: poDay(7), memo: "Pago OC-000001 — " + suppliers[0].name, amount: -po1total, method: "transferencia" });

	/* OC-000002: recibida, deuda viva con el proveedor */
	store.collection("purchases").push({ id: uid(), number: "OC-000002", date: poDay(3), supplierId: suppliers[1].id, supplier: suppliers[1].name, lines: po2lines, total: po2total, status: "recibida" });
	store.collection("entries").push({ id: uid(), date: poDay(2), memo: "Recepción OC-000002 — " + suppliers[1].name, lines: [
		{ account: "1.4 Mercaderías", debit: po2total, credit: 0 },
		{ account: "2.2 Proveedores", debit: 0, credit: po2total },
	] });

	/* OC-000003: pendiente de recepción */
	store.collection("purchases").push({ id: uid(), number: "OC-000003", date: poDay(1), supplierId: suppliers[2].id, supplier: suppliers[2].name, lines: po3lines, total: po3total, status: "pendiente" });
	store.setCounter("purchase", 3);

	store.setCounter("invoice", n - 1);
	store.setCounter("order", 44);
	store.mark();
	store.flush();
};
