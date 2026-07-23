const makeService = require("./service");
const makeController = require("./controller");

module.exports = (app) => {
	const service = makeService(app);
	app.services.sales = service;
	const c = makeController(service);
	app.router.post("/api/sales", app.auth, c.registerSale);
	app.router.post("/api/sales/orders", app.auth, c.createOrder);
	app.router.post("/api/invoices/:id/collect", app.auth, c.collect);
	app.router.post("/api/invoices/:id/void", app.auth, c.voidInvoice);
	app.router.post("/api/inventory/adjust", app.auth, c.adjustStock);
	app.router.post("/api/treasury/moves", app.auth, c.cashMove);
};
