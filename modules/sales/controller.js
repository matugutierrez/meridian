module.exports = (service) => ({
	registerSale: (ctx) => ctx.json(201, { data: service.registerSale(ctx.body || {}) }),
	createOrder: (ctx) => ctx.json(201, { data: service.createOrder(ctx.body || {}) }),
	collect: (ctx) => ctx.json(200, { data: service.collect(ctx.params.id, (ctx.body || {}).method) }),
	voidInvoice: (ctx) => ctx.json(200, { data: service.voidInvoice(ctx.params.id) }),
	adjustStock: (ctx) => ctx.json(200, { data: service.adjustStock(ctx.body || {}) }),
	cashMove: (ctx) => ctx.json(201, { data: service.cashMove(ctx.body || {}) }),
});
