const schema = require("./schema");
const makeService = require("./service");
const makeController = require("./controller");

module.exports = (app) => {
	const service = makeService(app);
	app.services[schema.name] = service;
	const c = makeController(service);
	const base = "/api/" + schema.name;
	app.router.get(base, app.auth, c.list);
	app.router.get(base + "/:id", app.auth, c.get);
	app.router.post(base, app.auth, c.create);
	app.router.patch(base + "/:id", app.auth, c.update);
	app.router.delete(base + "/:id", app.auth, app.requireRole("admin"), c.remove);
};
