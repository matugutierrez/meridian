class Router {
	constructor() { this.routes = []; }

	register(method, pattern, handlers) {
		this.routes.push({ method, segments: pattern.split("/").filter(Boolean), handlers });
	}

	get(p, ...h) { this.register("GET", p, h); }
	post(p, ...h) { this.register("POST", p, h); }
	patch(p, ...h) { this.register("PATCH", p, h); }
	put(p, ...h) { this.register("PUT", p, h); }
	delete(p, ...h) { this.register("DELETE", p, h); }

	match(method, pathname) {
		const parts = pathname.split("/").filter(Boolean);
		for (const r of this.routes) {
			if (r.method !== method || r.segments.length !== parts.length) continue;
			const params = {};
			let ok = true;
			for (let i = 0; i < parts.length; i++) {
				const seg = r.segments[i];
				if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
				else if (seg !== parts[i]) { ok = false; break; }
			}
			if (ok) return { handlers: r.handlers, params };
		}
		return null;
	}
}

module.exports = Router;
