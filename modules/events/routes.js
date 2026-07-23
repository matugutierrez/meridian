const jwt = require("../../core/security/jwt");
const { Unauthorized } = require("../../core/errors");

module.exports = (app) => {
	const clients = new Set();

	app.bus.on("*", (event, payload) => {
		if (clients.size === 0) return;
		const frame = "event: domain\ndata: " + JSON.stringify({ event, at: new Date().toISOString(), payload: safe(payload) }) + "\n\n";
		for (const res of clients) {
			try { res.write(frame); } catch (e) { clients.delete(res); }
		}
	});

	app.router.get("/api/events", async (ctx) => {
		const payload = ctx.query.token ? jwt.verify(ctx.query.token, app.config.jwtSecret) : null;
		if (!payload) throw new Unauthorized("Token requerido para el stream de eventos");

		ctx.state.streaming = true;
		ctx.res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});
		ctx.res.write("event: hello\ndata: {\"ok\":true}\n\n");
		clients.add(ctx.res);

		const ping = setInterval(() => {
			try { ctx.res.write(": ping\n\n"); } catch (e) { /* se limpia en close */ }
		}, 25000);

		ctx.req.on("close", () => {
			clearInterval(ping);
			clients.delete(ctx.res);
		});
	});
};

/* Evita serializar objetos gigantes en el stream */
function safe(payload) {
	if (!payload || typeof payload !== "object") return payload;
	const out = {};
	for (const k of ["id", "number", "name", "memo", "total", "amount", "status", "event", "invoiceId", "method"]) {
		if (payload[k] !== undefined) out[k] = payload[k];
	}
	return out;
}
