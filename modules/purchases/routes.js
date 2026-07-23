const makeService = require("./service");

module.exports = (app) => {
	const service = makeService(app);
	app.services.purchases = service;
	app.router.get("/api/purchases", app.auth, (ctx) => ctx.json(200, { data: service.list() }));
	app.router.post("/api/purchases", app.auth, (ctx) => ctx.json(201, { data: service.create(ctx.body || {}) }));
	app.router.post("/api/purchases/:id/receive", app.auth, (ctx) => ctx.json(200, { data: service.receive(ctx.params.id) }));
	app.router.post("/api/purchases/:id/pay", app.auth, (ctx) => ctx.json(200, { data: service.pay(ctx.params.id, (ctx.body || {}).method) }));
	app.router.post("/api/purchases/:id/cancel", app.auth, (ctx) => ctx.json(200, { data: service.cancel(ctx.params.id) }));
};
