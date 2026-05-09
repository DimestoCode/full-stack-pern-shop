import { Link } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"

export function NotFoundScreen() {
	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
			<div className="relative select-none">
				<span className="text-muted/30 text-[10rem] font-extrabold leading-none tracking-tighter">
					404
				</span>
				<p className="text-muted-foreground absolute inset-0 flex items-center justify-center text-lg font-medium">
					Page not found
				</p>
			</div>
			<p className="text-muted-foreground max-w-sm text-sm">
				The page you're looking for doesn't exist or has been moved.
			</p>
			<div className="flex gap-3">
				<Button variant="outline" onClick={() => window.history.back()}>
					Go back
				</Button>
				<Button asChild>
					<Link to="/shop">Browse Shop</Link>
				</Button>
			</div>
		</main>
	)
}
