const makeService = require("./service");
const { NotFound } = require("../../core/errors");

module.exports = (app) => {
	const service = makeService(app);
	app.services.reports = service;
	app.router.get("/api/bootstrap", app.auth, (ctx) => ctx.json(200, { data: service.bootstrap() }));
	app.router.get("/api/reports/dashboard", app.auth, (ctx) => ctx.json(200, { data: service.dashboard() }));
	app.router.get("/api/reports/ledger", app.auth, (ctx) => ctx.json(200, { data: service.ledger() }));
	app.router.get("/api/reports/income", app.auth, (ctx) => ctx.json(200, { data: service.income() }));
	app.router.get("/api/reports/iva", app.auth, (ctx) => ctx.json(200, { data: service.iva() }));

	app.router.get("/api/reports/export/:collection", app.auth, (ctx) => {
		const csv = service.csv(ctx.params.collection);
		if (csv === null) throw new NotFound("Colección no exportable: " + ctx.params.collection);
		ctx.state.streaming = true;
		ctx.res.writeHead(200, {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": 'attachment; filename="meridian-' + ctx.params.collection + '.csv"',
		});
		ctx.res.end("\uFEFF" + csv);
	});
};
