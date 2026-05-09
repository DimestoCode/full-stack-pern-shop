import { queryOptions } from "@tanstack/react-query";
import { apiFetch } from "./client";

export interface DeviceReview {
	id: number;
	rate: number;
	review: string;
	userId: number;
	deviceId: number;
	createdAt?: string;
	user?: {
		id: number;
		email: string;
	};
}

export interface DeviceReviewsResponse {
	averageRating: number | null;
	deviceReviews: DeviceReview[];
}

export const deviceReviewsQueryOptions = (deviceId: number) =>
	queryOptions({
		queryKey: ["reviews", deviceId],
		queryFn: () => apiFetch<DeviceReviewsResponse>(`/review/${deviceId}`),
	});

export async function createReviewFn(
	deviceId: number,
	body: { rate: number; review: string },
): Promise<DeviceReview> {
	return apiFetch<DeviceReview>(`/review/${deviceId}`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}
