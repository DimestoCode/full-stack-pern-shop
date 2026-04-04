import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ChevronRight, ShoppingCart } from "lucide-react"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Separator } from "#/components/ui/separator"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table"
import { StarRating } from "#/components/StarRating"
import { useAuth } from "#/hooks/useAuth"
import { deviceQueryOptions } from "#/lib/api/devices"
import { ratingQueryOptions, createRatingFn } from "#/lib/api/rating"
import { addToCartFn } from "#/lib/api/cart"
import { env } from "#/env"

export const Route = createFileRoute("/shop/$deviceId")({
	loader: ({ context, params }) => {
		context.queryClient.ensureQueryData(deviceQueryOptions(Number(params.deviceId)))
	},
	component: DevicePage,
})

function DevicePage() {
	const { deviceId } = Route.useParams()
	const { isAuthenticated, user } = useAuth()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const { data: device } = useSuspenseQuery(deviceQueryOptions(Number(deviceId)))

	const { data: ratingData } = useQuery({
		...ratingQueryOptions(Number(deviceId), isAuthenticated),
	})

	const addToCart = useMutation({
		mutationFn: () => addToCartFn(user!.id, device.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart", user!.id] })
			toast.success("Added to cart")
		},
		onError: () => toast.error("Failed to add to cart"),
	})

	const submitRating = useMutation({
		mutationFn: (rate: number) => createRatingFn(device.id, rate),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rating", device.id] })
			queryClient.invalidateQueries({ queryKey: ["device", device.id] })
			toast.success("Rating saved")
		},
		onError: () => toast.error("Failed to save rating"),
	})

	function handleAddToCart() {
		if (!isAuthenticated) {
			navigate({ to: "/login" })
			return
		}
		addToCart.mutate()
	}

	const averageRating = ratingData?.average ?? device.rating

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8">
			{/* Breadcrumb */}
			<nav className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
				<Link to="/shop" className="hover:text-foreground transition-colors">
					Shop
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground">{device.name}</span>
			</nav>

			{/* Product layout */}
			<div className="grid gap-8 lg:grid-cols-2">
				{/* Image */}
				<div className="bg-muted flex items-center justify-center rounded-xl p-8">
					<img
						src={`${env.VITE_STATIC_URL}/${device.img}`}
						alt={device.name}
						className="max-h-80 w-full object-contain"
					/>
				</div>

				{/* Details */}
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-2">
						{device.typeId && <Badge variant="secondary">Type #{device.typeId}</Badge>}
						{device.brandId && <Badge variant="outline">Brand #{device.brandId}</Badge>}
					</div>

					<h1 className="text-2xl font-bold">{device.name}</h1>

					<p className="text-3xl font-semibold">
						${Number(device.price).toFixed(2)}
					</p>

					<div className="flex flex-col gap-1">
						<StarRating
							value={averageRating}
							onChange={isAuthenticated ? (rate) => submitRating.mutate(rate) : undefined}
							readonly={!isAuthenticated}
						/>
						{isAuthenticated ? (
							<p className="text-muted-foreground text-xs">Click to rate</p>
						) : (
							<p className="text-muted-foreground text-xs">
								<Link to="/login" className="underline">
									Log in
								</Link>{" "}
								to rate this product
							</p>
						)}
					</div>

					<Button
						size="lg"
						className="mt-2 w-full sm:w-auto"
						onClick={handleAddToCart}
						disabled={addToCart.isPending}
					>
						<ShoppingCart className="mr-2 h-5 w-5" />
						Add to Cart
					</Button>
				</div>
			</div>

			{/* Specifications */}
			{device.info && device.info.length > 0 && (
				<>
					<Separator className="my-8" />
					<section>
						<h2 className="mb-4 text-xl font-semibold">Specifications</h2>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-1/3">Feature</TableHead>
									<TableHead>Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{device.info.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-medium">{item.title}</TableCell>
										<TableCell>{item.description}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</section>
				</>
			)}
		</main>
	)
}
