import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "./client"
import type { Brand } from "./types"

export const brandsQueryOptions = () =>
	queryOptions({
		queryKey: ["brands"],
		queryFn: () => apiFetch<Brand[]>("/brand"),
	})

export async function createBrandFn(name: string): Promise<Brand> {
	return apiFetch<Brand>("/brand", {
		method: "POST",
		body: JSON.stringify({ name }),
	})
}
