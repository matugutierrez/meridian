const http = require("http");
const path = require("path");
const config = require("./config");
const logger = require("./logger");
const bus = require("./events/bus");
const Store = require("./db/store");
const Router = require("./http/router");
const { parseBody, parseQuery } = require("./http/request");
const { sendJson, sendError } = require("./http/response");
const { serveStatic } = require("./http/static");
const { NotFound } = require("./errors");

function createKernel(opts) {
	opts = opts || {};
	const store = new Store(opts.dataFile || path.join(config.dataDir, "meridian.json"));
	const router = new Router();
	const app = { config, store, router, logger, bus, services: {} };
	app.auth = require("./security/authMiddleware")(app);
	app.requireRole = (role) => async (ctx) => {
		const user = ctx.state.user || {};
		if (user.role !== role) throw new (require("./errors").Forbidden)("Requiere rol " + role + " (tenés: " + (user.role || "ninguno") + ")");
	};

	require("../app/seed")(app);
	require("../app/registry").forEach((register) => register(app));

	const server = http.createServer(async (req, res) => {
		const started = Date.now();
		try {
			const url = new URL(req.url, "http://localhost");
			const match = router.match(req.method, url.pathname);
			if (!match) {
				if (req.method === "GET" && !url.pathname.startsWith("/api/")) return serveStatic(req, res, url.pathname);
				throw new NotFound("Ruta inexistente: " + req.method + " " + url.pathname);
			}
			const ctx = {
				req, res, app,
				params: match.params,
				query: parseQuery(url),
				body: await parseBody(req),
				state: {},
				json: (status, payload) => sendJson(res, status, payload),
			};
			for (const handler of match.handlers) {
				await handler(ctx);
				if (res.writableEnded) break;
			}
			if (!res.writableEnded && !ctx.state.streaming) sendJson(res, 204);
		} catch (err) {
			sendError(res, err);
		} finally {
			if (req.url.startsWith("/api/")) logger.debug(req.method + " " + req.url + " " + res.statusCode + " " + (Date.now() - started) + "ms");
		}
	});

	return {
		app,
		server,
		start(port) {
			const p = port != null ? port : config.port;
			return new Promise((resolve) => {
				server.listen(p, () => {
					const actual = server.address().port;
					logger.info("🧭 Meridian escuchando en puerto " + actual);
					resolve(actual);
				});
			});
		},
		stop() {
			server.close();
			store.close();
		},
	};
}

module.exports = { createKernel };
