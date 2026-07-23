const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de cash", async () => {
	await withServer(async ({ api }) => {
		const sample = {"memo":"Ingreso de prueba","amount":5000};
		const patch = {"memo":"Ingreso editado"};

		const created = await api("POST", "/api/cash", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/cash");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/cash/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/cash/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/cash/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/cash/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
