import { useRouter } from "@tanstack/react-router"
import { AlertTriangle } from "lucide-react"
import { Button } from "#/components/ui/button"

interface ErrorScreenProps {
	error: Error
	reset?: () => void
}

export function ErrorScreen({ error, reset }: ErrorScreenProps) {
	const router = useRouter()

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
			<AlertTriangle className="text-destructive h-16 w-16" />
			<h1 className="text-2xl font-bold">Something went wrong</h1>
			<p className="text-muted-foreground max-w-md text-sm">
				{error.message || "An unexpected error occurred."}
			</p>
			<div className="flex gap-3">
				{reset && (
					<Button variant="outline" onClick={reset}>
						Try again
					</Button>
				)}
				<Button onClick={() => router.navigate({ to: "/" })}>Go home</Button>
			</div>
		</main>
	)
}
