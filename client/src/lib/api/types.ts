// Shared domain types for API responses

export interface DeviceInfo {
	id: number
	title: string
	description: string
	deviceId: number
}

export interface Device {
	id: number
	name: string
	price: number
	rating: number
	img: string
	typeId: number
	brandId: number
	info?: DeviceInfo[]
}

export interface DeviceListResponse {
	count: number
	rows: Device[]
}

export interface Type {
	id: number
	name: string
}

export interface Brand {
	id: number
	name: string
}

export interface CartDevice {
	id: number
	cartId: number
	deviceId: number
}

export interface Rating {
	id: number
	rate: number
	userId: number
	deviceId: number
}
