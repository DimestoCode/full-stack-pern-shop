import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "./client"
import type { Rating } from "./types"

export const ratingQueryOptions = (deviceId: number, enabled = true) =>
	queryOptions({
		queryKey: ["rating", deviceId],
		queryFn: () =>
			apiFetch<{ average: number }>(`/rating/${deviceId}`),
		enabled,
	})

export async function createRatingFn(
	deviceId: number,
	rate: number,
): Promise<Rating> {
	return apiFetch<Rating>("/rating", {
		method: "POST",
		body: JSON.stringify({ deviceId, rate }),
	})
}
