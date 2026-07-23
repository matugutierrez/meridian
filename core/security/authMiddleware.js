const jwt = require("./jwt");
const { Unauthorized } = require("../errors");

module.exports = (app) => async (ctx) => {
	const header = ctx.req.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.slice(7) : null;
	const payload = token ? jwt.verify(token, app.config.jwtSecret) : null;
	if (!payload) throw new Unauthorized("Token ausente, inválido o vencido");
	ctx.state.user = payload;
};
