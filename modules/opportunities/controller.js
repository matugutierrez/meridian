module.exports = (service) => ({
	list: (ctx) => ctx.json(200, { data: service.list() }),
	get: (ctx) => ctx.json(200, { data: service.get(ctx.params.id) }),
	create: (ctx) => ctx.json(201, { data: service.create(ctx.body || {}) }),
	update: (ctx) => ctx.json(200, { data: service.update(ctx.params.id, ctx.body || {}) }),
	remove: (ctx) => ctx.json(200, { data: service.remove(ctx.params.id) }),
});
