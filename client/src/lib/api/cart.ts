import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "./client"
import type { CartDevice } from "./types"

export const cartQueryOptions = (userId: number) =>
	queryOptions({
		queryKey: ["cart", userId],
		queryFn: () => apiFetch<CartDevice[]>(`/cart/${userId}`),
	})

export async function addToCartFn(userId: number, deviceId: number): Promise<CartDevice> {
	return apiFetch<CartDevice>(`/cart/${userId}/add`, {
		method: "PATCH",
		body: JSON.stringify({ deviceId }),
	})
}

export async function removeFromCartFn(userId: number, deviceId: number): Promise<void> {
	return apiFetch<void>(`/cart/${userId}/remove`, {
		method: "PATCH",
		body: JSON.stringify({ deviceId }),
	})
}

export async function clearCartFn(userId: number): Promise<void> {
	return apiFetch<void>(`/cart/${userId}`, { method: "DELETE" })
}
