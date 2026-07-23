module.exports = {
	name: "orders",
	label: "Pedido",
	fields: {
		"number": { type: "number", required: true },
		"date": { type: "string", default: () => new Date().toISOString() },
		"customerId": { type: "string", required: true },
		"customer": { type: "string", required: true },
		"lines": { type: "array", default: [] },
		"total": { type: "number", default: 0 },
		"status": { type: "string", default: "confirmado", enum: ["borrador","confirmado","cancelado"] },
		"invoiceNumber": { type: "string", default: "" }
	},
};
