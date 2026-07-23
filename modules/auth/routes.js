const makeService = require("./service");
const makeController = require("./controller");

module.exports = (app) => {
	const service = makeService(app);
	app.services.auth = service;
	const c = makeController(service);
	app.router.post("/api/auth/login", c.login);
	app.router.get("/api/auth/me", app.auth, c.me);
};
