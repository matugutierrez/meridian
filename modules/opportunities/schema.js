module.exports = {
	name: "opportunities",
	label: "Oportunidad",
	fields: {
		"name": { type: "string", required: true },
		"customer": { type: "string", required: true },
		"amount": { type: "number", min: 0, default: 0 },
		"stage": { type: "number", min: 0, max: 3, default: 0 }
	},
};
