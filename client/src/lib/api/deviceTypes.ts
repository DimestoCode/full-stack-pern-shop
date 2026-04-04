import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "./client"
import type { Type } from "./types"

export const typesQueryOptions = () =>
	queryOptions({
		queryKey: ["types"],
		queryFn: () => apiFetch<Type[]>("/type"),
	})

export async function createTypeFn(name: string): Promise<Type> {
	return apiFetch<Type>("/type", {
		method: "POST",
		body: JSON.stringify({ name }),
	})
}
