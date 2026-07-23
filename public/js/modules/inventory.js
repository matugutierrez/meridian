App.route("inventory", {
	title: "Inventario",
	icon: "",
	render(el) {
		const products = DB.all("products");
		const totalValue = products.reduce((s, p) => s + p.cost * Math.max(p.stock, 0), 0);
		const low = products.filter((p) => p.stock <= p.min);

		const rows = products.map((p) =>
			"<tr><td><strong>" + UI.esc(p.sku) + "</strong></td><td>" + UI.esc(p.name) + "</td><td>" + UI.esc(p.cat) + '</td><td class="num">' + UI.fmt(p.cost) + '</td><td class="num">' + UI.fmt(p.price) + '</td><td class="num ' + (p.stock <= p.min ? "low" : "") + '">' + p.stock + (p.stock <= p.min ? " " : "") + '</td><td class="num muted">' + p.min + '</td><td><button class="btn small ghost" data-adj="' + p.id + '">Ajustar</button></td></tr>'
		).join("");

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Productos</h3><div class="big">' + products.length + "</div></div>" +
			'<div class="card kpi"><h3>Valor de inventario</h3><div class="big">' + UI.fmt(totalValue) + '</div><div class="sub">a costo</div></div>' +
			'<div class="card kpi"><h3>Bajo mínimo</h3><div class="big ' + (low.length ? "low" : "") + '">' + low.length + "</div></div></div>" +
			'<div class="section"><div class="section-head"><h2>Productos</h2><button class="btn" id="btn-new-prod">+ Nuevo producto</button></div>' +
			"<table><thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th class=\"num\">Costo</th><th class=\"num\">Precio neto</th><th class=\"num\">Stock</th><th class=\"num\">Mín.</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>";

		el.querySelectorAll("[data-adj]").forEach((b) => {
			b.onclick = () => {
				const p = DB.get("products", b.dataset.adj);
				UI.form("Ajustar stock: " + p.name, [
					{ id: "delta", label: "Ajuste (+ ingreso / − egreso)", type: "number", value: 0 },
					{ id: "reason", label: "Motivo", type: "select", options: ["Recepción de compra", "Conteo físico", "Rotura/merma", "Devolución"].map((s) => ({ value: s, label: s })) },
				], async (v) => {
					if (!v.delta) return UI.toast("Ingresá una cantidad distinta de 0");
					try {
						const updated = await Biz.adjustStock(p.id, v.delta, v.reason);
						UI.close();
						UI.toast("Stock ajustado: " + p.name + "  " + updated.stock);
						App.refresh();
					} catch (e) {
						UI.toast(e.message);
					}
				}, "Ajustar");
			};
		});

		el.querySelector("#btn-new-prod").onclick = () => {
			UI.form("Nuevo producto", [
				{ id: "sku", label: "SKU", placeholder: "XX-000" },
				{ id: "name", label: "Nombre" },
				{ id: "cat", label: "Categoría", value: "General" },
				{ id: "cost", label: "Costo (ARS)", type: "number", value: 0, min: 0 },
				{ id: "price", label: "Precio neto (ARS)", type: "number", value: 0, min: 0 },
				{ id: "stock", label: "Stock inicial", type: "number", value: 0, min: 0 },
				{ id: "min", label: "Stock mínimo", type: "number", value: 5, min: 0 },
			], (v) => {
				if (!v.name || !v.sku) return UI.toast("Completá SKU y nombre");
				DB.add("products", v);
				UI.close(); UI.toast("Producto creado"); App.refresh();
			});
		};
	},
});
