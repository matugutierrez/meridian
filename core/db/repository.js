const crypto = require("crypto");

class Repository {
	constructor(store, name) {
		this.store = store;
		this.name = name;
	}

	all() { return this.store.collection(this.name); }

	find(id) { return this.all().find((x) => x.id === id) || null; }

	where(predicate) { return this.all().filter(predicate); }

	insert(obj) {
		const row = Object.assign({ id: obj.id || crypto.randomUUID(), createdAt: new Date().toISOString() }, obj);
		this.all().push(row);
		this.store.mark();
		return row;
	}

	update(id, patch) {
		const row = this.find(id);
		if (!row) return null;
		Object.assign(row, patch, { updatedAt: new Date().toISOString() });
		this.store.mark();
		return row;
	}

	remove(id) {
		const col = this.all();
		const i = col.findIndex((x) => x.id === id);
		if (i < 0) return false;
		col.splice(i, 1);
		this.store.mark();
		return true;
	}
}

module.exports = Repository;
