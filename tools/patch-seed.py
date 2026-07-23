ROOT = "/data/meridian/fullstack"
s = open(ROOT + "/app/seed.js").read()

block = '''
\t/* Proveedores y \u00f3rdenes de compra (con su historia contable) */
\tconst suppliers = [
\t\t{ id: uid(), name: "TecnoImport SA", cuit: "30-71555666-7", email: "ventas@tecnoimport.com.ar", phone: "011-4555-1000", terms: "Cta cte 30 d\u00edas" },
\t\t{ id: uid(), name: "Mayorista Norte SRL", cuit: "30-70888999-1", email: "pedidos@mayoristanorte.ar", phone: "011-4777-2000", terms: "Cta cte 15 d\u00edas" },
\t\t{ id: uid(), name: "Muebles del Sur", cuit: "30-69333444-5", email: "info@mueblesdelsur.ar", phone: "0291-455-3000", terms: "Contado" },
\t\t{ id: uid(), name: "Log\u00edstica Pampa", cuit: "30-71222333-9", email: "admin@logpampa.com.ar", phone: "011-4999-4000", terms: "Cta cte 60 d\u00edas" },
\t];
\tstore.collection("suppliers").push(...suppliers);

\tconst poDay = (offset) => new Date(Date.now() - offset * 86400000).toISOString();
\tconst po1lines = [
\t\t{ productId: products[0].id, name: products[0].name, qty: 5, cost: products[0].cost },
\t\t{ productId: products[9].id, name: products[9].name, qty: 10, cost: products[9].cost },
\t];
\tconst po1total = Math.round(po1lines.reduce((sum, l) => sum + l.qty * l.cost, 0));
\tconst po2lines = [{ productId: products[4].id, name: products[4].name, qty: 12, cost: products[4].cost }];
\tconst po2total = Math.round(po2lines.reduce((sum, l) => sum + l.qty * l.cost, 0));
\tconst po3lines = [{ productId: products[5].id, name: products[5].name, qty: 4, cost: products[5].cost }];
\tconst po3total = Math.round(po3lines.reduce((sum, l) => sum + l.qty * l.cost, 0));

\t/* OC-000001: recibida y pagada hace una semana */
\tstore.collection("purchases").push({ id: uid(), number: "OC-000001", date: poDay(9), supplierId: suppliers[0].id, supplier: suppliers[0].name, lines: po1lines, total: po1total, status: "pagada" });
\tstore.collection("entries").push({ id: uid(), date: poDay(8), memo: "Recepci\u00f3n OC-000001 \u2014 " + suppliers[0].name, lines: [
\t\t{ account: "1.4 Mercader\u00edas", debit: po1total, credit: 0 },
\t\t{ account: "2.2 Proveedores", debit: 0, credit: po1total },
\t] });
\tstore.collection("entries").push({ id: uid(), date: poDay(7), memo: "Pago OC-000001 \u2014 " + suppliers[0].name, lines: [
\t\t{ account: "2.2 Proveedores", debit: po1total, credit: 0 },
\t\t{ account: "1.1 Caja", debit: 0, credit: po1total },
\t] });
\tstore.collection("cash").push({ id: uid(), date: poDay(7), memo: "Pago OC-000001 \u2014 " + suppliers[0].name, amount: -po1total, method: "transferencia" });

\t/* OC-000002: recibida, deuda viva con el proveedor */
\tstore.collection("purchases").push({ id: uid(), number: "OC-000002", date: poDay(3), supplierId: suppliers[1].id, supplier: suppliers[1].name, lines: po2lines, total: po2total, status: "recibida" });
\tstore.collection("entries").push({ id: uid(), date: poDay(2), memo: "Recepci\u00f3n OC-000002 \u2014 " + suppliers[1].name, lines: [
\t\t{ account: "1.4 Mercader\u00edas", debit: po2total, credit: 0 },
\t\t{ account: "2.2 Proveedores", debit: 0, credit: po2total },
\t] });

\t/* OC-000003: pendiente de recepci\u00f3n */
\tstore.collection("purchases").push({ id: uid(), number: "OC-000003", date: poDay(1), supplierId: suppliers[2].id, supplier: suppliers[2].name, lines: po3lines, total: po3total, status: "pendiente" });
\tstore.setCounter("purchase", 3);

'''

anchor = "\tstore.setCounter(\"invoice\", n - 1);"
assert anchor in s, "anchor setCounter no encontrado"
s = s.replace(anchor, block + anchor)
open(ROOT + "/app/seed.js", "w").write(s)
print("seed OK")
