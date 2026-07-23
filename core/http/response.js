const logger = require("../logger");

function sendJson(res, status, payload) {
	if (status === 204 || payload === undefined) {
		res.writeHead(status || 204);
		return res.end();
	}
	const body = JSON.stringify(payload);
	res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) });
	res.end(body);
}

function sendError(res, err) {
	const status = err.status || 500;
	if (status >= 500) logger.error(err.stack || err.message);
	if (res.writableEnded) return;
	sendJson(res, status, { error: status >= 500 ? "Error interno del servidor" : err.message, details: err.details });
}

module.exports = { sendJson, sendError };
