const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de opportunities", async () => {
	await withServer(async ({ api }) => {
		const sample = {"name":"Oportunidad de prueba","customer":"Cliente X","amount":100000};
		const patch = {"stage":1};

		const created = await api("POST", "/api/opportunities", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/opportunities");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/opportunities/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/opportunities/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/opportunities/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/opportunities/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
