App.route("pos", {
	title: "Punto de venta",
	icon: "",
	render(el) {
		let cart = [];

		const draw = () => {
			const products = DB.all("products");
			const grid = products.map((p) => {
				const final = Math.round(p.price * (1 + Biz.IVA));
				return '<button class="pitem" data-p="' + p.id + '"' + (p.stock <= 0 ? " disabled" : "") + '><div class="nm">' + UI.esc(p.name) + '</div><div class="pr">' + UI.fmt(final) + '</div><div class="st">' + (p.stock <= 0 ? "sin stock" : "stock: " + p.stock) + "</div></button>";
			}).join("");

			const t = Biz.totals(cart);
			const cartHtml = cart.length
				? cart.map((l, i) =>
					'<div class="line"><span>' + UI.esc(l.name) + '</span><span class="qty"><button data-dec="' + i + '">−</button>' + l.qty + '<button data-inc="' + i + '">+</button></span><strong>' + UI.fmt(Math.round(l.qty * l.price * (1 + Biz.IVA))) + "</strong></div>"
				).join("")
				: '<div class="muted" style="padding:14px 0">Tocá un producto para agregarlo</div>';

			const customers = DB.all("customers");
			el.innerHTML =
				'<div class="pos"><div><div class="pos-grid">' + grid + "</div></div>" +
				'<div class="card cart"><h3>Ticket</h3>' + cartHtml +
				'<div class="total"><span>TOTAL</span><span>' + UI.fmt(t.total) + "</span></div>" +
				'<div class="f"><label>Cliente</label><select id="pos-cust">' + customers.map((c) => '<option value="' + c.id + '">' + UI.esc(c.name) + "</option>").join("") + "</select></div>" +
				'<div class="f"><label>Medio de pago</label><select id="pos-method"><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="qr">QR / transferencia</option><option value="cta">Cuenta corriente</option></select></div>' +
				'<button class="btn" id="pos-charge"' + (cart.length ? "" : " disabled") + "> Cobrar " + UI.fmt(t.total) + "</button>" +
				(cart.length ? '<button class="btn ghost" id="pos-clear" style="margin-top:8px">Vaciar</button>' : "") +
				"</div></div>";

			el.querySelectorAll("[data-p]").forEach((b) => {
				b.onclick = () => {
					const p = DB.get("products", b.dataset.p);
					const ex = cart.find((l) => l.productId === p.id);
					if (ex) { if (ex.qty >= p.stock) return UI.toast("No hay más stock de " + p.name); ex.qty++; }
					else cart.push({ productId: p.id, name: p.name, qty: 1, price: p.price });
					draw();
				};
			});
			el.querySelectorAll("[data-inc]").forEach((b) => { b.onclick = () => { cart[Number(b.dataset.inc)].qty++; draw(); }; });
			el.querySelectorAll("[data-dec]").forEach((b) => {
				b.onclick = () => {
					const i = Number(b.dataset.dec);
					cart[i].qty--; if (cart[i].qty <= 0) cart.splice(i, 1);
					draw();
				};
			});
			const clear = el.querySelector("#pos-clear");
			if (clear) clear.onclick = () => { cart = []; draw(); };
			el.querySelector("#pos-charge").onclick = async () => {
				if (!cart.length) return;
				const btn = el.querySelector("#pos-charge");
				btn.disabled = true;
				btn.textContent = "Procesando…";
				const method = el.querySelector("#pos-method").value;
				const custId = el.querySelector("#pos-cust").value;
				const sold = cart.slice();
				try {
					const inv = await Biz.registerSale({ customerId: custId, lines: sold.map((l) => ({ productId: l.productId, qty: l.qty })), method });
					const lines = sold.map((l) => (l.qty + " x " + l.name).padEnd(30) + UI.fmt(Math.round(l.qty * l.price * (1 + Biz.IVA)))).join("\n");
					UI.show(" Venta registrada", '<div class="ticket">MERIDIAN DEMO S.A.\nFactura B ' + inv.number + "\nCAE " + inv.cae + "\n" + "-".repeat(38) + "\n" + lines + "\n" + "-".repeat(38) + "\nNeto      " + UI.fmt(inv.net) + "\nIVA 21%   " + UI.fmt(inv.iva) + "\nTOTAL     " + UI.fmt(inv.total) + "\nPago: " + method + '</div><div class="actions"><button class="btn" onclick="UI.close()">Listo</button></div>');
					cart = [];
					draw();
					UI.toast("Factura " + inv.number + " emitida — stock y contabilidad actualizados");
				} catch (e) {
					UI.toast(e.message);
					draw();
				}
			};
		};
		draw();
	},
});
