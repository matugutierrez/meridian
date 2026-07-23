const App = {
	routes: [],
	route(id, cfg) { this.routes.push(Object.assign({ id }, cfg)); },
	current() {
		const id = (location.hash || "#/dashboard").replace("#/", "");
		return this.routes.find((r) => r.id === id) || this.routes[0];
	},
	go(id) { location.hash = "#/" + id; },
	render() {
		if (!DB.ready()) return;
		const r = this.current();
		document.getElementById("page-title").textContent = r.title;
		document.title = r.title + " — Meridian";
		document.querySelectorAll("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.id === r.id));
		const view = document.getElementById("view");
		view.innerHTML = "";
		r.render(view);
		view.scrollTop = 0;
	},
	refresh() { this.render(); },
};

function showLogin(msg) {
	document.getElementById("shell").style.display = "none";
	const login = document.getElementById("login");
	login.style.display = "flex";
	const err = document.getElementById("login-error");
	err.textContent = msg || "";
	err.style.display = msg ? "block" : "none";

	document.getElementById("login-form").onsubmit = async (e) => {
		e.preventDefault();
		const btn = document.getElementById("login-btn");
		btn.disabled = true;
		btn.textContent = "Ingresando…";
		try {
			await API.login(document.getElementById("login-email").value.trim(), document.getElementById("login-password").value);
			await startApp();
		} catch (ex) {
			err.textContent = ex.message;
			err.style.display = "block";
			btn.disabled = false;
			btn.textContent = "Ingresar";
		}
	};
}

async function startApp() {
	await DB.reload();
	document.getElementById("login").style.display = "none";
	const shell = document.getElementById("shell");
	shell.style.display = "flex";

	const nav = document.getElementById("nav");
	nav.innerHTML = App.routes.map((r, i) => '<a href="#/' + r.id + '" data-id="' + r.id + '"><span class="idx">' + String(i + 1).padStart(2, "0") + '</span><span class="lbl">' + r.title + "</span></a>").join("");

	const user = API.user || { name: "Usuario" };
	document.getElementById("user-name").textContent = user.name;
	document.getElementById("btn-logout").onclick = () => {
		Live.stop();
		API.logout();
		location.hash = "";
		location.reload();
	};

	App.render();
	Live.start();
}

document.addEventListener("DOMContentLoaded", async () => {
	const params = new URLSearchParams(location.search);
	if (!API.token && params.get("demo") === "1") {
		try { await API.login("admin@meridian.app", "admin123"); } catch (e) { /* cae al login */ }
	}
	if (!API.token) return showLogin();
	try {
		await startApp();
	} catch (e) {
		API.logout();
		showLogin("La sesión expiró, ingresá de nuevo");
	}
});
window.addEventListener("hashchange", () => App.render());
