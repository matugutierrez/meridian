const { test } = require("node:test");
const assert = require("node:assert");
const { withServer } = require("../helpers");

test("CRUD de entries", async () => {
	await withServer(async ({ api }) => {
		const sample = {"memo":"Asiento de prueba","lines":[{"account":"1.1 Caja","debit":100,"credit":0},{"account":"4.2 Otros ingresos","debit":0,"credit":100}]};
		const patch = {"memo":"Asiento editado"};

		const created = await api("POST", "/api/entries", sample);
		assert.strictEqual(created.status, 201);
		const id = created.body.data.id;
		assert.ok(id);

		const list = await api("GET", "/api/entries");
		assert.strictEqual(list.status, 200);
		assert.ok(list.body.data.some((x) => x.id === id));

		const updated = await api("PATCH", "/api/entries/" + id, patch);
		assert.strictEqual(updated.status, 200);

		const got = await api("GET", "/api/entries/" + id);
		assert.strictEqual(got.status, 200);
		for (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);

		const removed = await api("DELETE", "/api/entries/" + id);
		assert.strictEqual(removed.status, 200);

		const missing = await api("GET", "/api/entries/" + id);
		assert.strictEqual(missing.status, 404);
	});
});
