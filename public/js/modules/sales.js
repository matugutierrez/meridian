App.route("sales", {
	title: "Ventas",
	icon: "",
	render(el) {
		const orders = DB.all("orders").slice().reverse();
		const rows = orders.map((o) =>
			"<tr><td><strong>PED-" + o.number + "</strong></td><td>" + UI.date(o.date) + "</td><td>" + UI.esc(o.customer) + "</td><td>" + o.lines.length + ' ítems</td><td class="num">' + UI.fmt(o.total) + "</td><td>" + UI.statusBadge(o.status) + "</td><td>" + (o.invoiceNumber ? '<span class="muted">Fact. ' + o.invoiceNumber + "</span>" : "") + "</td></tr>"
		).join("");

		el.innerHTML =
			'<div class="section-head"><h2>Pedidos de venta</h2><button class="btn" id="btn-new-order">+ Nuevo pedido</button></div>' +
			(orders.length
				? "<table><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Líneas</th><th class=\"num\">Total</th><th>Estado</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>"
				: '<div class="card muted">Todavía no hay pedidos. Creá el primero: al confirmarlo el servidor descuenta stock, factura a cuenta corriente y genera los asientos contables solos.</div>');

		el.querySelector("#btn-new-order").onclick = () => openOrderModal();

		function openOrderModal() {
			const products = DB.all("products");
			const customers = DB.all("customers");
			let lines = [];

			const prodOpts = products.map((p) => '<option value="' + p.id + '">' + UI.esc(p.name) + " (" + UI.fmt(p.price) + " · stock " + p.stock + ")</option>").join("");
			const custOpts = customers.map((c) => '<option value="' + c.id + '">' + UI.esc(c.name) + "</option>").join("");

			UI.show("Nuevo pedido de venta",
				'<div class="f"><label>Cliente</label><select id="o-cust">' + custOpts + "</select></div>" +
				'<div class="f"><label>Agregar producto</label><div style="display:flex;gap:8px"><select id="o-prod" style="flex:1">' + prodOpts + '</select><input id="o-qty" type="number" value="1" min="1" style="width:70px"><button class="btn" id="o-add">+</button></div></div>' +
				'<div id="o-lines"></div>' +
				'<div class="cart"><div class="total"><span>Total (IVA inc.)</span><span id="o-total">$ 0</span></div></div>' +
				'<div class="actions"><button class="btn ghost" id="o-cancel">Cancelar</button><button class="btn" id="o-confirm" disabled>Confirmar pedido</button></div>',
				{ wide: true, onMount(body) {
					const redraw = () => {
						const t = Biz.totals(lines);
						body.querySelector("#o-lines").innerHTML = lines.map((l, i) =>
							'<div class="line" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>' + l.qty + " × " + UI.esc(l.name) + '</span><span>' + UI.fmt(l.qty * l.price) + ' <button class="btn small danger" data-rm="' + i + '">×</button></span></div>'
						).join("");
						body.querySelector("#o-total").textContent = UI.fmt(t.total);
						body.querySelector("#o-confirm").disabled = lines.length === 0;
						body.querySelectorAll("[data-rm]").forEach((b) => { b.onclick = () => { lines.splice(Number(b.dataset.rm), 1); redraw(); }; });
					};
					body.querySelector("#o-add").onclick = () => {
						const p = DB.get("products", body.querySelector("#o-prod").value);
						const qty = Number(body.querySelector("#o-qty").value) || 1;
						if (qty > p.stock) UI.toast("Stock insuficiente: quedan " + p.stock);
						const ex = lines.find((l) => l.productId === p.id);
						if (ex) ex.qty += qty; else lines.push({ productId: p.id, name: p.name, qty, price: p.price });
						redraw();
					};
					body.querySelector("#o-cancel").onclick = UI.close;
					body.querySelector("#o-confirm").onclick = async () => {
						const btn = body.querySelector("#o-confirm");
						btn.disabled = true;
						btn.textContent = "Confirmando…";
						const custId = body.querySelector("#o-cust").value;
						try {
							const res = await Biz.createOrder({ customerId: custId, lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })) });
							UI.close();
							UI.toast("Pedido PED-" + res.order.number + " confirmado — factura " + res.invoice.number + " a cuenta corriente");
							App.refresh();
						} catch (e) {
							UI.toast(e.message);
							btn.disabled = false;
							btn.textContent = "Confirmar pedido";
						}
					};
				} });
		}
	},
});
