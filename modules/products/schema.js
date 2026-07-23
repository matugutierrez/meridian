module.exports = {
	name: "products",
	label: "Producto",
	fields: {
		"sku": { type: "string", required: true },
		"name": { type: "string", required: true },
		"cat": { type: "string", default: "General" },
		"cost": { type: "number", min: 0, default: 0 },
		"price": { type: "number", min: 0, default: 0 },
		"stock": { type: "number", default: 0 },
		"min": { type: "number", min: 0, default: 5 }
	},
};
