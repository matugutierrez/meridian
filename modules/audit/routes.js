const Repository = require("../../core/db/repository");

module.exports = (app) => {
	const audit = new Repository(app.store, "audit");

	/* Listener universal: cualquier evento emitido por cualquier módulo queda registrado */
	app.bus.on("*", (event, payload) => {
		try {
			audit.insert({
				at: new Date().toISOString(),
				event,
				summary: summarize(event, payload),
			});
			/* Techo de retención para que el archivo no crezca sin límite */
			const rows = app.store.collection("audit");
			if (rows.length > 500) rows.splice(0, rows.length - 500);
		} catch (e) {
			app.logger.warn("No se pudo auditar " + event + ": " + e.message);
		}
	});

	app.router.get("/api/audit", app.auth, app.requireRole("admin"), (ctx) => {
		const limit = Math.min(Number(ctx.query.limit) || 100, 500);
		const rows = app.store.collection("audit");
		ctx.json(200, { data: rows.slice(-limit).reverse() });
	});
};

function summarize(event, payload) {
	if (!payload || typeof payload !== "object") return "";
	const p = payload;
	if (p.number && p.total != null) return p.number + " — total " + p.total;
	if (p.name) return String(p.name);
	if (p.memo) return String(p.memo);
	if (p.invoiceId) return "factura " + p.invoiceId;
	if (p.id) return "id " + p.id;
	return "";
}
