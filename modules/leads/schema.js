module.exports = {
	name: "leads",
	label: "Lead",
	fields: {
		"name": { type: "string", required: true },
		"contact": { type: "string", default: "" },
		"source": { type: "string", default: "Web" },
		"status": { type: "string", default: "nuevo", enum: ["nuevo","contactado","descartado"] },
		"note": { type: "string", default: "" }
	},
};
