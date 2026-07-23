set -e
cd /data/meridian/fullstack

echo '== TESTS =='
node --test 2>&1 | grep -E '^. (tests|pass|fail) ' | tail -3

echo '== SERVIDOR =='
rm -rf data
PORT=4321 nohup node server.js > /tmp/meridian2.log 2>&1 &
SRV=$!
sleep 1.5

TOKEN=$(curl -s -X POST localhost:4321/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@meridian.app","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "login OK"

echo '== ENDPOINTS NUEVOS =='
curl -s localhost:4321/api/suppliers -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("suppliers:",len(d))'
curl -s localhost:4321/api/purchases -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("purchases:",len(d),[p["status"] for p in d])'
curl -s localhost:4321/api/reports/ledger -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("ledger balanced:",d["balanced"],"cuentas:",len(d["rows"]))'
curl -s localhost:4321/api/reports/income -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("resultado neto:",d["netIncome"])'
curl -s localhost:4321/api/reports/iva -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("iva periodos:",len(d["periods"]))'
curl -s localhost:4321/api/reports/export/invoices -H "Authorization: Bearer $TOKEN" | head -1 | cut -c1-80
curl -s localhost:4321/api/audit -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print("audit rows:",len(d))'
curl -s -o /dev/null -w 'audit sin token: %{http_code}\n' localhost:4321/api/audit
curl -s -N --max-time 2 "localhost:4321/api/events?token=$TOKEN" | head -2 || true

echo '== SCREENSHOTS =='
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=5000 --screenshot=/tmp/purchases.png 'http://127.0.0.1:4321/?demo=1#/purchases' 2>/dev/null
chromium --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=6000 --screenshot=/tmp/reports.png 'http://127.0.0.1:4321/?demo=1#/reports' 2>/dev/null
ls -la /tmp/purchases.png /tmp/reports.png

kill $SRV 2>/dev/null || true
echo '== QA DONE =='
