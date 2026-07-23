App.route("purchases", {
	title: "Compras",
	icon: "",
	render(el) {
		const purchases = DB.all("purchases").slice().reverse();
		const suppliers = DB.all("suppliers");
		const payables = purchases.filter((p) => p.status === "recibida").reduce((s, p) => s + p.total, 0);

		const rows = purchases.map((o) =>
			"<tr><td><strong>" + UI.esc(o.number) + "</strong></td><td>" + UI.date(o.date) + "</td><td>" + UI.esc(o.supplier) + "</td><td>" + o.lines.length + ' ítems</td><td class="num">' + UI.fmt(o.total) + "</td><td>" + UI.statusBadge(o.status) + "</td><td>" +
			(o.status === "pendiente" ? '<button class="btn small" data-receive="' + o.id + '">Recibir</button> <button class="btn small ghost" data-cancel="' + o.id + '">Cancelar</button>' : "") +
			(o.status === "recibida" ? '<button class="btn small" data-pay="' + o.id + '">Pagar</button>' : "") +
			"</td></tr>"
		).join("");

		const supRows = suppliers.map((s) =>
			"<tr><td><strong>" + UI.esc(s.name) + "</strong></td><td>" + UI.esc(s.cuit) + "</td><td>" + UI.esc(s.email) + "</td><td>" + UI.esc(s.phone || "—") + "</td><td>" + UI.badge(s.terms, "info") + "</td></tr>"
		).join("");

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Órdenes de compra</h3><div class="big">' + purchases.length + "</div></div>" +
			'<div class="card kpi"><h3>Deuda con proveedores</h3><div class="big">' + UI.fmt(payables) + '</div><div class="sub">órdenes recibidas sin pagar</div></div>' +
			'<div class="card kpi"><h3>Proveedores</h3><div class="big">' + suppliers.length + "</div></div></div>" +
			'<div class="section"><div class="section-head"><h2>Órdenes de compra</h2><button class="btn" id="btn-new-po">+ Nueva orden</button></div>' +
			(purchases.length
				? "<table><thead><tr><th>Número</th><th>Fecha</th><th>Proveedor</th><th>Líneas</th><th class=\"num\">Total</th><th>Estado</th><th></th></tr></thead><tbody>" + rows + "</tbody></table>"
				: '<div class="card muted">Sin órdenes todavía. Al recibir una orden el servidor suma stock, actualiza el costo de reposición y asienta la deuda con el proveedor.</div>') +
			"</div>" +
			'<div class="section"><div class="section-head"><h2>Proveedores</h2><button class="btn ghost" id="btn-new-sup">+ Nuevo proveedor</button></div>' +
			"<table><thead><tr><th>Nombre</th><th>CUIT</th><th>Email</th><th>Teléfono</th><th>Condición</th></tr></thead><tbody>" + supRows + "</tbody></table></div>";

		el.querySelectorAll("[data-receive]").forEach((b) => {
			b.onclick = async () => {
				try {
					const r = await API.post("/api/purchases/" + b.dataset.receive + "/receive");
					await DB.reload();
					UI.toast(r.data.number + " recibida — stock y deuda asentados");
					App.refresh();
				} catch (e) { UI.toast(e.message); }
			};
		});
		el.querySelectorAll("[data-pay]").forEach((b) => {
			b.onclick = () => {
				const po = DB.get("purchases", b.dataset.pay);
				UI.form("Pagar " + po.number + " — " + UI.fmt(po.total), [
					{ id: "method", label: "Medio de pago", type: "select", options: ["transferencia", "efectivo", "cheque"].map((m) => ({ value: m, label: m })) },
				], async (v) => {
					try {
						await API.post("/api/purchases/" + po.id + "/pay", { method: v.method });
						await DB.reload();
						UI.close();
						UI.toast(po.number + " pagada — caja y proveedores actualizados");
						App.refresh();
					} catch (e) { UI.toast(e.message); }
				}, "Pagar");
			};
		});
		el.querySelectorAll("[data-cancel]").forEach((b) => {
			b.onclick = async () => {
				if (!confirm("¿Cancelar esta orden pendiente?")) return;
				try {
					await API.post("/api/purchases/" + b.dataset.cancel + "/cancel");
					await DB.reload();
					UI.toast("Orden cancelada");
					App.refresh();
				} catch (e) { UI.toast(e.message); }
			};
		});

		el.querySelector("#btn-new-sup").onclick = () => {
			UI.form("Nuevo proveedor", [
				{ id: "name", label: "Razón social" },
				{ id: "cuit", label: "CUIT", placeholder: "30-00000000-0" },
				{ id: "email", label: "Email" },
				{ id: "phone", label: "Teléfono" },
				{ id: "terms", label: "Condición", type: "select", options: ["Contado", "Cta cte 15 días", "Cta cte 30 días", "Cta cte 60 días"].map((t) => ({ value: t, label: t })) },
			], (v) => {
				if (!v.name) return UI.toast("Completá la razón social");
				DB.add("suppliers", v);
				UI.close(); UI.toast("Proveedor creado"); App.refresh();
			});
		};

		el.querySelector("#btn-new-po").onclick = () => {
			const products = DB.all("products");
			let lines = [];
			const supOpts = suppliers.map((s) => '<option value="' + s.id + '">' + UI.esc(s.name) + "</option>").join("");
			const prodOpts = products.map((p) => '<option value="' + p.id + '">' + UI.esc(p.name) + " (costo " + UI.fmt(p.cost) + ")</option>").join("");

			UI.show("Nueva orden de compra",
				'<div class="f"><label>Proveedor</label><select id="po-sup">' + supOpts + "</select></div>" +
				'<div class="f"><label>Agregar producto</label><div style="display:flex;gap:8px"><select id="po-prod" style="flex:1">' + prodOpts + '</select><input id="po-qty" type="number" value="1" min="1" style="width:70px"><button class="btn" id="po-add">+</button></div></div>' +
				'<div id="po-lines"></div>' +
				'<div class="cart"><div class="total"><span>Total (a costo)</span><span id="po-total">$ 0</span></div></div>' +
				'<div class="actions"><button class="btn ghost" id="po-cancel">Cancelar</button><button class="btn" id="po-confirm" disabled>Crear orden</button></div>',
				{ wide: true, onMount(body) {
					const redraw = () => {
						const total = Math.round(lines.reduce((s, l) => s + l.qty * l.cost, 0));
						body.querySelector("#po-lines").innerHTML = lines.map((l, i) =>
							'<div class="line" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span>' + l.qty + " × " + UI.esc(l.name) + '</span><span>' + UI.fmt(l.qty * l.cost) + ' <button class="btn small danger" data-rm="' + i + '">×</button></span></div>'
						).join("");
						body.querySelector("#po-total").textContent = UI.fmt(total);
						body.querySelector("#po-confirm").disabled = lines.length === 0;
						body.querySelectorAll("[data-rm]").forEach((b) => { b.onclick = () => { lines.splice(Number(b.dataset.rm), 1); redraw(); }; });
					};
					body.querySelector("#po-add").onclick = () => {
						const p = DB.get("products", body.querySelector("#po-prod").value);
						const qty = Number(body.querySelector("#po-qty").value) || 1;
						const ex = lines.find((l) => l.productId === p.id);
						if (ex) ex.qty += qty; else lines.push({ productId: p.id, name: p.name, qty, cost: p.cost });
						redraw();
					};
					body.querySelector("#po-cancel").onclick = UI.close;
					body.querySelector("#po-confirm").onclick = async () => {
						const btn = body.querySelector("#po-confirm");
						btn.disabled = true;
						btn.textContent = "Creando…";
						try {
							const r = await API.post("/api/purchases", { supplierId: body.querySelector("#po-sup").value, lines: lines.map((l) => ({ productId: l.productId, qty: l.qty, cost: l.cost })) });
							await DB.reload();
							UI.close();
							UI.toast(r.data.number + " creada — pendiente de recepción");
							App.refresh();
						} catch (e) {
							UI.toast(e.message);
							btn.disabled = false;
							btn.textContent = "Crear orden";
						}
					};
				} });
		};
	},
});
