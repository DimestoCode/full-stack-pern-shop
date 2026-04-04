import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { useAuth } from "#/hooks/useAuth"
import { registerFn } from "#/lib/api/user"
import { TOKEN_KEY } from "#/lib/auth"

export const Route = createFileRoute("/register")({
	beforeLoad: () => {
		if (localStorage.getItem(TOKEN_KEY)) {
			throw redirect({ to: "/shop" })
		}
	},
	component: RegisterPage,
})

function RegisterPage() {
	const { login } = useAuth()
	const navigate = useNavigate()

	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [confirm, setConfirm] = useState("")
	const [confirmError, setConfirmError] = useState("")

	const { mutate, isPending, error } = useMutation({
		mutationFn: () => registerFn(email, password),
		onSuccess: ({ token }) => {
			login(token)
			navigate({ to: "/shop" })
		},
	})

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (password !== confirm) {
			setConfirmError("Passwords do not match")
			return
		}
		setConfirmError("")
		mutate()
	}

	return (
		<main className="flex flex-1 items-center justify-center px-4 py-16">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-xl">Create an account</CardTitle>
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
							autoComplete="new-password"
						/>
						<div className="flex flex-col gap-1">
							<Input
								type="password"
								placeholder="Confirm password"
								value={confirm}
								onChange={(e) => setConfirm(e.target.value)}
								required
								autoComplete="new-password"
							/>
							{confirmError && (
								<p className="text-destructive text-sm">{confirmError}</p>
							)}
						</div>
						{error && (
							<p className="text-destructive text-sm">{error.message}</p>
						)}
					</CardContent>
					<CardFooter className="flex flex-col gap-3">
						<Button className="w-full" type="submit" disabled={isPending}>
							{isPending ? "Creating account…" : "Create account"}
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							Already have an account?{" "}
							<Link to="/login" className="text-foreground underline">
								Sign in
							</Link>
						</p>
					</CardFooter>
				</form>
			</Card>
		</main>
	)
}
