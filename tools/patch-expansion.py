import re

ROOT = "/data/meridian/fullstack"

gen = open(ROOT + "/tools/generate-modules.js").read()

suppliers = '''\tsuppliers: {
\t\tlabel: "Proveedor",
\t\tfields: {
\t\t\tname: { type: "string", required: true },
\t\t\tcuit: { type: "string", default: "\u2014" },
\t\t\temail: { type: "string", default: "\u2014" },
\t\t\tphone: { type: "string", default: "\u2014" },
\t\t\tterms: { type: "string", default: "Contado", enum: ["Contado", "Cta cte 15 d\u00edas", "Cta cte 30 d\u00edas", "Cta cte 60 d\u00edas"] },
\t\t},
\t\tsample: { name: "Proveedor de prueba SA", cuit: "30-11111111-1" },
\t\tpatch: { terms: "Cta cte 30 d\u00edas" },
\t},
};'''

anchor = "\t\tpatch: { memo: \"Ingreso editado\" },\n\t},\n};"
assert anchor in gen, "anchor cash no encontrado"
gen = gen.replace(anchor, "\t\tpatch: { memo: \"Ingreso editado\" },\n\t},\n" + suppliers, 1)

old_del = '\'\\tapp.router.delete(base + "/:id", app.auth, c.remove);\\n\' +'
new_del = '\'\\tapp.router.delete(base + "/:id", app.auth, app.requireRole("admin"), c.remove);\\n\' +'
assert old_del in gen, "delete template no encontrado"
gen = gen.replace(old_del, new_del)
open(ROOT + "/tools/generate-modules.js", "w").write(gen)
print("generator OK")

k = open(ROOT + "/core/kernel.js").read()
old_auth = 'app.auth = require("./security/authMiddleware")(app);'
new_auth = old_auth + '''
\tapp.requireRole = (role) => async (ctx) => {
\t\tconst user = ctx.state.user || {};
\t\tif (user.role !== role) throw new (require("./errors").Forbidden)("Requiere rol " + role + " (ten\u00e9s: " + (user.role || "ninguno") + ")");
\t};'''
assert old_auth in k, "anchor auth no encontrado"
k = k.replace(old_auth, new_auth)

old_end = 'if (!res.writableEnded) sendJson(res, 204);'
new_end = 'if (!res.writableEnded && !ctx.state.streaming) sendJson(res, 204);'
assert old_end in k, "anchor 204 no encontrado"
k = k.replace(old_end, new_end)
open(ROOT + "/core/kernel.js", "w").write(k)
print("kernel OK")

r = open(ROOT + "/app/registry.js").read()
assert '"cash",' in r and 'const HAND_MODULES = ["auth", "sales", "reports", "health"];' in r
r = r.replace('"cash",', '"cash",\n\t"suppliers",')
r = r.replace('const HAND_MODULES = ["auth", "sales", "reports", "health"];',
              'const HAND_MODULES = ["auth", "sales", "purchases", "reports", "audit", "events", "health"];')
open(ROOT + "/app/registry.js", "w").write(r)
print("registry OK")

s = open(ROOT + "/modules/reports/service.js").read()
old_boot = 'cash: s.collection("cash"),'
new_boot = 'cash: s.collection("cash"),\n\t\t\tsuppliers: s.collection("suppliers"),\n\t\t\tpurchases: s.collection("purchases"),'
assert old_boot in s, "anchor bootstrap no encontrado"
s = s.replace(old_boot, new_boot)
open(ROOT + "/modules/reports/service.js", "w").write(s)
print("reports bootstrap OK")
