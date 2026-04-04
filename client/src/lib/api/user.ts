import { apiFetch } from "./client"

export async function loginFn(email: string, password: string): Promise<{ token: string }> {
	return apiFetch<{ token: string }>("/user/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	})
}

export async function registerFn(email: string, password: string): Promise<{ token: string }> {
	return apiFetch<{ token: string }>("/user/registration", {
		method: "POST",
		body: JSON.stringify({ email, password, role: "USER" }),
	})
}

export async function checkAuthFn(): Promise<{ token: string }> {
	return apiFetch<{ token: string }>("/user/auth")
}
