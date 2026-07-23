(() => {
	const STAGES = ["Calificación", "Propuesta", "Negociación", "Ganada"];

	App.route("crm", {
		title: "CRM",
		icon: "",
		render(el) {
			const opps = DB.all("opportunities");
			const cols = STAGES.map((name, idx) => {
				const cards = opps.filter((o) => o.stage === idx).map((o) =>
					'<div class="kcard"><div>' + UI.esc(o.name) + '</div><div class="muted" style="font-size:12px">' + UI.esc(o.customer) + '</div><div class="amt">' + UI.fmt(o.amount) + '</div><div class="row">' +
					(idx < 3 ? '<button class="btn small" data-adv="' + o.id + '">Avanzar </button>' : UI.badge(" Ganada", "ok")) +
					"</div></div>"
				).join("");
				const sum = opps.filter((o) => o.stage === idx).reduce((s, o) => s + o.amount, 0);
				return '<div class="kcol"><h4>' + name + "<span>" + UI.fmt(sum) + "</span></h4>" + cards + "</div>";
			}).join("");

			const leads = DB.all("leads").map((l) =>
				"<tr><td><strong>" + UI.esc(l.name) + "</strong></td><td>" + UI.esc(l.contact) + "</td><td>" + UI.esc(l.source) + "</td><td>" + UI.statusBadge(l.status) + "</td><td>" + UI.esc(l.note) + '</td><td><button class="btn small" data-conv="' + l.id + '">Convertir</button></td></tr>'
			).join("");

			el.innerHTML =
				'<div class="section-head"><h2>Pipeline de oportunidades</h2><button class="btn" id="btn-new-opp">+ Nueva oportunidad</button></div>' +
				'<div class="kanban">' + cols + "</div>" +
				'<div class="section"><div class="section-head"><h2>Leads entrantes</h2><button class="btn ghost" id="btn-new-lead">+ Nuevo lead</button></div>' +
				"<table><thead><tr><th>Empresa</th><th>Contacto</th><th>Origen</th><th>Estado</th><th>Nota</th><th></th></tr></thead><tbody>" +
				(leads || '') + "</tbody></table></div>";

			el.querySelectorAll("[data-adv]").forEach((b) => {
				b.onclick = () => {
					const o = DB.get("opportunities", b.dataset.adv);
					DB.update("opportunities", o.id, { stage: o.stage + 1 });
					if (o.stage + 1 === 3) UI.toast("¡Oportunidad ganada! Creá el pedido desde Ventas.");
					App.refresh();
				};
			});
			el.querySelectorAll("[data-conv]").forEach((b) => {
				b.onclick = () => {
					const l = DB.get("leads", b.dataset.conv);
					UI.form("Convertir lead: " + l.name, [
						{ id: "name", label: "Nombre de la oportunidad", value: l.note || "Oportunidad " + l.name },
						{ id: "amount", label: "Monto estimado (ARS)", type: "number", value: 500000, min: 0 },
					], (v) => {
						DB.add("opportunities", { name: v.name, customer: l.name, amount: v.amount, stage: 0 });
						DB.add("customers", { name: l.name, cuit: "—", email: "—", terms: "Contado" });
						DB.remove("leads", l.id);
						UI.close();
						UI.toast("Lead convertido a oportunidad y cliente");
						App.refresh();
					}, "Convertir");
				};
			});
			el.querySelector("#btn-new-opp").onclick = () => {
				const custs = DB.all("customers").filter((c) => c.id !== "cf");
				UI.form("Nueva oportunidad", [
					{ id: "name", label: "Nombre", placeholder: "Ej: Renovación equipos" },
					{ id: "customer", label: "Cliente", type: "select", options: custs.map((c) => ({ value: c.name, label: c.name })) },
					{ id: "amount", label: "Monto estimado (ARS)", type: "number", value: 0, min: 0 },
				], (v) => {
					if (!v.name) return UI.toast("Ingresá un nombre");
					DB.add("opportunities", { name: v.name, customer: v.customer, amount: v.amount, stage: 0 });
					UI.close(); App.refresh();
				});
			};
			el.querySelector("#btn-new-lead").onclick = () => {
				UI.form("Nuevo lead", [
					{ id: "name", label: "Empresa" },
					{ id: "contact", label: "Contacto" },
					{ id: "source", label: "Origen", type: "select", options: ["Web", "Referido", "Instagram", "Llamada"].map((s) => ({ value: s, label: s })) },
					{ id: "note", label: "Nota" },
				], (v) => {
					if (!v.name) return UI.toast("Ingresá la empresa");
					DB.add("leads", { name: v.name, contact: v.contact, source: v.source, status: "nuevo", note: v.note });
					UI.close(); App.refresh();
				});
			};
		},
	});
})();
