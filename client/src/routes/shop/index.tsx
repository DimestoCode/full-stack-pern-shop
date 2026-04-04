import {
	keepPreviousData,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BrandTypeFilters } from "#/components/BrandTypeFilters";
import { PaginationBar } from "#/components/PaginationBar";
import { ProductGrid } from "#/components/ProductGrid";
import { brandsQueryOptions } from "#/lib/api/brands";
import { devicesQueryOptions } from "#/lib/api/devices";
import { typesQueryOptions } from "#/lib/api/deviceTypes";
import { cn } from "#/lib/utils";

const LIMIT = 9;

const searchSchema = z.object({
	typeId: z.number().optional(),
	brandId: z.number().optional(),
	page: z.number().optional().default(1),
});

export const Route = createFileRoute("/shop/")({
	validateSearch: searchSchema,
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(brandsQueryOptions());
		context.queryClient.ensureQueryData(typesQueryOptions());
		context.queryClient.ensureQueryData(
			devicesQueryOptions({ limit: LIMIT, page: 1 }),
		);
	},
	component: ShopPage,
});

function ShopPage() {
	const { typeId, brandId, page = 1 } = Route.useSearch();
	const navigate = Route.useNavigate();

	const { data: brands } = useSuspenseQuery(brandsQueryOptions());
	const { data: types } = useSuspenseQuery(typesQueryOptions());
	const devicesQuery = useQuery({
		...devicesQueryOptions({ typeId, brandId, limit: LIMIT, page }),
		placeholderData: keepPreviousData,
	});

	const devices = devicesQuery.data;
	const devicesLoading = !devices && devicesQuery.isPending;
	const staleDevices =
		devicesQuery.isPlaceholderData && devicesQuery.isFetching;
	const totalPages = devices ? Math.ceil(devices.count / LIMIT) : 0;

	function setFilter(updates: { typeId?: number; brandId?: number }) {
		navigate({ search: (prev) => ({ ...prev, ...updates, page: 1 }) });
	}

	function setPage(newPage: number) {
		navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold">Shop</h1>
			<div className="flex flex-col gap-8 lg:flex-row">
				<BrandTypeFilters
					types={types}
					brands={brands}
					selectedTypeId={typeId}
					selectedBrandId={brandId}
					onTypeChange={(id) => setFilter({ typeId: id })}
					onBrandChange={(id) => setFilter({ brandId: id })}
				/>
				<div className="flex flex-1 flex-col gap-6">
					<div
						className={cn(
							"transition-opacity duration-150",
							staleDevices && "opacity-60",
						)}
					>
						<ProductGrid
							devices={devices?.rows ?? []}
							isLoading={devicesLoading}
						/>
					</div>
					{devices ? (
						<PaginationBar
							page={page}
							totalPages={totalPages}
							onPageChange={setPage}
							disabled={staleDevices}
						/>
					) : null}
				</div>
			</div>
		</main>
	);
}
