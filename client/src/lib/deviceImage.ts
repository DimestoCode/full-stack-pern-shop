import { env } from "#/env"

/**
 * Full URL for a device image file hosted under the API server `static/` folder.
 * `img` is the filename stored in the database (e.g. `abc.jpg`).
 */
export function deviceImageSrc(img: string | null | undefined): string {
	if (!img?.trim()) {
		return ""
	}
	const base = env.VITE_STATIC_URL.replace(/\/$/, "")
	return `${base}/${img.replace(/^\//, "")}`
}
