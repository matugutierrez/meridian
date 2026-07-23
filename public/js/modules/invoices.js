App.route("invoices", {
	title: "Facturación",
	icon: "",
	render(el) {
		const invoices = DB.all("invoices").slice().reverse();
		const pend = invoices.filter((i) => i.status === "pendiente");
		const month = invoices.filter((i) => new Date(i.date).getMonth() === new Date().getMonth() && i.status !== "anulada");

		const rows = invoices.map((i) =>
			"<tr><td><strong>" + UI.esc(i.number) + "</strong></td><td>" + UI.dateFull(i.date) + "</td><td>" + UI.esc(i.customer) + '</td><td class="num">' + UI.fmt(i.net) + '</td><td class="num">' + UI.fmt(i.iva) + '</td><td class="num"><strong>' + UI.fmt(i.total) + "</strong></td><td>" + UI.statusBadge(i.status) + '</td><td class="muted" style="font-size:12px">' + UI.esc(i.cae) + "</td><td>" +
			(i.status === "pendiente" ? '<button class="btn small" data-collect="' + i.id + '">Cobrar</button>' : "") +
			(i.status !== "anulada" ? ' <button class="btn small ghost" data-void="' + i.id + '">Anular</button>' : "") +
			"</td></tr>"
		).join("");

		el.innerHTML =
			'<div class="grid kpi">' +
			'<div class="card kpi"><h3>Emitidas este mes</h3><div class="big">' + month.length + '</div><div class="sub">' + UI.fmt(month.reduce((s, i) => s + i.total, 0)) + "</div></div>" +
			'<div class="card kpi"><h3>Pendientes de cobro</h3><div class="big">' + pend.length + '</div><div class="sub">' + UI.fmt(pend.reduce((s, i) => s + i.total, 0)) + "</div></div></div>" +
			'<div class="section"><div class="section-head"><h2>Comprobantes</h2><span class="muted" style="font-size:13px">Las facturas se emiten desde POS y Ventas · CAE simulado</span></div>' +
			"<table><thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th class=\"num\">Neto</th><th class=\"num\">IVA</th><th class=\"num\">Total</th><th>Estado</th><th>CAE</th><th></th></tr></thead><tbody>" + rows + "</tbody></table></div>";

		el.querySelectorAll("[data-collect]").forEach((b) => {
			b.onclick = () => {
				const inv = DB.get("invoices", b.dataset.collect);
				UI.form("Cobrar " + inv.number + " — " + UI.fmt(inv.total), [
					{ id: "method", label: "Medio de cobro", type: "select", options: ["efectivo", "tarjeta", "transferencia", "cheque"].map((m) => ({ value: m, label: m })) },
				], async (v) => {
					try {
						await Biz.collect(inv.id, v.method);
						UI.close();
						UI.toast("Cobro registrado — recibo + asiento + caja actualizados");
						App.refresh();
					} catch (e) {
						UI.toast(e.message);
					}
				}, "Registrar cobro");
			};
		});
		el.querySelectorAll("[data-void]").forEach((b) => {
			b.onclick = async () => {
				const inv = DB.get("invoices", b.dataset.void);
				if (!confirm("¿Anular " + inv.number + "? Se emite nota de crédito y se reversa el asiento.")) return;
				try {
					await Biz.voidInvoice(inv.id);
					UI.toast("Comprobante anulado con reversa contable");
					App.refresh();
				} catch (e) {
					UI.toast(e.message);
				}
			};
		});
	},
});
