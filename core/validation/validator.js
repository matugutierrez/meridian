const { BadRequest } = require("../errors");

function validate(schema, input, opts) {
	opts = opts || {};
	const partial = Boolean(opts.partial);
	const errors = [];
	const value = {};
	if (!input || typeof input !== "object") input = {};

	for (const [key, rules] of Object.entries(schema)) {
		let v = input[key];
		const missing = v === undefined || v === null || v === "";

		if (missing) {
			if (partial) continue;
			if (rules.required) { errors.push("'" + key + "' es obligatorio"); continue; }
			if (rules.default !== undefined) {
				value[key] = typeof rules.default === "function" ? rules.default() : rules.default;
			}
			continue;
		}

		if (rules.type === "number") {
			v = Number(v);
			if (Number.isNaN(v)) { errors.push("'" + key + "' debe ser numérico"); continue; }
		} else if (rules.type === "string") {
			if (typeof v !== "string") { errors.push("'" + key + "' debe ser texto"); continue; }
			v = v.trim();
			if (!v && rules.required) { errors.push("'" + key + "' es obligatorio"); continue; }
		} else if (rules.type === "boolean") {
			v = v === true || v === "true" || v === 1;
		} else if (rules.type === "array") {
			if (!Array.isArray(v)) { errors.push("'" + key + "' debe ser una lista"); continue; }
		}

		if (rules.enum && !rules.enum.includes(v)) { errors.push("'" + key + "' debe ser uno de: " + rules.enum.join(", ")); continue; }
		if (rules.min != null && typeof v === "number" && v < rules.min) { errors.push("'" + key + "' debe ser ≥ " + rules.min); continue; }
		if (rules.max != null && typeof v === "number" && v > rules.max) { errors.push("'" + key + "' debe ser ≤ " + rules.max); continue; }
		if (rules.pattern && !new RegExp(rules.pattern).test(String(v))) { errors.push("'" + key + "' tiene formato inválido"); continue; }

		value[key] = v;
	}

	if (errors.length) throw new BadRequest("Validación fallida", errors);
	return value;
}

module.exports = { validate };
