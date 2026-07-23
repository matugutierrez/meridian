# 🧭 Meridian — Business Suite full-stack

ERP + CRM + POS **full-stack real**: backend Node.js con API REST y autenticación JWT + frontend SPA conectado. **Cero dependencias**: no hay `npm install`, todo está construido sobre los módulos nativos de Node (http, crypto, fs). Eso significa deploy instantáneo y ninguna vulnerabilidad de terceros.

## Qué hace

- **Dashboard**: KPIs de ventas, cobranzas, pipeline y stock crítico calculados por el servidor.
- **CRM**: leads, conversión a clientes y pipeline de oportunidades por etapas.
- **Ventas**: pedidos que facturan a cuenta corriente automáticamente.
- **Punto de venta**: catálogo táctil, carrito, cobro con ticket + CAE simulado.
- **Inventario**: stock en tiempo real, alertas de mínimo, ajustes con asiento contable.
- **Facturación**: comprobantes con IVA 21%, cobros, anulaciones con nota de crédito.
- **Contabilidad**: libro diario de **partida doble** generado automáticamente por cada operación.
- **Tesorería**: caja con ingresos/egresos y su contrapartida contable.

Toda la lógica de negocio vive en el **servidor** (módulo `sales`): una venta descuenta stock, emite factura, asienta débito/crédito balanceado y mueve caja en una sola operación atómica. El frontend sólo consume la API.

## Arquitectura

```
server.js               → entrada
core/                   → framework propio
├─ kernel.js            → ensambla config + store + router + módulos
├─ http/                → router con :params, parser JSON, estáticos con fallback SPA
├─ security/            → JWT HS256 firmado a mano + hash scrypt + middleware Bearer
├─ db/                  → store JSON con escritura atómica (tmp+rename) + repositorios
├─ validation/          → validador de esquemas declarativos
└─ events/              → bus de eventos de dominio (products.created, sales.registered…)
app/                    → registro de módulos + seed determinístico
modules/                → 12 módulos: 8 CRUD generados por codegen + auth, sales, reports, health
tools/generate-modules.js → generador de código de los módulos CRUD
tests/                  → 20 tests de integración con node:test (sin libs)
public/                 → SPA (login JWT, 9 módulos de UI, caché con mutaciones optimistas)
docs/                   → las 17 fases de diseño del proyecto
```

## Correr local

```bash
node server.js          # http://localhost:3000
node --test             # corre los 20 tests
```

Usuarios demo: `admin@meridian.app / admin123` · `caja@meridian.app / caja123`
Acceso directo sin login: `http://localhost:3000/?demo=1`

## Probar la API con curl

```bash
curl -s localhost:3000/api/health
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@meridian.app","password":"admin123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s localhost:3000/api/products -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3000/api/sales -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"customerId":"cf","method":"efectivo","lines":[{"productId":"<ID>","qty":2}]}'
```
## Licencia

MIT — hecho como proyecto demostrativo de arquitectura full-stack sin dependencias.
