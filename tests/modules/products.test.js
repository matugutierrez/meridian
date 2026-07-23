const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de products", async () => {
	await withServer(async ({ api }) => {
		const sample = {"sku":"TEST-01","name":"Producto de prueba","cost":100,"price":200,"stock":10};
		const patch = {"price":250};

		const created = await api("POST", "/api/products", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/products");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/products/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/products/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/products/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/products/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
