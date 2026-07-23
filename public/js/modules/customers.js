App.route("customers", {
	title: "Clientes",
	icon: "",
	render(el) {
		const customers = DB.all("customers");
		const rows = customers.map((c) => {
			const bal = Biz.balance(c.id);
			const count = DB.all("invoices").filter((i) => i.customerId === c.id && i.status !== "anulada").length;
			return "<tr><td><strong>" + UI.esc(c.name) + "</strong></td><td>" + UI.esc(c.cuit) + "</td><td>" + UI.esc(c.email) + "</td><td>" + UI.esc(c.terms) + '</td><td class="num">' + count + '</td><td class="num ' + (bal > 0 ? "low" : "") + '">' + UI.fmt(bal) + "</td></tr>";
		}).join("");

		const totalDebt = customers.reduce((s, c) => s + Biz.balance(c.id), 0);

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Clientes</h3><div class="big">' + customers.length + "</div></div>" +
			'<div class="card kpi"><h3>Cuenta corriente total</h3><div class="big">' + UI.fmt(totalDebt) + '</div><div class="sub">pendiente de cobro</div></div></div>' +
			'<div class="section"><div class="section-head"><h2>Cartera</h2><button class="btn" id="btn-new-cust">+ Nuevo cliente</button></div>' +
			"<table><thead><tr><th>Razón social</th><th>CUIT</th><th>Email</th><th>Condición</th><th class=\"num\">Comprobantes</th><th class=\"num\">Saldo cta cte</th></tr></thead><tbody>" + rows + "</tbody></table></div>";

		el.querySelector("#btn-new-cust").onclick = () => {
			UI.form("Nuevo cliente", [
				{ id: "name", label: "Razón social" },
				{ id: "cuit", label: "CUIT", placeholder: "30-00000000-0" },
				{ id: "email", label: "Email" },
				{ id: "terms", label: "Condición de venta", type: "select", options: ["Contado", "Cta cte 15 días", "Cta cte 30 días", "Cta cte 60 días"].map((t) => ({ value: t, label: t })) },
			], (v) => {
				if (!v.name) return UI.toast("Ingresá la razón social");
				DB.add("customers", v);
				UI.close(); UI.toast("Cliente creado"); App.refresh();
			});
		};
	},
});
