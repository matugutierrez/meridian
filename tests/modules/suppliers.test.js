const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de suppliers", async () => {
	await withServer(async ({ api }) => {
		const sample = {"name":"Proveedor de prueba SA","cuit":"30-11111111-1"};
		const patch = {"terms":"Cta cte 30 días"};

		const created = await api("POST", "/api/suppliers", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/suppliers");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/suppliers/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/suppliers/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/suppliers/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/suppliers/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
