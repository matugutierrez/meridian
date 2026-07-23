const fs = require("fs");
const path = require("path");
const logger = require("../logger");

class Store {
	constructor(file) {
		this.file = file;
		this.data = {};
		this.dirty = false;
		this.load();
		this.timer = setInterval(() => this.flush(), 1500);
		if (this.timer.unref) this.timer.unref();
	}

	load() {
		try {
			this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
			logger.info("Store cargado desde " + this.file);
		} catch (err) {
			this.data = {};
		}
	}

	collection(name) {
		if (!this.data[name]) this.data[name] = [];
		return this.data[name];
	}

	mark() { this.dirty = true; }

	counter(name) {
		if (!this.data.__counters) this.data.__counters = {};
		this.data.__counters[name] = (this.data.__counters[name] || 0) + 1;
		this.mark();
		return this.data.__counters[name];
	}

	setCounter(name, value) {
		if (!this.data.__counters) this.data.__counters = {};
		this.data.__counters[name] = value;
		this.mark();
	}

	flush() {
		if (!this.dirty) return;
		this.dirty = false;
		try {
			fs.mkdirSync(path.dirname(this.file), { recursive: true });
			const tmp = this.file + ".tmp";
			fs.writeFileSync(tmp, JSON.stringify(this.data));
			fs.renameSync(tmp, this.file);
		} catch (err) {
			logger.error("No se pudo persistir el store:", err.message);
			this.dirty = true;
		}
	}

	close() {
		clearInterval(this.timer);
		this.flush();
	}
}

module.exports = Store;
