export const TOKEN_KEY = "token"

export interface JwtPayload {
	id: number
	email: string
	role: "USER" | "ADMIN"
	iat: number
	exp: number
}

export function decodeToken(token: string): JwtPayload | null {
	try {
		const payload = token.split(".")[1]
		const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
		return JSON.parse(decoded) as JwtPayload
	} catch {
		return null
	}
}

export function isTokenExpired(payload: JwtPayload): boolean {
	return payload.exp * 1000 < Date.now()
}
