/**
 * Resets catalog + demo users and repopulates realistic store data.
 * Run from server/: `node scripts/seed.js` or `pnpm seed`
 */
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const { fetchRemoteImage } = require("./fetchRemoteImage");

const STATIC_DIR = path.resolve(__dirname, "..", "static");

function extForMime(mime) {
	if (mime === "image/jpeg") return ".jpg";
	if (mime === "image/png") return ".png";
	if (mime === "image/webp") return ".webp";
	if (mime === "image/gif") return ".gif";
	if (mime === "image/avif") return ".avif";
	return ".bin";
}

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const sequelize = require("../db");
const {
	CartDevice,
	Rating,
	DeviceInfo,
	Device,
	TypeBrand,
	Cart,
	User,
	Type,
	Brand,
} = require("../models/models");

/** Neutral gray JPEG (~1.4KB) if download fails — still a real image, not a broken icon */
const FALLBACK_JPEG = Buffer.from(
	"/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABAAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=",
	"base64",
);

function unsplash(photoId) {
	return `https://images.unsplash.com/photo-${photoId}?auto=format&fm=jpg&w=900&q=85`;
}

function pexels(photoId) {
	return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=900`;
}

/**
 * Real product-style stock (Unsplash + Pexels). Demo seeding only — respect each site’s license.
 * Fetched via fetchRemoteImage.js (curl + magic-byte check) to avoid corrupt/HTML bodies in BYTEA.
 */
const DEVICE_IMAGE_URLS = {
	"seed-iphone-16-pro.jpg": unsplash("1592750475338-74b7b21085ab"),
	"seed-iphone-15.jpg": pexels("1092644"),
	"seed-galaxy-s24-ultra.jpg": unsplash("1610945265064-0e34e5519bbf"),
	"seed-pixel-9-pro.jpg": pexels("788946"),
	"seed-galaxy-a55.jpg": pexels("1334597"),
	"seed-pixel-8a.jpg": unsplash("1565849904461-04a58ad377e0"),
	"seed-mbp-16-m4.jpg": unsplash("1587825140708-dfaf72ae4b04"),
	"seed-mba-13-m3.jpg": unsplash("1625842268584-8f3296236761"),
	"seed-xps-15.jpg": unsplash("1496181133206-80ce9b88a853"),
	"seed-spectre-x360.jpg": unsplash("1541807084-5c52b6b3adef"),
	"seed-galaxy-book4.jpg": pexels("4065874"),
	"seed-thinkpad-x1.jpg": unsplash("1588872657578-7efd1f1555ed"),
	"seed-inspiron-16.jpg": pexels("265667"),
	"seed-ipad-pro-13.jpg": unsplash("1544244015-0df4b3ffc6b0"),
	"seed-ipad-air-11.jpg": unsplash("1561154464-82e9adf32764"),
	"seed-galaxy-tab-s9.jpg": pexels("3780681"),
	"seed-fire-hd-10.jpg": pexels("1229861"),
	"seed-wh1000xm5.jpg": unsplash("1505740420928-5e560c06d30e"),
	"seed-qc-ultra.jpg": pexels("991821"),
	"seed-airpods-pro-2.jpg": unsplash("1546435770-a3e426bf472b"),
	"seed-galaxy-buds3.jpg": pexels("437037"),
	"seed-aw-ultra-2.jpg": unsplash("1434493789847-2f02dc6ca35d"),
	"seed-galaxy-watch-7.jpg": unsplash("1526406915894-7bcd65f60845"),
	"seed-fenix-8.jpg": unsplash("1579586337278-3befd40fd17a"),
	"seed-echo-dot-5.jpg": pexels("274422"),
};

/**
 * @param {string} label
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer; mime: string }>}
 */
async function fetchImageForDevice(label, url) {
	try {
		const { buffer, mime } = await fetchRemoteImage(url);
		if (buffer.length < 500) throw new Error("response too small");
		process.stdout.write(`  image ok: ${label} (${mime}, ${buffer.length}b)\n`);
		return { buffer, mime };
	} catch (e) {
		const detail = e instanceof Error ? e.message : String(e);
		console.warn(`  WARN ${label}: ${detail} — using local fallback JPEG`);
		return { buffer: FALLBACK_JPEG, mime: "image/jpeg" };
	}
}

const TYPES = [
	"Smartphones",
	"Laptops",
	"Tablets",
	"Audio",
	"Wearables",
];

const BRANDS = [
	"Apple",
	"Samsung",
	"Google",
	"Sony",
	"Dell",
	"HP",
	"Bose",
	"Garmin",
	"Lenovo",
	"Amazon",
];

/** type name -> brand names that sell in that category */
const TYPE_BRAND_LINKS = {
	Smartphones: ["Apple", "Samsung", "Google"],
	Laptops: ["Apple", "Dell", "HP", "Samsung", "Lenovo"],
	Tablets: ["Apple", "Samsung", "Amazon"],
	Audio: ["Sony", "Bose", "Apple", "Samsung", "Amazon"],
	Wearables: ["Apple", "Samsung", "Garmin"],
};

/**
 * name, price, rating (0–5), imageKey (lookup in DEVICE_IMAGE_URLS), type, brand, specs
 */
const DEVICE_SEED = [
	{
		name: "iPhone 16 Pro 256GB",
		price: 1099.99,
		rating: 5,
		img: "seed-iphone-16-pro.jpg",
		type: "Smartphones",
		brand: "Apple",
		info: [
			{ title: "Display", description: '6.3" Super Retina XDR, ProMotion 120Hz' },
			{ title: "Chip", description: "A18 Pro" },
			{ title: "Camera", description: "48MP Fusion main, 5× telephoto" },
			{ title: "Battery", description: "Up to 27 hours video playback" },
		],
	},
	{
		name: "iPhone 15 128GB",
		price: 799.0,
		rating: 4,
		img: "seed-iphone-15.jpg",
		type: "Smartphones",
		brand: "Apple",
		info: [
			{ title: "Display", description: '6.1" Super Retina XDR' },
			{ title: "Chip", description: "A16 Bionic" },
			{ title: "Camera", description: "48MP main, 2× telephoto" },
		],
	},
	{
		name: "Galaxy S24 Ultra 512GB",
		price: 1299.99,
		rating: 5,
		img: "seed-galaxy-s24-ultra.jpg",
		type: "Smartphones",
		brand: "Samsung",
		info: [
			{ title: "Display", description: '6.8" QHD+ Dynamic AMOLED 2X' },
			{ title: "S Pen", description: "Built-in, Bluetooth enabled" },
			{ title: "Camera", description: "200MP wide, 100× Space Zoom" },
		],
	},
	{
		name: "Pixel 9 Pro 256GB",
		price: 999.0,
		rating: 5,
		img: "seed-pixel-9-pro.jpg",
		type: "Smartphones",
		brand: "Google",
		info: [
			{ title: "Display", description: '6.3" LTPO OLED' },
			{ title: "Tensor", description: "Google Tensor G4" },
			{ title: "AI", description: "Gemini Nano on-device" },
		],
	},
	{
		name: "Galaxy A55 5G 128GB",
		price: 449.99,
		rating: 4,
		img: "seed-galaxy-a55.jpg",
		type: "Smartphones",
		brand: "Samsung",
		info: [
			{ title: "Display", description: '6.6" FHD+ Super AMOLED 120Hz' },
			{ title: "Durability", description: "Gorilla Glass Victus+, IP67" },
		],
	},
	{
		name: "Pixel 8a 128GB",
		price: 499.0,
		rating: 4,
		img: "seed-pixel-8a.jpg",
		type: "Smartphones",
		brand: "Google",
		info: [
			{ title: "Display", description: '6.1" OLED 120Hz' },
			{ title: "Camera", description: "64MP main with Super Res Zoom" },
		],
	},
	{
		name: 'MacBook Pro 16" M4 Pro 512GB',
		price: 2799.0,
		rating: 5,
		img: "seed-mbp-16-m4.jpg",
		type: "Laptops",
		brand: "Apple",
		info: [
			{ title: "Chip", description: "M4 Pro, 14-core CPU, 20-core GPU" },
			{ title: "Memory", description: "24GB unified memory" },
			{ title: "Display", description: '16.2" Liquid Retina XDR' },
		],
	},
	{
		name: 'MacBook Air 13" M3 256GB',
		price: 1099.0,
		rating: 5,
		img: "seed-mba-13-m3.jpg",
		type: "Laptops",
		brand: "Apple",
		info: [
			{ title: "Chip", description: "M3, 8-core CPU, 10-core GPU" },
			{ title: "Weight", description: "2.7 lb (1.24 kg)" },
			{ title: "Battery", description: "Up to 18 hours" },
		],
	},
	{
		name: "XPS 15 OLED i7 32GB",
		price: 1899.99,
		rating: 4,
		img: "seed-xps-15.jpg",
		type: "Laptops",
		brand: "Dell",
		info: [
			{ title: "Display", description: '15.6" 3.5K OLED touch' },
			{ title: "Processor", description: "Intel Core Ultra 7" },
			{ title: "Graphics", description: "NVIDIA GeForce RTX 4050" },
		],
	},
	{
		name: "Spectre x360 14 2-in-1",
		price: 1449.0,
		rating: 4,
		img: "seed-spectre-x360.jpg",
		type: "Laptops",
		brand: "HP",
		info: [
			{ title: "Display", description: '14" 2.8K OLED, touch + pen' },
			{ title: "Modes", description: "Laptop, tent, stand, tablet" },
		],
	},
	{
		name: "Galaxy Book4 Pro 16",
		price: 1349.99,
		rating: 4,
		img: "seed-galaxy-book4.jpg",
		type: "Laptops",
		brand: "Samsung",
		info: [
			{ title: "Display", description: '16" Dynamic AMOLED 2X' },
			{ title: "Ecosystem", description: "Second Screen with Galaxy Tab" },
		],
	},
	{
		name: "ThinkPad X1 Carbon Gen 12",
		price: 1699.0,
		rating: 5,
		img: "seed-thinkpad-x1.jpg",
		type: "Laptops",
		brand: "Lenovo",
		info: [
			{ title: "Build", description: "Carbon fiber / magnesium chassis" },
			{ title: "Keyboard", description: "TrackPoint + glass touchpad" },
			{ title: "Security", description: "Match-on-chip fingerprint reader" },
		],
	},
	{
		name: "Inspiron 16 Plus",
		price: 899.99,
		rating: 3,
		img: "seed-inspiron-16.jpg",
		type: "Laptops",
		brand: "Dell",
		info: [
			{ title: "Display", description: '16" FHD+ IPS' },
			{ title: "Use case", description: "Everyday productivity & streaming" },
		],
	},
	{
		name: 'iPad Pro 13" M4 256GB',
		price: 1299.0,
		rating: 5,
		img: "seed-ipad-pro-13.jpg",
		type: "Tablets",
		brand: "Apple",
		info: [
			{ title: "Display", description: '13" Ultra Retina XDR (Tandem OLED)' },
			{ title: "Accessory", description: "Apple Pencil Pro, Magic Keyboard" },
		],
	},
	{
		name: "iPad Air 11 M2 128GB",
		price: 599.0,
		rating: 4,
		img: "seed-ipad-air-11.jpg",
		type: "Tablets",
		brand: "Apple",
		info: [
			{ title: "Display", description: '11" Liquid Retina' },
			{ title: "Colors", description: "Blue, purple, starlight, space gray" },
		],
	},
	{
		name: "Galaxy Tab S9 256GB",
		price: 919.99,
		rating: 4,
		img: "seed-galaxy-tab-s9.jpg",
		type: "Tablets",
		brand: "Samsung",
		info: [
			{ title: "Display", description: '11" Dynamic AMOLED 2X 120Hz' },
			{ title: "S Pen", description: "Included, magnetic attach" },
			{ title: "Durability", description: "IP68 water & dust resistance" },
		],
	},
	{
		name: "Fire HD 10 Plus",
		price: 179.99,
		rating: 3,
		img: "seed-fire-hd-10.jpg",
		type: "Tablets",
		brand: "Amazon",
		info: [
			{ title: "Display", description: '10.1" 1080p Full HD' },
			{ title: "Hands-free", description: "Alexa show mode" },
		],
	},
	{
		name: "WH-1000XM5 Wireless Headphones",
		price: 399.99,
		rating: 5,
		img: "seed-wh1000xm5.jpg",
		type: "Audio",
		brand: "Sony",
		info: [
			{ title: "Noise canceling", description: "Industry-leading ANC, 8 mics" },
			{ title: "Battery", description: "30 hours, 3 min charge = 3 hours" },
		],
	},
	{
		name: "QuietComfort Ultra Earbuds",
		price: 299.0,
		rating: 5,
		img: "seed-qc-ultra.jpg",
		type: "Audio",
		brand: "Bose",
		info: [
			{ title: "Audio", description: "CustomTune per-ear calibration" },
			{ title: "Immersive", description: "Spatial audio modes" },
		],
	},
	{
		name: "AirPods Pro (2nd gen) USB-C",
		price: 249.0,
		rating: 5,
		img: "seed-airpods-pro-2.jpg",
		type: "Audio",
		brand: "Apple",
		info: [
			{ title: "Chip", description: "H2, Adaptive Audio" },
			{ title: "Case", description: "USB-C, Precision Finding, speaker" },
		],
	},
	{
		name: "Galaxy Buds3 Pro",
		price: 229.99,
		rating: 4,
		img: "seed-galaxy-buds3.jpg",
		type: "Audio",
		brand: "Samsung",
		info: [
			{ title: "ANC", description: "Adaptive noise control" },
			{ title: "360 Audio", description: "Head tracking on Galaxy devices" },
		],
	},
	{
		name: "Apple Watch Ultra 2",
		price: 799.0,
		rating: 5,
		img: "seed-aw-ultra-2.jpg",
		type: "Wearables",
		brand: "Apple",
		info: [
			{ title: "Display", description: '49mm titanium, 3000 nits peak' },
			{ title: "Action button", description: "Customizable quick controls" },
			{ title: "Diving", description: "EN13319 certified, depth gauge" },
		],
	},
	{
		name: "Galaxy Watch 7 44mm",
		price: 329.99,
		rating: 4,
		img: "seed-galaxy-watch-7.jpg",
		type: "Wearables",
		brand: "Samsung",
		info: [
			{ title: "Health", description: "Sleep apnea detection, HR zones" },
			{ title: "Battery", description: "Up to 40 hours typical use" },
		],
	},
	{
		name: "fēnix 8 Solar 47mm",
		price: 1099.99,
		rating: 5,
		img: "seed-fenix-8.jpg",
		type: "Wearables",
		brand: "Garmin",
		info: [
			{ title: "Battery", description: "Solar charging, weeks in smartwatch mode" },
			{ title: "Sports", description: "Maps, golf, dive, multi-band GNSS" },
		],
	},
	{
		name: "Echo Dot (5th Gen)",
		price: 49.99,
		rating: 4,
		img: "seed-echo-dot-5.jpg",
		type: "Audio",
		brand: "Amazon",
		info: [
			{ title: "Audio", description: "Clearer vocals, deeper bass" },
			{ title: "Smart home", description: "eero built-in, temperature sensor" },
		],
	},
];

async function wipe() {
	if (sequelize.getDialect() === "postgres") {
		await sequelize.query(`
			TRUNCATE TABLE
				"cart_devices", "ratings", "device_infos", "devices",
				"type_brands", "carts", "users", "types", "brands"
			RESTART IDENTITY CASCADE;
		`);
		return;
	}
	await CartDevice.destroy({ where: {}, force: true });
	await Rating.destroy({ where: {}, force: true });
	await DeviceInfo.destroy({ where: {}, force: true });
	await Device.destroy({ where: {}, force: true });
	await TypeBrand.destroy({ where: {}, force: true });
	await Cart.destroy({ where: {}, force: true });
	await User.destroy({ where: {}, force: true });
	await Type.destroy({ where: {}, force: true });
	await Brand.destroy({ where: {}, force: true });
}

async function main() {
	if (!process.env.DB_NAME || !process.env.DB_USER) {
		console.error("Missing DB env vars. Configure server/.env first.");
		process.exit(1);
	}

	console.log("Connecting…");
	await sequelize.authenticate();

	// Legacy rows may have img = NULL (BYTEA era). PG rejects SET NOT NULL while nulls exist.
	await sequelize
		.query(
			`UPDATE "devices" SET "img" = '_placeholder.jpg' WHERE "img" IS NULL`,
		)
		.catch(() => {});

	await sequelize.sync({ alter: true });

	console.log("Clearing existing data…");
	await wipe();

	console.log("Fetching images → server/static, storing filename in DB…");
	fs.mkdirSync(STATIC_DIR, { recursive: true });

	console.log("Inserting types & brands…");
	const typeRows = await Type.bulkCreate(TYPES.map((name) => ({ name })));
	const brandRows = await Brand.bulkCreate(BRANDS.map((name) => ({ name })));

	const typeByName = Object.fromEntries(typeRows.map((t) => [t.name, t]));
	const brandByName = Object.fromEntries(brandRows.map((b) => [b.name, b]));

	for (const [tName, bNames] of Object.entries(TYPE_BRAND_LINKS)) {
		const t = typeByName[tName];
		const brands = bNames.map((n) => brandByName[n]).filter(Boolean);
		if (t && brands.length) await t.addBrand(brands);
	}

	console.log("Inserting devices & specs…");
	for (const row of DEVICE_SEED) {
		const url = DEVICE_IMAGE_URLS[row.img];
		if (!url) {
			throw new Error(`Missing DEVICE_IMAGE_URLS entry for ${row.img}`);
		}
		const { buffer, mime } = await fetchImageForDevice(row.name, url);
		const base = path.basename(row.img, path.extname(row.img));
		const fileName = `${base}${extForMime(mime)}`;
		fs.writeFileSync(path.join(STATIC_DIR, fileName), buffer);
		const device = await Device.create({
			name: row.name,
			price: row.price,
			rating: row.rating,
			img: fileName,
			typeId: typeByName[row.type].id,
			brandId: brandByName[row.brand].id,
		});
		await DeviceInfo.bulkCreate(
			row.info.map((i) => ({
				title: i.title,
				description: i.description,
				deviceId: device.id,
			})),
		);
	}

	const hash = await bcrypt.hash("demo123", 5);
	console.log("Creating demo users (password: demo123)…");
	const shopper = await User.create({
		email: "shopper@demo.store",
		password: hash,
		role: "USER",
	});
	const admin = await User.create({
		email: "admin@demo.store",
		password: hash,
		role: "ADMIN",
	});

	const shopperCart = await Cart.create({ userId: shopper.id });
	const adminCart = await Cart.create({ userId: admin.id });

	const devices = await Device.findAll({ order: [["id", "ASC"]] });
	const pick = (i) => devices[i % devices.length];

	await CartDevice.bulkCreate([
		{ cartId: shopperCart.id, deviceId: pick(0).id },
		{ cartId: shopperCart.id, deviceId: pick(3).id },
		{ cartId: shopperCart.id, deviceId: pick(7).id },
	]);

	await Rating.bulkCreate([
		{ userId: shopper.id, deviceId: pick(1).id, rate: 5 },
		{ userId: shopper.id, deviceId: pick(4).id, rate: 4 },
		{ userId: admin.id, deviceId: pick(2).id, rate: 5 },
		{ userId: admin.id, deviceId: pick(5).id, rate: 4 },
	]);

	console.log("Done.");
	console.log("  Users: shopper@demo.store, admin@demo.store (password: demo123)");
	console.log(`  Devices: ${devices.length}, types: ${TYPES.length}, brands: ${BRANDS.length}`);
	await sequelize.close();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
