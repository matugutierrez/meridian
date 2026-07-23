App.route("reports", {
	title: "Reportes",
	icon: "",
	render(el) {
		el.innerHTML = '<div class="card muted">Calculando reportes en el servidor…</div>';

		Promise.all([
			API.get_("/api/reports/income"),
			API.get_("/api/reports/ledger"),
			API.get_("/api/reports/iva"),
		]).then(([incomeRes, ledgerRes, ivaRes]) => {
			const income = incomeRes.data, ledger = ledgerRes.data, iva = ivaRes.data;

			const revRows = income.revenue.map((a) => "<tr><td>" + UI.esc(a.account) + '</td><td class="num">' + UI.fmt(a.amount) + "</td></tr>").join("");
			const expRows = income.expenses.map((a) => "<tr><td>" + UI.esc(a.account) + '</td><td class="num">' + UI.fmt(a.amount) + "</td></tr>").join("");

			const ledgerRows = ledger.rows.map((a) =>
				"<tr><td><strong>" + UI.esc(a.account) + '</strong></td><td class="num">' + UI.fmt(a.debit) + '</td><td class="num">' + UI.fmt(a.credit) + '</td><td class="num"><strong style="color:' + (a.balance >= 0 ? "var(--ok)" : "var(--err)") + '">' + UI.fmt(a.balance) + '</strong></td><td class="num muted">' + a.movements + "</td></tr>"
			).join("");

			const ivaRows = iva.periods.map((p) =>
				"<tr><td><strong>" + p.period + '</strong></td><td class="num">' + p.count + '</td><td class="num">' + UI.fmt(p.net) + '</td><td class="num"><strong>' + UI.fmt(p.iva) + "</strong></td></tr>"
			).join("");

			const exportables = ["invoices", "entries", "products", "customers", "cash", "purchases"];
			const exportBtns = exportables.map((c) => '<button class="btn small ghost" data-csv="' + c + '">' + c + ".csv</button>").join(" ");

			el.innerHTML =
				'<div class="grid kpi">' +
				'<div class="card kpi"><h3>Ingresos</h3><div class="big">' + UI.fmt(income.totalRevenue) + "</div></div>" +
				'<div class="card kpi"><h3>Costos y gastos</h3><div class="big">' + UI.fmt(income.totalExpenses) + "</div></div>" +
				'<div class="card kpi"><h3>Resultado neto</h3><div class="big" style="color:' + (income.netIncome >= 0 ? "var(--ok)" : "var(--err)") + '">' + UI.fmt(income.netIncome) + "</div></div>" +
				'<div class="card kpi"><h3>Partida doble</h3><div class="big">' + (ledger.balanced ? "" : "") + '</div><div class="sub">' + (ledger.balanced ? "debe = haber en todo el libro" : "¡descuadrado!") + "</div></div></div>" +

				'<div class="section"><div class="section-head"><h2>Estado de resultados</h2></div><div class="grid two">' +
				'<div class="card"><h3>Ingresos</h3><table><tbody>' + revRows + "</tbody></table></div>" +
				'<div class="card"><h3>Costos y gastos</h3><table><tbody>' + expRows + "</tbody></table></div>" +
				"</div></div>" +

				'<div class="section"><div class="section-head"><h2>Libro mayor</h2><span class="muted" style="font-size:13px">Debe ' + UI.fmt(ledger.totalDebit) + " · Haber " + UI.fmt(ledger.totalCredit) + "</span></div>" +
				"<table><thead><tr><th>Cuenta</th><th class=\"num\">Debe</th><th class=\"num\">Haber</th><th class=\"num\">Saldo</th><th class=\"num\">Mov.</th></tr></thead><tbody>" + ledgerRows + "</tbody></table></div>" +

				'<div class="section"><div class="section-head"><h2>Posición de IVA (débito fiscal)</h2></div>' +
				"<table><thead><tr><th>Período</th><th class=\"num\">Comprobantes</th><th class=\"num\">Neto gravado</th><th class=\"num\">IVA 21%</th></tr></thead><tbody>" + ivaRows + "</tbody></table></div>" +

				'<div class="section"><div class="section-head"><h2>Exportar datos</h2><span class="muted" style="font-size:13px">CSV generado por el servidor</span></div><div class="card">' + exportBtns + "</div></div>";

			el.querySelectorAll("[data-csv]").forEach((b) => {
				b.onclick = async () => {
					try {
						const res = await fetch("/api/reports/export/" + b.dataset.csv, { headers: { Authorization: "Bearer " + API.token } });
						if (!res.ok) throw new Error("Error " + res.status);
						const blob = await res.blob();
						const a = document.createElement("a");
						a.href = URL.createObjectURL(blob);
						a.download = "meridian-" + b.dataset.csv + ".csv";
						a.click();
						URL.revokeObjectURL(a.href);
					} catch (e) { UI.toast(e.message); }
				};
			});
		}).catch((e) => {
			el.innerHTML = '<div class="card muted">No se pudieron cargar los reportes: ' + UI.esc(e.message) + "</div>";
		});
	},
});
