const { validate } = require("../../core/validation/validator");
const { NotFound } = require("../../core/errors");
const schema = require("./schema");
const makeRepo = require("./repository");

module.exports = (app) => {
	const repo = makeRepo(app.store);
	return {
		repo,
		list() { return repo.all(); },
		get(id) {
			const row = repo.find(id);
			if (!row) throw new NotFound(schema.label + " no encontrado: " + id);
			return row;
		},
		create(input) {
			const value = validate(schema.fields, input);
			if (input && input.id) value.id = String(input.id);
			const row = repo.insert(value);
			app.bus.emit(schema.name + ".created", row);
			return row;
		},
		update(id, input) {
			this.get(id);
			const value = validate(schema.fields, input, { partial: true });
			const row = repo.update(id, value);
			app.bus.emit(schema.name + ".updated", row);
			return row;
		},
		remove(id) {
			this.get(id);
			repo.remove(id);
			app.bus.emit(schema.name + ".deleted", { id });
			return { id };
		},
	};
};
