const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de leads", async () => {
	await withServer(async ({ api }) => {
		const sample = {"name":"Empresa de prueba","contact":"Juan Pérez"};
		const patch = {"status":"contactado"};

		const created = await api("POST", "/api/leads", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/leads");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/leads/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/leads/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/leads/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/leads/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
