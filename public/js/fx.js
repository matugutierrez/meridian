const FX = {
	revealize(root) {
		if (!root) return;
		const kids = Array.from(root.children);
		kids.forEach((el, i) => {
			el.classList.remove("in");
			el.classList.add("reveal");
			el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
		});
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				kids.forEach((el) => el.classList.add("in"));
			});
		});
	},

	startGlow() {
		if (document.getElementById("fx-glow")) return;
		const g = document.createElement("div");
		g.id = "fx-glow";
		document.body.appendChild(g);
		window.addEventListener("pointermove", (e) => {
			g.style.transform = "translate(" + (e.clientX - 300) + "px," + (e.clientY - 300) + "px)";
		}, { passive: true });
	},
};

document.addEventListener("DOMContentLoaded", () => FX.startGlow());

if (typeof App !== "undefined" && typeof App.render === "function") {
	const originalRender = App.render.bind(App);
	App.render = function () {
		originalRender();
		FX.revealize(document.getElementById("view"));
	};
}
