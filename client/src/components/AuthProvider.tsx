import { createContext, useCallback, useEffect, useMemo, useState } from "react"
import {
	type JwtPayload,
	TOKEN_KEY,
	decodeToken,
	isTokenExpired,
} from "#/lib/auth"
import { env } from "#/env"

interface AuthUser {
	id: number
	email: string
	role: "USER" | "ADMIN"
}

interface AuthContextValue {
	user: AuthUser | null
	token: string | null
	isAuthenticated: boolean
	isAdmin: boolean
	login: (token: string) => void
	logout: () => void
}

export const AuthContext = createContext<AuthContextValue>({
	user: null,
	token: null,
	isAuthenticated: false,
	isAdmin: false,
	login: () => {},
	logout: () => {},
})

function payloadToUser(payload: JwtPayload): AuthUser {
	return { id: payload.id, email: payload.email, role: payload.role }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(() => {
		const stored = localStorage.getItem(TOKEN_KEY)
		if (!stored) return null
		const payload = decodeToken(stored)
		if (!payload || isTokenExpired(payload)) {
			localStorage.removeItem(TOKEN_KEY)
			return null
		}
		return stored
	})

	const [user, setUser] = useState<AuthUser | null>(() => {
		const stored = localStorage.getItem(TOKEN_KEY)
		if (!stored) return null
		const payload = decodeToken(stored)
		if (!payload || isTokenExpired(payload)) return null
		return payloadToUser(payload)
	})

	const login = useCallback((newToken: string) => {
		const payload = decodeToken(newToken)
		if (!payload) return
		localStorage.setItem(TOKEN_KEY, newToken)
		setToken(newToken)
		setUser(payloadToUser(payload))
	}, [])

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY)
		setToken(null)
		setUser(null)
	}, [])

	// Verify token with server on mount
	useEffect(() => {
		const stored = localStorage.getItem(TOKEN_KEY)
		if (!stored) return

		fetch(`${env.VITE_API_URL}/user/auth`, {
			headers: { Authorization: `Bearer ${stored}` },
		})
			.then((res) => {
				if (!res.ok) throw new Error("Invalid token")
				return res.json() as Promise<{ token: string }>
			})
			.then(({ token: refreshed }) => {
				login(refreshed)
			})
			.catch(() => {
				logout()
			})
	}, [login, logout])

	const value = useMemo(
		() => ({
			user,
			token,
			isAuthenticated: !!user,
			isAdmin: user?.role === "ADMIN",
			login,
			logout,
		}),
		[user, token, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
