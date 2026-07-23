const { BadRequest } = require("../errors");
const config = require("../config");

function parseBody(req) {
	return new Promise((resolve, reject) => {
		if (req.method === "GET" || req.method === "HEAD") return resolve({});
		const chunks = [];
		let size = 0;
		req.on("data", (c) => {
			size += c.length;
			if (size > config.bodyLimitBytes) {
				req.destroy();
				return reject(new BadRequest("Body demasiado grande"));
			}
			chunks.push(c);
		});
		req.on("end", () => {
			if (!chunks.length) return resolve({});
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch (err) {
				reject(new BadRequest("El body debe ser JSON válido"));
			}
		});
		req.on("error", reject);
	});
}

function parseQuery(url) {
	const out = {};
	url.searchParams.forEach((v, k) => { out[k] = v; });
	return out;
}

module.exports = { parseBody, parseQuery };
