const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "public");
const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
};

function serveStatic(req, res, pathname) {
	let file = path.normalize(path.join(ROOT, pathname));
	if (!file.startsWith(ROOT)) file = path.join(ROOT, "index.html");
	if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, "index.html");
	const ext = path.extname(file);
	res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300" });
	fs.createReadStream(file).pipe(res);
}

module.exports = { serveStatic };
