App.route("dashboard", {
	title: "Dashboard",
	icon: "",
	render(el) {
		const invoices = DB.all("invoices");
		const now = new Date();
		const monthInv = invoices.filter((i) => {
			const d = new Date(i.date);
			return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status !== "anulada";
		});
		const salesMonth = monthInv.reduce((s, i) => s + i.total, 0);
		const pending = invoices.filter((i) => i.status === "pendiente").reduce((s, i) => s + i.total, 0);
		const lowStock = DB.all("products").filter((p) => p.stock <= p.min);
		const openOpps = DB.all("opportunities").filter((o) => o.stage < 3);
		const oppTotal = openOpps.reduce((s, o) => s + o.amount, 0);

		const days = [];
		for (let i = 13; i >= 0; i--) {
			const d = new Date(Date.now() - i * 86400000);
			const key = d.toDateString();
			const total = invoices.filter((x) => new Date(x.date).toDateString() === key && x.status !== "anulada").reduce((s, x) => s + x.total, 0);
			days.push({ label: d.getDate() + "/" + (d.getMonth() + 1), total });
		}
		const max = Math.max(...days.map((d) => d.total), 1);
		const W = 900, H = 170, bw = W / days.length;
		const bars = days.map((d, i) => {
			const h = Math.round((d.total / max) * 120);
			return '<rect x="' + (i * bw + 6) + '" y="' + (140 - h) + '" width="' + (bw - 12) + '" height="' + h + '" rx="4"><title>' + d.label + ": " + UI.fmt(d.total) + "</title></rect>" +
				'<text x="' + (i * bw + bw / 2) + '" y="158" text-anchor="middle">' + d.label + "</text>";
		}).join("");

		const recent = invoices.slice(-6).reverse().map((i) =>
			"<tr><td>" + UI.esc(i.number) + "</td><td>" + UI.date(i.date) + "</td><td>" + UI.esc(i.customer) + '</td><td class="num">' + UI.fmt(i.total) + "</td><td>" + UI.statusBadge(i.status) + "</td></tr>"
		).join("");

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Ventas del mes</h3><div class="big">' + UI.fmt(salesMonth) + '</div><div class="sub">' + monthInv.length + " comprobantes</div></div>" +
			'<div class="card kpi"><h3>Por cobrar</h3><div class="big">' + UI.fmt(pending) + '</div><div class="sub">cuenta corriente pendiente</div></div>' +
			'<div class="card kpi"><h3>Pipeline abierto</h3><div class="big">' + UI.fmt(oppTotal) + '</div><div class="sub">' + openOpps.length + " oportunidades</div></div>" +
			'<div class="card kpi"><h3>Stock crítico</h3><div class="big ' + (lowStock.length ? "low" : "") + '">' + lowStock.length + '</div><div class="sub">productos bajo mínimo</div></div>' +
			"</div>" +
			'<div class="section card"><h3>Ventas últimos 14 días</h3><svg class="chart" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + bars + "</svg></div>" +
			'<div class="section"><div class="section-head"><h2>Últimos comprobantes</h2><button class="btn small ghost" onclick="App.go(\'invoices\')">Ver todos </button></div>' +
			"<table><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th class=\"num\">Total</th><th>Estado</th></tr></thead><tbody>" + recent + "</tbody></table></div>";
	},
});
