module.exports = {
	name: "entries",
	label: "Asiento",
	fields: {
		"date": { type: "string", default: () => new Date().toISOString() },
		"memo": { type: "string", required: true },
		"lines": { type: "array", required: true }
	},
};
