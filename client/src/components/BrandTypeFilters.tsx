import { cn } from "#/lib/utils"
import { Button } from "#/components/ui/button"
import { Separator } from "#/components/ui/separator"
import type { Brand, Type } from "#/lib/api/types"

interface BrandTypeFiltersProps {
	types: Type[]
	brands: Brand[]
	selectedTypeId?: number
	selectedBrandId?: number
	onTypeChange: (id: number | undefined) => void
	onBrandChange: (id: number | undefined) => void
}

export function BrandTypeFilters({
	types,
	brands,
	selectedTypeId,
	selectedBrandId,
	onTypeChange,
	onBrandChange,
}: BrandTypeFiltersProps) {
	return (
		<aside className="w-full space-y-6 lg:w-52 lg:shrink-0">
			<div>
				<p className="mb-2 text-sm font-semibold uppercase tracking-wide">
					Categories
				</p>
				<div className="flex flex-wrap gap-1 lg:flex-col">
					<FilterPill
						label="All"
						active={!selectedTypeId}
						onClick={() => onTypeChange(undefined)}
					/>
					{types.map((t) => (
						<FilterPill
							key={t.id}
							label={t.name}
							active={selectedTypeId === t.id}
							onClick={() =>
								onTypeChange(selectedTypeId === t.id ? undefined : t.id)
							}
						/>
					))}
				</div>
			</div>

			<Separator />

			<div>
				<p className="mb-2 text-sm font-semibold uppercase tracking-wide">
					Brands
				</p>
				<div className="flex flex-wrap gap-1 lg:flex-col">
					<FilterPill
						label="All"
						active={!selectedBrandId}
						onClick={() => onBrandChange(undefined)}
					/>
					{brands.map((b) => (
						<FilterPill
							key={b.id}
							label={b.name}
							active={selectedBrandId === b.id}
							onClick={() =>
								onBrandChange(selectedBrandId === b.id ? undefined : b.id)
							}
						/>
					))}
				</div>
			</div>
		</aside>
	)
}

function FilterPill({
	label,
	active,
	onClick,
}: {
	label: string
	active: boolean
	onClick: () => void
}) {
	return (
		<Button
			variant={active ? "default" : "outline"}
			size="sm"
			onClick={onClick}
			className={cn("justify-start", active && "font-semibold")}
		>
			{label}
		</Button>
	)
}
