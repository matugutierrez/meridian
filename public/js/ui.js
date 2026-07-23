const UI = (() => {
	const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
	const fmt = (n) => (Number(n) || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
	const date = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
	const dateFull = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

	function toast(msg) {
		const root = document.getElementById("toast-root");
		const t = document.createElement("div");
		t.className = "toast";
		t.textContent = msg;
		root.appendChild(t);
		setTimeout(() => t.remove(), 2600);
	}

	function close() { document.getElementById("modal-root").innerHTML = ""; }

	function show(title, bodyHtml, opts) {
		opts = opts || {};
		const root = document.getElementById("modal-root");
		root.innerHTML = '<div class="modal-bg"><div class="modal ' + (opts.wide ? "wide" : "") + '"><header><h3>' + esc(title) + '</h3><button class="x" data-x>×</button></header><div class="body">' + bodyHtml + "</div></div></div>";
		root.querySelector("[data-x]").onclick = close;
		root.querySelector(".modal-bg").addEventListener("click", (e) => { if (e.target.classList.contains("modal-bg")) close(); });
		if (opts.onMount) opts.onMount(root.querySelector(".modal .body"));
	}

	function form(title, fields, onSubmit, submitLabel) {
		const body = fields.map((f) => {
			if (f.type === "select") {
				const opts = f.options.map((o) => '<option value="' + esc(o.value) + '"' + (o.value === f.value ? " selected" : "") + ">" + esc(o.label) + "</option>").join("");
				return '<div class="f"><label>' + esc(f.label) + '</label><select data-f="' + f.id + '">' + opts + "</select></div>";
			}
			return '<div class="f"><label>' + esc(f.label) + '</label><input data-f="' + f.id + '" type="' + (f.type || "text") + '" value="' + esc(f.value == null ? "" : f.value) + '"' + (f.min != null ? ' min="' + f.min + '"' : "") + (f.step ? ' step="' + f.step + '"' : "") + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "") + "></div>";
		}).join("") + '<div class="actions"><button class="btn ghost" data-cancel>Cancelar</button><button class="btn" data-ok>' + esc(submitLabel || "Guardar") + "</button></div>";
		show(title, body, {
			onMount(el) {
				el.querySelector("[data-cancel]").onclick = close;
				el.querySelector("[data-ok]").onclick = () => {
					const vals = {};
					fields.forEach((f) => {
						const input = el.querySelector('[data-f="' + f.id + '"]');
						vals[f.id] = f.type === "number" ? Number(input.value) || 0 : input.value;
					});
					onSubmit(vals);
				};
				const first = el.querySelector("input,select");
				if (first) first.focus();
			},
		});
	}

	const badge = (text, tone) => '<span class="badge ' + (tone || "muted") + '">' + esc(text) + "</span>";

	const statusBadge = (s) => {
		const map = { pagada: "ok", pendiente: "warn", anulada: "err", confirmado: "info", borrador: "muted", nuevo: "info", contactado: "warn", recibida: "info", cancelada: "err" };
		return badge(s, map[s] || "muted");
	};

	return { esc, fmt, date, dateFull, toast, show, close, form, badge, statusBadge };
})();
