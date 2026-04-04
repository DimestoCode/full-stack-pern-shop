import { env } from "#/env"
import { TOKEN_KEY } from "#/lib/auth"

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message)
		this.name = "ApiError"
	}
}

export async function apiFetch<T>(
	path: string,
	init: RequestInit = {},
): Promise<T> {
	const token = localStorage.getItem(TOKEN_KEY)

	const headers: HeadersInit = {
		...init.headers,
	}

	if (token) {
		(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
	}

	if (!(init.body instanceof FormData)) {
		(headers as Record<string, string>)["Content-Type"] = "application/json"
	}

	const res = await fetch(`${env.VITE_API_URL}${path}`, {
		...init,
		headers,
	})

	if (!res.ok) {
		let message = res.statusText
		try {
			const body = (await res.json()) as { message?: string }
			if (body.message) message = body.message
		} catch {
			// ignore
		}
		throw new ApiError(res.status, message)
	}

	if (res.status === 204) return undefined as T

	return res.json() as Promise<T>
}
