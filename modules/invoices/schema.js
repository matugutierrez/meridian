module.exports = {
	name: "invoices",
	label: "Factura",
	fields: {
		"number": { type: "string", required: true },
		"date": { type: "string", default: () => new Date().toISOString() },
		"customerId": { type: "string", required: true },
		"customer": { type: "string", required: true },
		"net": { type: "number", default: 0 },
		"iva": { type: "number", default: 0 },
		"total": { type: "number", default: 0 },
		"status": { type: "string", default: "pendiente", enum: ["pendiente","pagada","anulada"] },
		"cae": { type: "string", default: "" },
		"lines": { type: "array", default: [] }
	},
};
