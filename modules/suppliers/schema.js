module.exports = {
	name: "suppliers",
	label: "Proveedor",
	fields: {
		"name": { type: "string", required: true },
		"cuit": { type: "string", default: "—" },
		"email": { type: "string", default: "—" },
		"phone": { type: "string", default: "—" },
		"terms": { type: "string", default: "Contado", enum: ["Contado","Cta cte 15 días","Cta cte 30 días","Cta cte 60 días"] }
	},
};
