module.exports = {
	name: "cash",
	label: "Movimiento de caja",
	fields: {
		"date": { type: "string", default: () => new Date().toISOString() },
		"memo": { type: "string", required: true },
		"amount": { type: "number", required: true },
		"method": { type: "string", default: "efectivo" }
	},
};
