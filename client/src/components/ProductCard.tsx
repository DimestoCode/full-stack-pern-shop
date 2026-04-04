import { Link, useNavigate } from "@tanstack/react-router"
import { ShoppingCart } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardFooter } from "#/components/ui/card"
import { StarRating } from "#/components/StarRating"
import { useAuth } from "#/hooks/useAuth"
import { addToCartFn } from "#/lib/api/cart"
import { env } from "#/env"
import type { Device } from "#/lib/api/types"

interface ProductCardProps {
	device: Device
}

export function ProductCard({ device }: ProductCardProps) {
	const { isAuthenticated, user } = useAuth()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const addToCart = useMutation({
		mutationFn: () => addToCartFn(user!.id, device.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart", user!.id] })
			toast.success("Added to cart")
		},
		onError: () => toast.error("Failed to add to cart"),
	})

	function handleAddToCart(e: React.MouseEvent) {
		e.preventDefault()
		if (!isAuthenticated) {
			navigate({ to: "/login" })
			return
		}
		addToCart.mutate()
	}

	const imgUrl = `${env.VITE_STATIC_URL}/${device.img}`

	return (
		<Card className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
			<Link to="/shop/$deviceId" params={{ deviceId: String(device.id) }}>
				<div className="bg-muted aspect-square overflow-hidden">
					<img
						src={imgUrl}
						alt={device.name}
						className="h-full w-full object-contain p-4 transition-transform group-hover:scale-105"
					/>
				</div>
				<CardContent className="flex flex-col gap-1 p-4">
					<p className="text-muted-foreground line-clamp-1 text-sm">
						{device.name}
					</p>
					<p className="text-lg font-semibold">
						${Number(device.price).toFixed(2)}
					</p>
					<StarRating value={device.rating} readonly size={16} />
				</CardContent>
			</Link>
			<CardFooter className="mt-auto p-4 pt-0">
				<Button
					className="w-full"
					size="sm"
					onClick={handleAddToCart}
					disabled={addToCart.isPending}
				>
					<ShoppingCart className="mr-2 h-4 w-4" />
					Add to Cart
				</Button>
			</CardFooter>
		</Card>
	)
}
