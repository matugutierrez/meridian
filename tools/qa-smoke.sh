cd "$(dirname "$0")/.."
rm -rf data
PORT=4321 node server.js > /tmp/meridian.log 2>&1 &
SRV=$!
sleep 2

echo "--- health (publico) ---"
curl -s http://127.0.0.1:4321/api/health
echo

echo "--- login ---"
TOKEN=$(curl -s -X POST http://127.0.0.1:4321/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@meridian.app","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "TOKEN: ${TOKEN:0:30}..."

echo "--- products (con token) ---"
curl -s http://127.0.0.1:4321/api/products -H "Authorization: Bearer $TOKEN" | head -c 220
echo

echo "--- dashboard KPIs ---"
curl -s http://127.0.0.1:4321/api/reports/dashboard -H "Authorization: Bearer $TOKEN" | head -c 300
echo

echo "--- venta POS via curl ---"
PID=$(curl -s http://127.0.0.1:4321/api/products -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"][0]["id"])')
curl -s -X POST http://127.0.0.1:4321/api/sales -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"customerId\":\"cf\",\"method\":\"efectivo\",\"lines\":[{\"productId\":\"$PID\",\"qty\":2}]}" | head -c 300
echo

echo "--- status codes ---"
curl -s -o /dev/null -w 'sin token /api/products => %{http_code}\n' http://127.0.0.1:4321/api/products
curl -s -o /dev/null -w 'GET / (SPA) => %{http_code}\n' http://127.0.0.1:4321/
curl -s -o /dev/null -w 'GET /js/app.js => %{http_code}\n' http://127.0.0.1:4321/js/app.js
curl -s -o /dev/null -w 'GET /ruta-inexistente (fallback SPA) => %{http_code}\n' http://127.0.0.1:4321/lo-que-sea

echo "SRV_PID=$SRV"
