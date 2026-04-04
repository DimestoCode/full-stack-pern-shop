import { Skeleton } from "#/components/ui/skeleton"
import { ProductCard } from "#/components/ProductCard"
import type { Device } from "#/lib/api/types"

interface ProductGridProps {
	devices: Device[]
	isLoading?: boolean
}

export function ProductGrid({ devices, isLoading = false }: ProductGridProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 9 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
					<div key={i} className="flex flex-col gap-2">
						<Skeleton className="aspect-square w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				))}
			</div>
		)
	}

	if (devices.length === 0) {
		return (
			<div className="text-muted-foreground flex flex-col items-center justify-center py-24 text-center">
				<p className="text-lg font-medium">No devices found</p>
				<p className="text-sm">Try clearing your filters</p>
			</div>
		)
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{devices.map((device) => (
				<ProductCard key={device.id} device={device} />
			))}
		</div>
	)
}
