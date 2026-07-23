const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("./helpers");

test("login con credenciales válidas devuelve token y usuario", async () => {
	await withServer(async ({ base }) => {
		const res = await fetch(base + "/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "admin@meridian.app", password: "admin123" }),
		});
		assert.strictEqual(res.status, 200);
		const body = await res.json();
		assert.ok(body.token);
		assert.strictEqual(body.user.email, "admin@meridian.app");
		assert.strictEqual(body.user.role, "admin");
	});
});

test("login con contraseña incorrecta devuelve 401", async () => {
	await withServer(async ({ base }) => {
		const res = await fetch(base + "/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "admin@meridian.app", password: "incorrecta" }),
		});
		assert.strictEqual(res.status, 401);
	});
});

test("las rutas protegidas exigen token", async () => {
	await withServer(async ({ api }) => {
		const sin = await api("GET", "/api/products", undefined, { noAuth: true });
		assert.strictEqual(sin.status, 401);
		const falso = await api("GET", "/api/products", undefined, { token: "abc.def.ghi" });
		assert.strictEqual(falso.status, 401);
		const ok = await api("GET", "/api/products");
		assert.strictEqual(ok.status, 200);
	});
});

test("/api/auth/me devuelve el usuario del token", async () => {
	await withServer(async ({ api }) => {
		const me = await api("GET", "/api/auth/me");
		assert.strictEqual(me.status, 200);
		assert.strictEqual(me.body.data.email, "admin@meridian.app");
	});
});

test("el healthcheck es público", async () => {
	await withServer(async ({ api }) => {
		const res = await api("GET", "/api/health", undefined, { noAuth: true });
		assert.strictEqual(res.status, 200);
		assert.strictEqual(res.body.status, "ok");
	});
});
