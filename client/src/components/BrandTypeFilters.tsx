import { Check } from "lucide-react"
import { cn } from "#/lib/utils"
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
		<aside className="w-full shrink-0 lg:w-56">
			<div className="rounded-xl border bg-card p-4 shadow-sm">
				<FilterSection label="Categories">
					<FilterChip
						label="All"
						active={!selectedTypeId}
						onClick={() => onTypeChange(undefined)}
					/>
					{types.map((t) => (
						<FilterChip
							key={t.id}
							label={t.name}
							active={selectedTypeId === t.id}
							onClick={() =>
								onTypeChange(selectedTypeId === t.id ? undefined : t.id)
							}
						/>
					))}
				</FilterSection>

				<div className="my-4 h-px bg-border" />

				<FilterSection label="Brands">
					<FilterChip
						label="All"
						active={!selectedBrandId}
						onClick={() => onBrandChange(undefined)}
					/>
					{brands.map((b) => (
						<FilterChip
							key={b.id}
							label={b.name}
							active={selectedBrandId === b.id}
							onClick={() =>
								onBrandChange(selectedBrandId === b.id ? undefined : b.id)
							}
						/>
					))}
				</FilterSection>
			</div>
		</aside>
	)
}

function FilterSection({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			{children}
		</div>
	)
}

function FilterChip({
	label,
	active,
	onClick,
}: {
	label: string
	active: boolean
	onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all",
				active
					? "bg-primary text-primary-foreground shadow-sm"
					: "text-foreground/70 hover:bg-accent hover:text-foreground",
			)}
		>
			<span className={cn("font-medium", active && "font-semibold")}>
				{label}
			</span>
			{active && <Check className="h-3.5 w-3.5 shrink-0 opacity-90" />}
		</button>
	)
}
