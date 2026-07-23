const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const MODULES = {
	products: {
		label: "Producto",
		fields: {
			sku: { type: "string", required: true },
			name: { type: "string", required: true },
			cat: { type: "string", default: "General" },
			cost: { type: "number", min: 0, default: 0 },
			price: { type: "number", min: 0, default: 0 },
			stock: { type: "number", default: 0 },
			min: { type: "number", min: 0, default: 5 },
		},
		sample: { sku: "TEST-01", name: "Producto de prueba", cost: 100, price: 200, stock: 10 },
		patch: { price: 250 },
	},
	customers: {
		label: "Cliente",
		fields: {
			name: { type: "string", required: true },
			cuit: { type: "string", default: "—" },
			email: { type: "string", default: "—" },
			terms: { type: "string", default: "Contado", enum: ["Contado", "Cta cte 15 días", "Cta cte 30 días", "Cta cte 60 días"] },
		},
		sample: { name: "Cliente de prueba SRL", cuit: "30-00000000-0" },
		patch: { terms: "Cta cte 30 días" },
	},
	leads: {
		label: "Lead",
		fields: {
			name: { type: "string", required: true },
			contact: { type: "string", default: "" },
			source: { type: "string", default: "Web" },
			status: { type: "string", default: "nuevo", enum: ["nuevo", "contactado", "descartado"] },
			note: { type: "string", default: "" },
		},
		sample: { name: "Empresa de prueba", contact: "Juan Pérez" },
		patch: { status: "contactado" },
	},
	opportunities: {
		label: "Oportunidad",
		fields: {
			name: { type: "string", required: true },
			customer: { type: "string", required: true },
			amount: { type: "number", min: 0, default: 0 },
			stage: { type: "number", min: 0, max: 3, default: 0 },
		},
		sample: { name: "Oportunidad de prueba", customer: "Cliente X", amount: 100000 },
		patch: { stage: 1 },
	},
	orders: {
		label: "Pedido",
		fields: {
			number: { type: "number", required: true },
			date: { type: "string", default: () => new Date().toISOString() },
			customerId: { type: "string", required: true },
			customer: { type: "string", required: true },
			lines: { type: "array", default: [] },
			total: { type: "number", default: 0 },
			status: { type: "string", default: "confirmado", enum: ["borrador", "confirmado", "cancelado"] },
			invoiceNumber: { type: "string", default: "" },
		},
		sample: { number: 999, customerId: "cf", customer: "Consumidor Final", total: 1000 },
		patch: { status: "cancelado" },
	},
	invoices: {
		label: "Factura",
		fields: {
			number: { type: "string", required: true },
			date: { type: "string", default: () => new Date().toISOString() },
			customerId: { type: "string", required: true },
			customer: { type: "string", required: true },
			net: { type: "number", default: 0 },
			iva: { type: "number", default: 0 },
			total: { type: "number", default: 0 },
			status: { type: "string", default: "pendiente", enum: ["pendiente", "pagada", "anulada"] },
			cae: { type: "string", default: "" },
			lines: { type: "array", default: [] },
		},
		sample: { number: "0001-99999999", customerId: "cf", customer: "Consumidor Final", net: 1000, iva: 210, total: 1210 },
		patch: { status: "pagada" },
	},
	entries: {
		label: "Asiento",
		fields: {
			date: { type: "string", default: () => new Date().toISOString() },
			memo: { type: "string", required: true },
			lines: { type: "array", required: true },
		},
		sample: { memo: "Asiento de prueba", lines: [{ account: "1.1 Caja", debit: 100, credit: 0 }, { account: "4.2 Otros ingresos", debit: 0, credit: 100 }] },
		patch: { memo: "Asiento editado" },
	},
	cash: {
		label: "Movimiento de caja",
		fields: {
			date: { type: "string", default: () => new Date().toISOString() },
			memo: { type: "string", required: true },
			amount: { type: "number", required: true },
			method: { type: "string", default: "efectivo" },
		},
		sample: { memo: "Ingreso de prueba", amount: 5000 },
		patch: { memo: "Ingreso editado" },
	},
	suppliers: {
		label: "Proveedor",
		fields: {
			name: { type: "string", required: true },
			cuit: { type: "string", default: "—" },
			email: { type: "string", default: "—" },
			phone: { type: "string", default: "—" },
			terms: { type: "string", default: "Contado", enum: ["Contado", "Cta cte 15 días", "Cta cte 30 días", "Cta cte 60 días"] },
		},
		sample: { name: "Proveedor de prueba SA", cuit: "30-11111111-1" },
		patch: { terms: "Cta cte 30 días" },
	},
};

function serializeFields(fields) {
	const parts = Object.entries(fields).map(([key, rules]) => {
		const rp = Object.entries(rules).map(([rk, rv]) => {
			if (typeof rv === "function") return rk + ": " + rv.toString();
			return rk + ": " + JSON.stringify(rv);
		});
		return "\t\t" + JSON.stringify(key) + ": { " + rp.join(", ") + " }";
	});
	return "{\n" + parts.join(",\n") + "\n\t}";
}

function write(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
	console.log("  ✓ " + path.relative(ROOT, file));
}

for (const [name, def] of Object.entries(MODULES)) {
	const dir = path.join(ROOT, "modules", name);

	write(path.join(dir, "schema.js"),
		"/* Esquema de " + def.label + " (generado por tools/generate-modules.js) */\n" +
		"module.exports = {\n\tname: " + JSON.stringify(name) + ",\n\tlabel: " + JSON.stringify(def.label) + ",\n\tfields: " + serializeFields(def.fields) + ",\n};\n");

	write(path.join(dir, "repository.js"),
		"/* Repositorio de " + def.label + " */\n" +
		'const Repository = require("../../core/db/repository");\n\n' +
		"module.exports = (store) => new Repository(store, " + JSON.stringify(name) + ");\n");

	write(path.join(dir, "service.js"),
		"/* Servicio de " + def.label + ": validación + reglas + eventos de dominio */\n" +
		'const { validate } = require("../../core/validation/validator");\n' +
		'const { NotFound } = require("../../core/errors");\n' +
		'const schema = require("./schema");\n' +
		'const makeRepo = require("./repository");\n\n' +
		"module.exports = (app) => {\n" +
		"\tconst repo = makeRepo(app.store);\n" +
		"\treturn {\n" +
		"\t\trepo,\n" +
		"\t\tlist() { return repo.all(); },\n" +
		"\t\tget(id) {\n" +
		"\t\t\tconst row = repo.find(id);\n" +
		'\t\t\tif (!row) throw new NotFound(schema.label + " no encontrado: " + id);\n' +
		"\t\t\treturn row;\n" +
		"\t\t},\n" +
		"\t\tcreate(input) {\n" +
		"\t\t\tconst value = validate(schema.fields, input);\n" +
		"\t\t\tif (input && input.id) value.id = String(input.id);\n" +
		"\t\t\tconst row = repo.insert(value);\n" +
		'\t\t\tapp.bus.emit(schema.name + ".created", row);\n' +
		"\t\t\treturn row;\n" +
		"\t\t},\n" +
		"\t\tupdate(id, input) {\n" +
		"\t\t\tthis.get(id);\n" +
		"\t\t\tconst value = validate(schema.fields, input, { partial: true });\n" +
		"\t\t\tconst row = repo.update(id, value);\n" +
		'\t\t\tapp.bus.emit(schema.name + ".updated", row);\n' +
		"\t\t\treturn row;\n" +
		"\t\t},\n" +
		"\t\tremove(id) {\n" +
		"\t\t\tthis.get(id);\n" +
		"\t\t\trepo.remove(id);\n" +
		'\t\t\tapp.bus.emit(schema.name + ".deleted", { id });\n' +
		"\t\t\treturn { id };\n" +
		"\t\t},\n" +
		"\t};\n" +
		"};\n");

	write(path.join(dir, "controller.js"),
		"/* Controlador HTTP de " + def.label + " */\n" +
		"module.exports = (service) => ({\n" +
		"\tlist: (ctx) => ctx.json(200, { data: service.list() }),\n" +
		"\tget: (ctx) => ctx.json(200, { data: service.get(ctx.params.id) }),\n" +
		"\tcreate: (ctx) => ctx.json(201, { data: service.create(ctx.body || {}) }),\n" +
		"\tupdate: (ctx) => ctx.json(200, { data: service.update(ctx.params.id, ctx.body || {}) }),\n" +
		"\tremove: (ctx) => ctx.json(200, { data: service.remove(ctx.params.id) }),\n" +
		"});\n");

	write(path.join(dir, "routes.js"),
		"/* Rutas REST de " + def.label + " (protegidas con JWT) */\n" +
		'const schema = require("./schema");\n' +
		'const makeService = require("./service");\n' +
		'const makeController = require("./controller");\n\n' +
		"module.exports = (app) => {\n" +
		"\tconst service = makeService(app);\n" +
		"\tapp.services[schema.name] = service;\n" +
		"\tconst c = makeController(service);\n" +
		'\tconst base = "/api/" + schema.name;\n' +
		"\tapp.router.get(base, app.auth, c.list);\n" +
		'\tapp.router.get(base + "/:id", app.auth, c.get);\n' +
		"\tapp.router.post(base, app.auth, c.create);\n" +
		'\tapp.router.patch(base + "/:id", app.auth, c.update);\n' +
		'\tapp.router.delete(base + "/:id", app.auth, app.requireRole("admin"), c.remove);\n' +
		"};\n");

	write(path.join(ROOT, "tests", "modules", name + ".test.js"),
		"/* Test CRUD de " + def.label + " (generado) */\n" +
		'const { test } = require("node:test");\n' +
		'const assert = require("node:assert");\n' +
		'const { withServer } = require("../helpers");\n\n' +
		'test("CRUD de ' + name + '", async () => {\n' +
		"\tawait withServer(async ({ api }) => {\n" +
		"\t\tconst sample = " + JSON.stringify(def.sample) + ";\n" +
		"\t\tconst patch = " + JSON.stringify(def.patch) + ";\n\n" +
		'\t\tconst created = await api("POST", "/api/' + name + '", sample);\n' +
		"\t\tassert.strictEqual(created.status, 201);\n" +
		"\t\tconst id = created.body.data.id;\n" +
		"\t\tassert.ok(id);\n\n" +
		'\t\tconst list = await api("GET", "/api/' + name + '");\n' +
		"\t\tassert.strictEqual(list.status, 200);\n" +
		"\t\tassert.ok(list.body.data.some((x) => x.id === id));\n\n" +
		'\t\tconst updated = await api("PATCH", "/api/' + name + '/" + id, patch);\n' +
		"\t\tassert.strictEqual(updated.status, 200);\n\n" +
		'\t\tconst got = await api("GET", "/api/' + name + '/" + id);\n' +
		"\t\tassert.strictEqual(got.status, 200);\n" +
		"\t\tfor (const k of Object.keys(patch)) assert.deepStrictEqual(got.body.data[k], patch[k]);\n\n" +
		'\t\tconst removed = await api("DELETE", "/api/' + name + '/" + id);\n' +
		"\t\tassert.strictEqual(removed.status, 200);\n\n" +
		'\t\tconst missing = await api("GET", "/api/' + name + '/" + id);\n' +
		"\t\tassert.strictEqual(missing.status, 404);\n" +
		"\t});\n" +
		"});\n");
}

console.log("Listo: " + Object.keys(MODULES).length + " módulos generados.");
