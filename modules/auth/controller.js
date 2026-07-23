module.exports = (service) => ({
	login: (ctx) => ctx.json(200, service.login((ctx.body || {}).email, (ctx.body || {}).password)),
	me: (ctx) => ctx.json(200, { data: service.me(ctx.state.user) }),
});
