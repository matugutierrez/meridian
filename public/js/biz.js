const Biz = {
	IVA: 0.21,

	totals(lines) {
		const net = lines.reduce((s, l) => s + l.qty * l.price, 0);
		const iva = Math.round(net * this.IVA);
		return { net: Math.round(net), iva, total: Math.round(net) + iva };
	},

	balance(customerId) {
		return DB.all("invoices").filter((i) => i.customerId === customerId && i.status === "pendiente").reduce((s, i) => s + i.total, 0);
	},

	cashBalance() {
		return DB.all("cash").reduce((s, m) => s + m.amount, 0);
	},

	/* Mutaciones: viajan al servidor, que factura, descuenta stock, asienta y mueve caja */
	async registerSale(opts) {
		const r = await API.post("/api/sales", opts);
		await DB.reload();
		return r.data;
	},
	async createOrder(opts) {
		const r = await API.post("/api/sales/orders", opts);
		await DB.reload();
		return r.data;
	},
	async collect(invoiceId, method) {
		const r = await API.post("/api/invoices/" + invoiceId + "/collect", { method });
		await DB.reload();
		return r.data;
	},
	async voidInvoice(invoiceId) {
		const r = await API.post("/api/invoices/" + invoiceId + "/void");
		await DB.reload();
		return r.data;
	},
	async adjustStock(productId, delta, reason) {
		const r = await API.post("/api/inventory/adjust", { productId, delta, reason });
		await DB.reload();
		return r.data;
	},
	async cashMove(v) {
		const r = await API.post("/api/treasury/moves", v);
		await DB.reload();
		return r.data;
	},
};
