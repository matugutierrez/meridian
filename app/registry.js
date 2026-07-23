const CRUD_MODULES = [
	"products",
	"customers",
	"leads",
	"opportunities",
	"orders",
	"invoices",
	"entries",
	"cash",
	"suppliers",
];

const HAND_MODULES = ["auth", "sales", "purchases", "reports", "audit", "events", "health"];

module.exports = CRUD_MODULES.concat(HAND_MODULES).map((name) => require("../modules/" + name + "/routes"));
