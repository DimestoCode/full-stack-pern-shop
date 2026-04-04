import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "#/components/ui/button"
import { Separator } from "#/components/ui/separator"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "#/components/ui/alert-dialog"
import { CartItem } from "#/components/CartItem"
import { useAuth } from "#/hooks/useAuth"
import { cartQueryOptions, clearCartFn, removeFromCartFn } from "#/lib/api/cart"
import { deviceQueryOptions } from "#/lib/api/devices"
import { TOKEN_KEY } from "#/lib/auth"

export const Route = createFileRoute("/cart")({
	beforeLoad: () => {
		if (!localStorage.getItem(TOKEN_KEY)) {
			throw redirect({ to: "/login", search: { redirect: "/cart" } })
		}
	},
	component: CartPage,
})

function CartPage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const queryClient = useQueryClient()

	const { data: cartItems = [], isLoading } = useQuery(
		cartQueryOptions(user!.id),
	)

	// Prefetch all device details for subtotal calculation
	const deviceQueries = cartItems.map((item) =>
		queryClient.getQueryData(deviceQueryOptions(item.deviceId).queryKey),
	)

	const subtotal = deviceQueries.reduce((sum, device) => {
		if (!device) return sum
		return sum + Number((device as { price: number }).price)
	}, 0)

	const removeMutation = useMutation({
		mutationFn: (deviceId: number) => removeFromCartFn(user!.id, deviceId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart", user!.id] })
			toast.success("Item removed")
		},
		onError: () => toast.error("Failed to remove item"),
	})

	const clearMutation = useMutation({
		mutationFn: () => clearCartFn(user!.id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["cart", user!.id] })
			toast.success("Cart cleared")
		},
		onError: () => toast.error("Failed to clear cart"),
	})

	if (!isLoading && cartItems.length === 0) {
		return (
			<main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
				<ShoppingCart className="text-muted-foreground h-16 w-16" />
				<h1 className="text-2xl font-bold">Your cart is empty</h1>
				<p className="text-muted-foreground">
					Looks like you haven't added anything yet.
				</p>
				<Button asChild>
					<Link to="/shop">Continue Shopping</Link>
				</Button>
			</main>
		)
	}

	return (
		<main className="mx-auto w-full max-w-4xl px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold">Shopping Cart</h1>

			<div className="grid gap-8 lg:grid-cols-3">
				{/* Items list */}
				<div className="lg:col-span-2">
					{cartItems.map((item, index) => (
						<div key={item.id}>
							<CartItem
								deviceId={item.deviceId}
								onRemove={() => removeMutation.mutate(item.deviceId)}
								isRemoving={
									removeMutation.isPending &&
									removeMutation.variables === item.deviceId
								}
							/>
							{index < cartItems.length - 1 && <Separator />}
						</div>
					))}
				</div>

				{/* Order summary */}
				<div className="flex flex-col gap-4 rounded-lg border p-4 lg:self-start">
					<h2 className="font-semibold">Order Summary</h2>
					<div className="text-muted-foreground flex justify-between text-sm">
						<span>Items ({cartItems.length})</span>
						<span>${subtotal.toFixed(2)}</span>
					</div>
					<Separator />
					<div className="flex justify-between font-semibold">
						<span>Total</span>
						<span>${subtotal.toFixed(2)}</span>
					</div>
					<Button
						className="w-full"
						onClick={() => toast.info("Checkout coming soon!")}
					>
						Proceed to Checkout
					</Button>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button
								variant="outline"
								className="w-full"
								disabled={clearMutation.isPending}
							>
								Clear Cart
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Clear your cart?</AlertDialogTitle>
								<AlertDialogDescription>
									This will remove all items. This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => clearMutation.mutate()}
								>
									Clear
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</main>
	)
}
