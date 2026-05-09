import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "./client"
import type { Device, DeviceListResponse } from "./types"

export interface DevicesParams {
	brandId?: number
	typeId?: number
	limit?: number
	page?: number
	search?: string
}

export const devicesQueryOptions = (params: DevicesParams = {}) => {
	const { brandId, typeId, limit = 9, page = 1, search } = params
	const qs = new URLSearchParams()
	if (brandId) qs.set("brandId", String(brandId))
	if (typeId) qs.set("typeId", String(typeId))
	if (search) qs.set("search", search)
	qs.set("limit", String(limit))
	qs.set("page", String(page))

	return queryOptions({
		queryKey: ["devices", { brandId, typeId, limit, page, search }],
		queryFn: () =>
			apiFetch<DeviceListResponse>(`/device?${qs.toString()}`),
	})
}

export const deviceQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["device", id],
		queryFn: () => apiFetch<Device>(`/device/${id}`),
	})

export interface CreateDeviceData {
	name: string
	price: number
	brandId: number
	typeId: number
	img: File
	info: Array<{ title: string; description: string }>
}

export async function createDeviceFn(data: CreateDeviceData): Promise<Device> {
	const formData = new FormData()
	formData.append("name", data.name)
	formData.append("price", String(data.price))
	formData.append("brandId", String(data.brandId))
	formData.append("typeId", String(data.typeId))
	formData.append("img", data.img)
	formData.append("info", JSON.stringify(data.info))

	return apiFetch<Device>("/device", { method: "POST", body: formData })
}
