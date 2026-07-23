App.route("accounting", {
	title: "Contabilidad",
	icon: "",
	render(el) {
		const entries = DB.all("entries").slice().reverse();

		const accounts = {};
		DB.all("entries").forEach((e) => e.lines.forEach((l) => {
			if (!accounts[l.account]) accounts[l.account] = { debit: 0, credit: 0 };
			accounts[l.account].debit += l.debit;
			accounts[l.account].credit += l.credit;
		}));
		const names = Object.keys(accounts).sort();
		const balRows = names.map((a) => {
			const { debit, credit } = accounts[a];
			const saldo = debit - credit;
			return "<tr><td>" + UI.esc(a) + '</td><td class="num">' + UI.fmt(debit) + '</td><td class="num">' + UI.fmt(credit) + '</td><td class="num"><strong>' + UI.fmt(Math.abs(saldo)) + " " + (saldo >= 0 ? "D" : "H") + "</strong></td></tr>";
		}).join("");
		const totD = names.reduce((s, a) => s + accounts[a].debit, 0);
		const totC = names.reduce((s, a) => s + accounts[a].credit, 0);

		const diaryRows = entries.slice(0, 30).map((e) =>
			'<tr><td class="muted">' + UI.dateFull(e.date) + "</td><td>" + UI.esc(e.memo) + "</td><td>" +
			e.lines.map((l) => '<div style="display:flex;justify-content:space-between;gap:12px"><span' + (l.credit ? ' style="padding-left:22px"' : "") + ">" + UI.esc(l.account) + '</span><span class="num">' + (l.debit ? UI.fmt(l.debit) : "") + '</span><span class="num muted">' + (l.credit ? UI.fmt(l.credit) : "") + "</span></div>").join("") +
			"</td></tr>"
		).join("");

		el.innerHTML =
			'<div class="card" style="margin-bottom:20px"><h3>Balance de sumas y saldos</h3>' +
			'<table style="box-shadow:none;border:none"><thead><tr><th>Cuenta</th><th class="num">Debe</th><th class="num">Haber</th><th class="num">Saldo</th></tr></thead><tbody>' + balRows +
			'<tr><td><strong>TOTALES</strong></td><td class="num"><strong>' + UI.fmt(totD) + '</strong></td><td class="num"><strong>' + UI.fmt(totC) + '</strong></td><td class="num">' + (totD === totC ? UI.badge(" partida doble OK", "ok") : UI.badge("descuadre", "err")) + "</td></tr></tbody></table></div>" +
			'<div class="section-head"><h2>Libro diario</h2><span class="muted" style="font-size:13px">asientos automáticos generados por ventas, cobros y ajustes · últimos 30</span></div>' +
			"<table><thead><tr><th style=\"width:100px\">Fecha</th><th style=\"width:260px\">Concepto</th><th>Detalle (Debe / Haber)</th></tr></thead><tbody>" + diaryRows + "</tbody></table>";
	},
});
