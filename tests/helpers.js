const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

async function withServer(fn) {
	const dataFile = path.join(os.tmpdir(), "meridian-test-" + crypto.randomUUID() + ".json");
	/* Cada test necesita módulos frescos (el bus y require.cache comparten estado) */
	for (const key of Object.keys(require.cache)) {
		if (key.includes("meridian") || key.includes("fullstack")) delete require.cache[key];
	}
	const { createKernel } = require("../core/kernel");
	const kernel = createKernel({ dataFile });
	const port = await kernel.start(0);
	const base = "http://127.0.0.1:" + port;

	const login = await fetch(base + "/api/auth/login", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email: "admin@meridian.app", password: "admin123" }),
	});
	const { token } = await login.json();

	async function api(method, pathname, body, opts) {
		opts = opts || {};
		const res = await fetch(base + pathname, {
			method,
			headers: Object.assign(
				{ "Content-Type": "application/json" },
				opts.noAuth ? {} : { Authorization: "Bearer " + (opts.token || token) },
			),
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		let parsed = null;
		try { parsed = await res.json(); } catch (e) { /* 204 */ }
		return { status: res.status, body: parsed };
	}

	try {
		await fn({ base, api, token, kernel });
	} finally {
		kernel.stop();
		try { fs.unlinkSync(dataFile); } catch (e) { /* noop */ }
	}
}

module.exports = { withServer };
