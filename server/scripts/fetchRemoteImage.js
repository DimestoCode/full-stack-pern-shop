/**
 * Reliable image fetch for seeding: prefers system curl (OS cert store), validates magic bytes.
 * Avoids saving HTML/error pages and mis-tagged binary as images.
 */
const { spawnSync } = require("child_process");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const MAX_REDIRECTS = 8;
const MAX_BYTES = 25 * 1024 * 1024;

/**
 * @param {Buffer} b
 * @returns {string | null} image/* mime or null if not a raster image
 */
function sniffImageMime(b) {
	if (!b || b.length < 12) return null;
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
	if (
		b[0] === 0x89 &&
		b[1] === 0x50 &&
		b[2] === 0x4e &&
		b[3] === 0x47
	) {
		return "image/png";
	}
	if (
		b.toString("ascii", 0, 4) === "RIFF" &&
		b.toString("ascii", 8, 12) === "WEBP"
	) {
		return "image/webp";
	}
	if (b.toString("ascii", 0, 6) === "GIF87a" || b.toString("ascii", 0, 6) === "GIF89a") {
		return "image/gif";
	}
	// AVIF / HEIC (ISO BMFF): "ftyp" box, brand often "avif" or "avis"
	const ftyp = b.indexOf(Buffer.from("ftyp"));
	if (ftyp >= 4 && ftyp < 64) {
		const brand = b.toString("ascii", ftyp + 4, ftyp + 8);
		if (brand === "avif" || brand === "avis" || brand === "mif1") {
			return "image/avif";
		}
	}
	// HTML / JSON error body
	const head = b.slice(0, 64).toString("utf8").trimStart();
	if (head.startsWith("<") || head.startsWith("{") || head.startsWith("<!")) return null;
	return null;
}

function downloadWithCurl(url) {
	const r = spawnSync(
		"curl",
		[
			"-fsSL",
			"--connect-timeout",
			"20",
			"--max-time",
			"90",
			"-A",
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (compatible; OnlineStoreSeed/1.0)",
			"-H",
			"Accept: image/jpeg,image/png,image/webp,image/apng,image/*,*/*;q=0.5",
			url,
		],
		{ encoding: "buffer", maxBuffer: MAX_BYTES },
	);
	if (r.error || r.status !== 0 || !r.stdout?.length) return null;
	return r.stdout;
}

function downloadWithNode(urlString, redirects = 0) {
	return new Promise((resolve, reject) => {
		if (redirects > MAX_REDIRECTS) {
			reject(new Error("too many redirects"));
			return;
		}
		const url = new URL(urlString);
		const lib = url.protocol === "https:" ? https : http;
		const req = lib.request(
			url,
			{
				method: "GET",
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (compatible; OnlineStoreSeed/1.0)",
					Accept: "image/jpeg,image/png,image/webp,image/apng,image/*,*/*;q=0.5",
				},
			},
			(res) => {
				if (
					res.statusCode >= 300 &&
					res.statusCode < 400 &&
					res.headers.location
				) {
					const next = new URL(res.headers.location, url).href;
					res.resume();
					downloadWithNode(next, redirects + 1).then(resolve).catch(reject);
					return;
				}
				if (res.statusCode !== 200) {
					reject(new Error(`HTTP ${res.statusCode}`));
					res.resume();
					return;
				}
				const chunks = [];
				let size = 0;
				res.on("data", (c) => {
					size += c.length;
					if (size > MAX_BYTES) {
						req.destroy();
						reject(new Error("response too large"));
						return;
					}
					chunks.push(c);
				});
				res.on("end", () => resolve(Buffer.concat(chunks)));
				res.on("error", reject);
			},
		);
		req.on("error", reject);
		req.end();
	});
}

/**
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer; mime: string }>}
 */
async function fetchRemoteImage(url) {
	let buf = downloadWithCurl(url);
	if (!buf || buf.length < 100) {
		buf = await downloadWithNode(url);
	}
	if (!buf || buf.length < 100) {
		throw new Error("empty or missing body");
	}
	const mime = sniffImageMime(buf);
	if (!mime) {
		throw new Error("not a recognized image (got HTML or unknown binary)");
	}
	return { buffer: buf, mime };
}

module.exports = {
	fetchRemoteImage,
	sniffImageMime,
	downloadWithCurl,
};
