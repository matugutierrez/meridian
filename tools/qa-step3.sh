set -e
TOKEN=$(curl -s -X POST localhost:4321/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@meridian.app","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "login OK"
curl -s localhost:4321/api/suppliers -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("suppliers:",len(d))'
curl -s localhost:4321/api/purchases -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("purchases:",[p["status"] for p in d])'
curl -s localhost:4321/api/reports/ledger -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("ledger balanced:",d["balanced"],"cuentas:",len(d["rows"]))'
curl -s localhost:4321/api/reports/income -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("resultado neto:",d["netIncome"])'
curl -s localhost:4321/api/reports/iva -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("iva periodos:",len(d["periods"]))'
curl -s localhost:4321/api/reports/export/invoices -H "Authorization: Bearer $TOKEN" | head -1 | cut -c1-70
curl -s localhost:4321/api/audit -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("audit rows:",len(d))'
curl -s -o /dev/null -w 'audit sin token: %{http_code}\n' localhost:4321/api/audit
echo STEP3-DONE
