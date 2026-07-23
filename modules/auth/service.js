const { verify } = require("../../core/security/hash");
const jwt = require("../../core/security/jwt");
const { Unauthorized, BadRequest } = require("../../core/errors");

module.exports = (app) => ({
	login(email, password) {
		if (!email || !password) throw new BadRequest("Email y contraseña son obligatorios");
		const user = app.store.collection("users").find((u) => u.email.toLowerCase() === String(email).toLowerCase());
		if (!user || !verify(password, user.password)) throw new Unauthorized("Credenciales inválidas");
		const token = jwt.sign({ sub: user.id, name: user.name, email: user.email, role: user.role }, app.config.jwtSecret, app.config.tokenTtlSeconds);
		app.bus.emit("auth.login", { userId: user.id });
		return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
	},
	me(payload) {
		return { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
	},
});
