import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "#/components/ui/pagination"

interface PaginationBarProps {
	page: number
	totalPages: number
	onPageChange: (page: number) => void
}

export function PaginationBar({
	page,
	totalPages,
	onPageChange,
}: PaginationBarProps) {
	if (totalPages <= 1) return null

	const pages = buildPageList(page, totalPages)

	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						onClick={() => onPageChange(Math.max(1, page - 1))}
						aria-disabled={page === 1}
						className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
					/>
				</PaginationItem>

				{pages.map((p, i) =>
					p === "ellipsis" ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: static ellipsis list
						<PaginationItem key={`e-${i}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={p}>
							<PaginationLink
								isActive={p === page}
								onClick={() => onPageChange(p)}
								className="cursor-pointer"
							>
								{p}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					<PaginationNext
						onClick={() => onPageChange(Math.min(totalPages, page + 1))}
						aria-disabled={page === totalPages}
						className={
							page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	)
}

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

	const pages: (number | "ellipsis")[] = [1]

	if (current > 3) pages.push("ellipsis")

	const start = Math.max(2, current - 1)
	const end = Math.min(total - 1, current + 1)
	for (let i = start; i <= end; i++) pages.push(i)

	if (current < total - 2) pages.push("ellipsis")

	pages.push(total)
	return pages
}
