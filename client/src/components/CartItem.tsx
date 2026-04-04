import { Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "#/components/ui/button"
import { Skeleton } from "#/components/ui/skeleton"
import { deviceQueryOptions } from "#/lib/api/devices"
import { env } from "#/env"

interface CartItemProps {
	deviceId: number
	onRemove: () => void
	isRemoving: boolean
}

export function CartItem({ deviceId, onRemove, isRemoving }: CartItemProps) {
	const { data: device, isLoading } = useQuery(deviceQueryOptions(deviceId))

	if (isLoading) {
		return (
			<div className="flex items-center gap-4 py-4">
				<Skeleton className="h-20 w-20 rounded-md" />
				<div className="flex flex-1 flex-col gap-2">
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-4 w-1/4" />
				</div>
			</div>
		)
	}

	if (!device) return null

	return (
		<div className="flex items-center gap-4 py-4">
			<img
				src={`${env.VITE_STATIC_URL}/${device.img}`}
				alt={device.name}
				className="bg-muted h-20 w-20 rounded-md object-contain p-1"
			/>
			<div className="flex flex-1 flex-col gap-1">
				<p className="font-medium">{device.name}</p>
				<p className="text-muted-foreground text-sm">
					${Number(device.price).toFixed(2)}
				</p>
			</div>
			<Button
				variant="ghost"
				size="icon"
				onClick={onRemove}
				disabled={isRemoving}
				aria-label="Remove item"
			>
				<Trash2 className="text-destructive h-4 w-4" />
			</Button>
		</div>
	)
}
