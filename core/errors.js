class HttpError extends Error {
	constructor(status, message, details) {
		super(message);
		this.status = status;
		this.details = details;
	}
}
class BadRequest extends HttpError {
	constructor(message, details) { super(400, message || "Solicitud inválida", details); }
}
class Unauthorized extends HttpError {
	constructor(message) { super(401, message || "No autenticado"); }
}
class Forbidden extends HttpError {
	constructor(message) { super(403, message || "Sin permisos"); }
}
class NotFound extends HttpError {
	constructor(message) { super(404, message || "No encontrado"); }
}
class Conflict extends HttpError {
	constructor(message, details) { super(409, message || "Conflicto", details); }
}

module.exports = { HttpError, BadRequest, Unauthorized, Forbidden, NotFound, Conflict };
