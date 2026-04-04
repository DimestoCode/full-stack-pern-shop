import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { z } from "zod"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { useAuth } from "#/hooks/useAuth"
import { loginFn } from "#/lib/api/user"
import { TOKEN_KEY } from "#/lib/auth"

const searchSchema = z.object({
	redirect: z.string().optional(),
})

export const Route = createFileRoute("/login")({
	validateSearch: searchSchema,
	beforeLoad: () => {
		if (localStorage.getItem(TOKEN_KEY)) {
			throw redirect({ to: "/shop" })
		}
	},
	component: LoginPage,
})

function LoginPage() {
	const { login } = useAuth()
	const navigate = useNavigate()
	const { redirect: redirectTo } = Route.useSearch()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")

	const { mutate, isPending, error } = useMutation({
		mutationFn: () => loginFn(email, password),
		onSuccess: ({ token }) => {
			login(token)
			navigate({ to: redirectTo ?? "/shop" })
		},
	})

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		mutate()
	}

	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-xl">Sign in</CardTitle>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="flex flex-col gap-4">
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
						/>
						<Input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>
						{error && (
							<p className="text-destructive text-sm">{error.message}</p>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button className="w-full" type="submit" disabled={isPending}>
							{isPending ? "Signing in…" : "Sign in"}
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							No account?{" "}
							<Link to="/register" className="text-foreground underline">
								Register
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</main>
	)
}
