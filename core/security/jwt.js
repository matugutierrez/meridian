const crypto = require("crypto");

function sign(payload, secret, ttlSeconds) {
	const now = Math.floor(Date.now() / 1000);
	const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
	const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp: now + (ttlSeconds || 3600) })).toString("base64url");
	const sig = crypto.createHmac("sha256", secret).update(header + "." + body).digest("base64url");
	return header + "." + body + "." + sig;
}

function verify(token, secret) {
	if (!token || token.split(".").length !== 3) return null;
	const [h, b, s] = token.split(".");
	const expected = crypto.createHmac("sha256", secret).update(h + "." + b).digest("base64url");
	const a = Buffer.from(s);
	const e = Buffer.from(expected);
	if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return null;
	try {
		const payload = JSON.parse(Buffer.from(b, "base64url").toString("utf8"));
		if (payload.exp && payload.exp < Date.now() / 1000) return null;
		return payload;
	} catch (err) {
		return null;
	}
}

module.exports = { sign, verify };
