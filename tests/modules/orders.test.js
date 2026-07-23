const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de orders", async () => {
	await withServer(async ({ api }) => {
		const sample = {"number":999,"customerId":"cf","customer":"Consumidor Final","total":1000};
		const patch = {"status":"cancelado"};

		const created = await api("POST", "/api/orders", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/orders");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/orders/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/orders/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/orders/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/orders/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
