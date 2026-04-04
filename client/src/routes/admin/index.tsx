import { createFileRoute, redirect } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { brandsQueryOptions, createBrandFn } from "#/lib/api/brands"
import { typesQueryOptions, createTypeFn } from "#/lib/api/deviceTypes"
import { createDeviceFn } from "#/lib/api/devices"
import { TOKEN_KEY, decodeToken } from "#/lib/auth"

export const Route = createFileRoute("/admin/")({
	beforeLoad: () => {
		const token = localStorage.getItem(TOKEN_KEY)
		if (!token) throw redirect({ to: "/login" })
		const payload = decodeToken(token)
		if (!payload || payload.role !== "ADMIN") throw redirect({ to: "/shop" })
	},
	component: AdminPage,
})

function AdminPage() {
	return (
		<main className="mx-auto w-full max-w-4xl px-4 py-8">
			<h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>
			<Tabs defaultValue="types">
				<TabsList className="mb-6">
					<TabsTrigger value="types">Types</TabsTrigger>
					<TabsTrigger value="brands">Brands</TabsTrigger>
					<TabsTrigger value="devices">New Device</TabsTrigger>
				</TabsList>
				<TabsContent value="types">
					<TypesTab />
				</TabsContent>
				<TabsContent value="brands">
					<BrandsTab />
				</TabsContent>
				<TabsContent value="devices">
					<DevicesTab />
				</TabsContent>
			</Tabs>
		</main>
	)
}

// ── Types Tab ──────────────────────────────────────────────────────────────────

function TypesTab() {
	const queryClient = useQueryClient()
	const { data: types = [] } = useQuery(typesQueryOptions())
	const [name, setName] = useState("")

	const { mutate, isPending } = useMutation({
		mutationFn: () => createTypeFn(name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["types"] })
			setName("")
			toast.success("Type created")
		},
		onError: () => toast.error("Failed to create type"),
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Device Types</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault()
						if (name.trim()) mutate()
					}}
				>
					<Input
						placeholder="New type name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Button type="submit" disabled={isPending}>
						<Plus className="mr-1 h-4 w-4" />
						Add
					</Button>
				</form>
				<ul className="flex flex-col gap-1">
					{types.map((t) => (
						<li key={t.id} className="text-muted-foreground rounded border px-3 py-2 text-sm">
							{t.name}
						</li>
					))}
					{types.length === 0 && (
						<li className="text-muted-foreground text-sm">No types yet.</li>
					)}
				</ul>
			</CardContent>
		</Card>
	)
}

// ── Brands Tab ─────────────────────────────────────────────────────────────────

function BrandsTab() {
	const queryClient = useQueryClient()
	const { data: brands = [] } = useQuery(brandsQueryOptions())
	const [name, setName] = useState("")

	const { mutate, isPending } = useMutation({
		mutationFn: () => createBrandFn(name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["brands"] })
			setName("")
			toast.success("Brand created")
		},
		onError: () => toast.error("Failed to create brand"),
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Brands</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<form
					className="flex gap-2"
					onSubmit={(e) => {
						e.preventDefault()
						if (name.trim()) mutate()
					}}
				>
					<Input
						placeholder="New brand name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Button type="submit" disabled={isPending}>
						<Plus className="mr-1 h-4 w-4" />
						Add
					</Button>
				</form>
				<ul className="flex flex-col gap-1">
					{brands.map((b) => (
						<li key={b.id} className="text-muted-foreground rounded border px-3 py-2 text-sm">
							{b.name}
						</li>
					))}
					{brands.length === 0 && (
						<li className="text-muted-foreground text-sm">No brands yet.</li>
					)}
				</ul>
			</CardContent>
		</Card>
	)
}

// ── Devices Tab ────────────────────────────────────────────────────────────────

interface SpecRow {
	title: string
	description: string
}

function DevicesTab() {
	const queryClient = useQueryClient()
	const { data: brands = [] } = useQuery(brandsQueryOptions())
	const { data: types = [] } = useQuery(typesQueryOptions())

	const [name, setName] = useState("")
	const [price, setPrice] = useState("")
	const [brandId, setBrandId] = useState("")
	const [typeId, setTypeId] = useState("")
	const [img, setImg] = useState<File | null>(null)
	const [specs, setSpecs] = useState<SpecRow[]>([])

	const { mutate, isPending } = useMutation({
		mutationFn: () =>
			createDeviceFn({
				name,
				price: Number(price),
				brandId: Number(brandId),
				typeId: Number(typeId),
				img: img!,
				info: specs.filter((s) => s.title.trim()),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["devices"] })
			setName("")
			setPrice("")
			setBrandId("")
			setTypeId("")
			setImg(null)
			setSpecs([])
			toast.success("Device created")
		},
		onError: () => toast.error("Failed to create device"),
	})

	function addSpec() {
		setSpecs((prev) => [...prev, { title: "", description: "" }])
	}

	function updateSpec(index: number, field: keyof SpecRow, value: string) {
		setSpecs((prev) =>
			prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
		)
	}

	function removeSpec(index: number) {
		setSpecs((prev) => prev.filter((_, i) => i !== index))
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!img) {
			toast.error("Please select an image")
			return
		}
		mutate()
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add New Device</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="grid gap-4 sm:grid-cols-2">
						<Input
							placeholder="Device name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<Input
							type="number"
							placeholder="Price"
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							min={0}
							step={0.01}
							required
						/>
						<Select value={brandId} onValueChange={setBrandId} required>
							<SelectTrigger>
								<SelectValue placeholder="Select brand" />
							</SelectTrigger>
							<SelectContent>
								{brands.map((b) => (
									<SelectItem key={b.id} value={String(b.id)}>
										{b.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={typeId} onValueChange={setTypeId} required>
							<SelectTrigger>
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{types.map((t) => (
									<SelectItem key={t.id} value={String(t.id)}>
										{t.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div>
						<label className="text-sm font-medium">Product image</label>
						<Input
							type="file"
							accept="image/*"
							className="mt-1"
							onChange={(e) => setImg(e.target.files?.[0] ?? null)}
							required
						/>
					</div>

					{/* Specs */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium">Specifications</p>
							<Button type="button" variant="outline" size="sm" onClick={addSpec}>
								<Plus className="mr-1 h-4 w-4" />
								Add spec
							</Button>
						</div>
						{specs.map((spec, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: dynamic list with no stable id
							<div key={i} className="flex gap-2">
								<Input
									placeholder="Feature"
									value={spec.title}
									onChange={(e) => updateSpec(i, "title", e.target.value)}
								/>
								<Input
									placeholder="Value"
									value={spec.description}
									onChange={(e) => updateSpec(i, "description", e.target.value)}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => removeSpec(i)}
								>
									<Trash2 className="text-destructive h-4 w-4" />
								</Button>
							</div>
						))}
					</div>

					<Button type="submit" disabled={isPending} className="self-start">
						{isPending ? "Creating…" : "Create Device"}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}
