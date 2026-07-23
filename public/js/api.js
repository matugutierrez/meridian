const API = {
	get token() { return localStorage.getItem("meridian-token"); },
	setToken(t) { localStorage.setItem("meridian-token", t); },
	logout() { localStorage.removeItem("meridian-token"); localStorage.removeItem("meridian-user"); },

	get user() {
		try { return JSON.parse(localStorage.getItem("meridian-user")); } catch (e) { return null; }
	},

	async request(method, path, body) {
		const headers = { "Content-Type": "application/json" };
		if (this.token) headers.Authorization = "Bearer " + this.token;
		const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
		if (res.status === 401 && !path.includes("/auth/login")) {
			this.logout();
			location.reload();
			throw new Error("Sesión vencida");
		}
		let data = null;
		try { data = await res.json(); } catch (e) { /* 204 */ }
		if (!res.ok) {
			const msg = (data && data.error) || "Error " + res.status;
			const details = data && data.details ? " — " + data.details.join("; ") : "";
			throw new Error(msg + details);
		}
		return data;
	},

	get_(p) { return this.request("GET", p); },
	post(p, b) { return this.request("POST", p, b || {}); },
	patch(p, b) { return this.request("PATCH", p, b || {}); },
	del(p) { return this.request("DELETE", p); },

	async login(email, password) {
		const r = await this.request("POST", "/api/auth/login", { email, password });
		this.setToken(r.token);
		localStorage.setItem("meridian-user", JSON.stringify(r.user));
		return r.user;
	},
};
