/**
 * Copy images into server/static and set device.img (public path segment).
 *
 * 1. Name files: 1.jpg, 2.png … (stem = device id).
 * 2. Put them in server/static/browser-import/ (or pass a directory as argv[2]).
 * 3. Run: pnpm import-images  OR  node scripts/import-images-from-dir.js [folder]
 */
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const sequelize = require("../db");
const { Device } = require("../models/models");
const { sniffImageMime } = require("./fetchRemoteImage");

const STATIC_DIR = path.resolve(__dirname, "..", "static");
const DEFAULT_DIR = path.resolve(STATIC_DIR, "browser-import");

async function main() {
	const dir = path.resolve(process.argv[2] || DEFAULT_DIR);
	if (!fs.existsSync(dir)) {
		console.error(`Folder not found: ${dir}`);
		console.error("Create it and add files like 1.jpg, 2.png (device id = filename stem).");
		process.exit(1);
	}

	await sequelize.authenticate();
	await sequelize.sync({ alter: true });
	fs.mkdirSync(STATIC_DIR, { recursive: true });

	const files = fs.readdirSync(dir).filter((f) => {
		return /\.(jpe?g|png|gif|webp)$/i.test(f);
	});

	if (files.length === 0) {
		console.error(`No image files in ${dir}`);
		process.exit(1);
	}

	let updated = 0;
	for (const name of files) {
		const id = Number.parseInt(path.basename(name, path.extname(name)), 10);
		if (!Number.isFinite(id) || id < 1) {
			console.warn(`Skip (bad id): ${name}`);
			continue;
		}
		const fp = path.join(dir, name);
		const buffer = fs.readFileSync(fp);
		const mime = sniffImageMime(buffer);
		if (!mime) {
			console.warn(`Skip (not a valid image): ${name}`);
			continue;
		}
		const device = await Device.findByPk(id);
		if (!device) {
			console.warn(`Skip (no device ${id}): ${name}`);
			continue;
		}
		const ext = path.extname(name) || ".jpg";
		const destName = `import-${id}-${uuidv4()}${ext}`;
		fs.writeFileSync(path.join(STATIC_DIR, destName), buffer);
		const oldImg = device.img;
		await device.update({ img: destName });
		if (oldImg && oldImg !== destName) {
			const oldPath = path.join(STATIC_DIR, oldImg);
			try {
				if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
			} catch {
				/* ignore */
			}
		}
		console.log(`Updated device #${id} (${device.name}) → static/${destName}`);
		updated++;
	}

	console.log(`Done. ${updated} device(s) updated.`);
	await sequelize.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
