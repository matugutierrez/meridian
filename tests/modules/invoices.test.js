const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de invoices", async () => {
	await withServer(async ({ api }) => {
		const sample = {"number":"0001-99999999","customerId":"cf","customer":"Consumidor Final","net":1000,"iva":210,"total":1210};
		const patch = {"status":"pagada"};

		const created = await api("POST", "/api/invoices", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/invoices");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/invoices/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/invoices/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/invoices/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/invoices/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
