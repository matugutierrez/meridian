const started = Date.now();

module.exports = (app) => {
	app.router.get("/api/health", (ctx) =>
		ctx.json(200, {
			status: "ok",
			uptimeSeconds: Math.round((Date.now() - started) / 1000),
			collections: {
				products: app.store.collection("products").length,
				invoices: app.store.collection("invoices").length,
				entries: app.store.collection("entries").length,
			},
		}),
	);
};
