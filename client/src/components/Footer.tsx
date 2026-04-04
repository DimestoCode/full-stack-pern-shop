export default function Footer() {
	const year = new Date().getFullYear()

	return (
		<footer className="mt-auto border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
			<p className="m-0">&copy; {year} Online Store</p>
		</footer>
	)
}
