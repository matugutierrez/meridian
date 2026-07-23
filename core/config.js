const path = require("path");

module.exports = {
	port: Number(process.env.PORT) || 3000,
	jwtSecret: process.env.JWT_SECRET || "meridian-demo-secret-cambiame-en-produccion",
	tokenTtlSeconds: Number(process.env.TOKEN_TTL) || 60 * 60 * 12,
	dataDir: process.env.DATA_DIR || path.join(__dirname, "..", "data"),
	bodyLimitBytes: Number(process.env.BODY_LIMIT) || 2 * 1024 * 1024,
};
