module.exports = (app) => ({
	bootstrap() {
		const s = app.store;
		return {
			products: s.collection("products"),
			customers: s.collection("customers"),
			leads: s.collection("leads"),
			opportunities: s.collection("opportunities"),
			orders: s.collection("orders"),
			invoices: s.collection("invoices"),
			entries: s.collection("entries"),
			cash: s.collection("cash"),
			suppliers: s.collection("suppliers"),
			purchases: s.collection("purchases"),
		};
	},

	dashboard() {
		const invoices = app.store.collection("invoices");
		const now = new Date();
		const monthInvoices = invoices.filter((i) => {
			const d = new Date(i.date);
			return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && i.status !== "anulada";
		});
		const days = [];
		for (let i = 13; i >= 0; i--) {
			const d = new Date(Date.now() - i * 86400000);
			const key = d.toDateString();
			days.push({
				label: d.getDate() + "/" + (d.getMonth() + 1),
				total: invoices.filter((x) => new Date(x.date).toDateString() === key && x.status !== "anulada").reduce((s, x) => s + x.total, 0),
			});
		}
		return {
			salesMonth: monthInvoices.reduce((s, i) => s + i.total, 0),
			salesMonthCount: monthInvoices.length,
			pendingTotal: invoices.filter((i) => i.status === "pendiente").reduce((s, i) => s + i.total, 0),
			lowStock: app.store.collection("products").filter((p) => p.stock <= p.min).length,
			openPipeline: app.store.collection("opportunities").filter((o) => o.stage < 3).reduce((s, o) => s + o.amount, 0),
			openOpportunities: app.store.collection("opportunities").filter((o) => o.stage < 3).length,
			salesByDay: days,
			cashBalance: app.store.collection("cash").reduce((s, m) => s + m.amount, 0),
			payables: app.store.collection("purchases").filter((p) => p.status === "recibida").reduce((s, p) => s + p.total, 0),
		};
	},

	/* Libro mayor: todos los asientos agrupados por cuenta, con saldo */
	ledger() {
		const accounts = new Map();
		for (const e of app.store.collection("entries")) {
			for (const l of e.lines || []) {
				if (!accounts.has(l.account)) accounts.set(l.account, { account: l.account, debit: 0, credit: 0, movements: 0 });
				const a = accounts.get(l.account);
				a.debit += l.debit || 0;
				a.credit += l.credit || 0;
				a.movements++;
			}
		}
		const rows = Array.from(accounts.values())
			.map((a) => Object.assign(a, { balance: a.debit - a.credit }))
			.sort((x, y) => x.account.localeCompare(y.account));
		const totalDebit = rows.reduce((s, a) => s + a.debit, 0);
		const totalCredit = rows.reduce((s, a) => s + a.credit, 0);
		return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
	},

	/* Estado de resultados: ingresos (4.x) menos costos y gastos (5.x) */
	income() {
		const { rows } = this.ledger();
		const revenue = rows.filter((a) => a.account.startsWith("4.")).map((a) => ({ account: a.account, amount: a.credit - a.debit }));
		const expenses = rows.filter((a) => a.account.startsWith("5.")).map((a) => ({ account: a.account, amount: a.debit - a.credit }));
		const totalRevenue = revenue.reduce((s, a) => s + a.amount, 0);
		const totalExpenses = expenses.reduce((s, a) => s + a.amount, 0);
		return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
	},

	/* Posición de IVA: débito fiscal por ventas del período */
	iva() {
		const invoices = app.store.collection("invoices").filter((i) => i.status !== "anulada");
		const byMonth = new Map();
		for (const i of invoices) {
			const d = new Date(i.date);
			const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
			if (!byMonth.has(key)) byMonth.set(key, { period: key, net: 0, iva: 0, count: 0 });
			const m = byMonth.get(key);
			m.net += i.net;
			m.iva += i.iva;
			m.count++;
		}
		return { periods: Array.from(byMonth.values()).sort((a, b) => b.period.localeCompare(a.period)) };
	},

	/* Export CSV de una colección permitida */
	csv(collection) {
		const allowed = ["products", "customers", "invoices", "orders", "entries", "cash", "suppliers", "purchases", "leads", "opportunities"];
		if (!allowed.includes(collection)) return null;
		const rows = app.store.collection(collection);
		if (rows.length === 0) return "";
		const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) => c !== "password");
		const esc = (v) => {
			if (v == null) return "";
			const s = typeof v === "object" ? JSON.stringify(v) : String(v);
			return '"' + s.replace(/"/g, '""') + '"';
		};
		return [cols.join(",")].concat(rows.map((r) => cols.map((c) => esc(r[c])).join(","))).join("\n");
	},
});
