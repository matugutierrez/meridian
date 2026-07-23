const DB = (() => {
	let cache = null;

	async function reload() {
		const r = await API.get_("/api/bootstrap");
		cache = r.data;
	}

	function sync(promise) {
		promise
			.then(() => reload().then(() => App.refresh()))
			.catch((err) => {
				UI.toast(err.message);
				reload().then(() => App.refresh());
			});
	}

	return {
		reload,
		ready() { return cache !== null; },
		all(c) { return (cache && cache[c]) || []; },
		get(c, id) { return this.all(c).find((x) => x.id === id) || null; },
		add(c, obj) {
			if (!obj.id) obj.id = crypto.randomUUID();
			cache[c].push(obj);
			sync(API.post("/api/" + c, obj));
			return obj;
		},
		update(c, id, patch) {
			const o = this.get(c, id);
			if (o) Object.assign(o, patch);
			sync(API.patch("/api/" + c + "/" + id, patch));
			return o;
		},
		remove(c, id) {
			cache[c] = cache[c].filter((x) => x.id !== id);
			sync(API.del("/api/" + c + "/" + id));
		},
	};
})();
