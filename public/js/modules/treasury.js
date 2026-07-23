App.route("treasury", {
	title: "Tesorería",
	icon: "",
	render(el) {
		const moves = DB.all("cash").slice().reverse();
		const balance = Biz.cashBalance();
		const today = moves.filter((m) => new Date(m.date).toDateString() === new Date().toDateString());
		const todayTotal = today.reduce((s, m) => s + m.amount, 0);

		const rows = moves.slice(0, 40).map((m) =>
			"<tr><td>" + UI.dateFull(m.date) + "</td><td>" + UI.esc(m.memo) + "</td><td>" + UI.badge(m.method, "info") + '</td><td class="num"><strong style="color:' + (m.amount >= 0 ? "var(--ok)" : "var(--err)") + '">' + (m.amount >= 0 ? "+" : "") + UI.fmt(m.amount) + "</strong></td></tr>"
		).join("");

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Saldo de caja</h3><div class="big">' + UI.fmt(balance) + "</div></div>" +
			'<div class="card kpi"><h3>Movimientos de hoy</h3><div class="big">' + (todayTotal >= 0 ? "+" : "") + UI.fmt(todayTotal) + '</div><div class="sub">' + today.length + " operaciones</div></div></div>" +
			'<div class="section"><div class="section-head"><h2>Movimientos</h2><button class="btn" id="btn-new-move">+ Registrar movimiento</button></div>' +
			"<table><thead><tr><th>Fecha</th><th>Concepto</th><th>Medio</th><th class=\"num\">Importe</th></tr></thead><tbody>" + rows + "</tbody></table></div>";

		el.querySelector("#btn-new-move").onclick = () => {
			UI.form("Registrar movimiento manual", [
				{ id: "kind", label: "Tipo", type: "select", options: [{ value: "in", label: "Ingreso" }, { value: "out", label: "Egreso" }] },
				{ id: "memo", label: "Concepto", placeholder: "Ej: pago de alquiler" },
				{ id: "amount", label: "Importe (ARS)", type: "number", value: 0, min: 0 },
				{ id: "method", label: "Medio", type: "select", options: ["efectivo", "transferencia", "tarjeta"].map((m) => ({ value: m, label: m })) },
			], async (v) => {
				if (!v.amount || !v.memo) return UI.toast("Completá concepto e importe");
				try {
					await Biz.cashMove({ kind: v.kind, memo: v.memo, amount: v.amount, method: v.method });
					UI.close();
					UI.toast("Movimiento registrado con su asiento");
					App.refresh();
				} catch (e) {
					UI.toast(e.message);
				}
			}, "Registrar");
		};
	},
});
