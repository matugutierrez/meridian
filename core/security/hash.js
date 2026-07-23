const crypto = require("crypto");

function hash(password) {
	const salt = crypto.randomBytes(16).toString("hex");
	const key = crypto.scryptSync(String(password), salt, 64).toString("hex");
	return salt + ":" + key;
}

function verify(password, stored) {
	if (!stored || !stored.includes(":")) return false;
	const [salt, key] = stored.split(":");
	const candidate = crypto.scryptSync(String(password), salt, 64).toString("hex");
	return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(key));
}

module.exports = { hash, verify };
