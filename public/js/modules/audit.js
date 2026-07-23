App.route("audit", {
	title: "Auditoría",
	icon: "",
	render(el) {
		el.innerHTML = '<div class="card muted">Cargando auditoría…</div>';
		API.get_("/api/audit?limit=200").then((res) => {
			const rows = res.data.map((a) =>
				"<tr><td>" + UI.dateFull(a.at) + "</td><td>" + UI.badge(a.event, "info") + '</td><td class="muted">' + UI.esc(a.summary || "") + "</td></tr>"
			).join("");
			el.innerHTML =
				'<div class="section"><div class="section-head"><h2>Eventos de dominio</h2><span class="muted" style="font-size:13px">Cada operación del sistema deja rastro automáticamente · últimos ' + res.data.length + " eventos</span></div>" +
				(res.data.length
					? "<table><thead><tr><th>Momento</th><th>Evento</th><th>Detalle</th></tr></thead><tbody>" + rows + "</tbody></table>"
					: '<div class="card muted">Todavía no hay eventos registrados. Hacé una venta o un ajuste y volvé.</div>') +
				"</div>";
		}).catch((e) => {
			el.innerHTML = '<div class="card muted"> ' + UI.esc(e.message) + " — la auditoría es solo para administradores.</div>";
		});
	},
});
