import { createFileRoute, redirect } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Plus, Trash2, Layers, Tag, PlusCircle, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "#/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "#/components/ui/card"
import { Input } from "#/components/ui/input"
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
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/admin/")({
	beforeLoad: () => {
		const token = localStorage.getItem(TOKEN_KEY)
		if (!token) throw redirect({ to: "/login" })
		const payload = decodeToken(token)
		if (!payload || payload.role !== "ADMIN") throw redirect({ to: "/shop" })
	},
	component: AdminPage,
})

type Section = "types" | "brands" | "devices"

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
	{ id: "types", label: "Device Types", icon: Layers, description: "Manage product categories" },
	{ id: "brands", label: "Brands", icon: Tag, description: "Manage manufacturers" },
	{ id: "devices", label: "New Device", icon: PlusCircle, description: "Add a product listing" },
]

function AdminPage() {
	const [section, setSection] = useState<Section>("types")
	const active = NAV_ITEMS.find((i) => i.id === section)!

	return (
		<div className="flex min-h-[calc(100vh-4rem)]">
			{/* Sidebar */}
			<aside className="bg-card border-border flex w-64 shrink-0 flex-col border-r">
				<div className="border-border border-b px-5 py-5">
					<div className="flex items-center gap-2">
						<div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
							<ShieldCheck className="h-4 w-4" />
						</div>
						<div>
							<p className="text-sm font-semibold">Admin Panel</p>
							<p className="text-muted-foreground text-xs">Store management</p>
						</div>
					</div>
				</div>

				<nav className="flex flex-col gap-1 p-3">
					<p className="text-muted-foreground mb-1 px-2 text-xs font-medium tracking-wider uppercase">
						Catalog
					</p>
					{NAV_ITEMS.map(({ id, label, icon: Icon, description }) => (
						<button
							key={id}
							type="button"
							onClick={() => setSection(id)}
							className={cn(
								"group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
								section === id
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}
						>
							<Icon
								className={cn(
									"h-4 w-4 shrink-0",
									section === id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground",
								)}
							/>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">{label}</p>
								<p
									className={cn(
										"truncate text-xs",
										section === id ? "text-primary-foreground/70" : "text-muted-foreground/70",
									)}
								>
									{description}
								</p>
							</div>
						</button>
					))}
				</nav>
			</aside>

			{/* Main content */}
			<main className="flex min-w-0 flex-1 flex-col">
				{/* Header bar */}
				<header className="bg-card/50 border-border flex items-center border-b px-8 py-5 backdrop-blur">
					<div>
						<h1 className="text-xl font-semibold">{active.label}</h1>
						<p className="text-muted-foreground text-sm">{active.description}</p>
					</div>
				</header>

				{/* Content area */}
				<div className="flex-1 p-8">
					{section === "types" && <TypesPanel />}
					{section === "brands" && <BrandsPanel />}
					{section === "devices" && <DevicesPanel />}
				</div>
			</main>
		</div>
	)
}

// ── Types Panel ─────────────────────────────────────────────────────────────────

function TypesPanel() {
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
		<div className="mx-auto max-w-2xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Add New Type</CardTitle>
					<CardDescription>Create a new product category for the store</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="flex gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							if (name.trim()) mutate()
						}}
					>
						<Input
							placeholder="e.g. Smartphones, Laptops…"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<Button type="submit" disabled={isPending} className="shrink-0">
							<Plus className="mr-1 h-4 w-4" />
							Add Type
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Existing Types</CardTitle>
					<CardDescription>{types.length} type{types.length !== 1 ? "s" : ""} in the catalog</CardDescription>
				</CardHeader>
				<CardContent>
					{types.length === 0 ? (
						<p className="text-muted-foreground py-6 text-center text-sm">No types yet. Add one above.</p>
					) : (
						<ul className="divide-border divide-y">
							{types.map((t, i) => (
								<li key={t.id} className="flex items-center gap-3 py-3">
									<span className="text-muted-foreground bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
										{i + 1}
									</span>
									<span className="text-sm font-medium">{t.name}</span>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

// ── Brands Panel ────────────────────────────────────────────────────────────────

function BrandsPanel() {
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
		<div className="mx-auto max-w-2xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Add New Brand</CardTitle>
					<CardDescription>Register a new manufacturer or brand</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="flex gap-2"
						onSubmit={(e) => {
							e.preventDefault()
							if (name.trim()) mutate()
						}}
					>
						<Input
							placeholder="e.g. Apple, Samsung…"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<Button type="submit" disabled={isPending} className="shrink-0">
							<Plus className="mr-1 h-4 w-4" />
							Add Brand
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Existing Brands</CardTitle>
					<CardDescription>{brands.length} brand{brands.length !== 1 ? "s" : ""} registered</CardDescription>
				</CardHeader>
				<CardContent>
					{brands.length === 0 ? (
						<p className="text-muted-foreground py-6 text-center text-sm">No brands yet. Add one above.</p>
					) : (
						<ul className="divide-border divide-y">
							{brands.map((b, i) => (
								<li key={b.id} className="flex items-center gap-3 py-3">
									<span className="text-muted-foreground bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
										{i + 1}
									</span>
									<span className="text-sm font-medium">{b.name}</span>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

// ── Devices Panel ───────────────────────────────────────────────────────────────

interface SpecRow {
	title: string
	description: string
}

function DevicesPanel() {
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
		setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
	}

	function removeSpec(index: number) {
		setSpecs((prev) => prev.filter((_, i) => i !== index))
	}

	function handleSubmit(e: React.SyntheticEvent) {
		e.preventDefault()
		if (!img) {
			toast.error("Please select an image")
			return
		}
		mutate()
	}

	return (
		<div className="mx-auto max-w-2xl">
			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Basic Information</CardTitle>
						<CardDescription>Name, price, and categorization</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 sm:grid-cols-2">
						<Input
							placeholder="Device name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<Input
							type="number"
							placeholder="Price (USD)"
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Product Image</CardTitle>
						<CardDescription>Upload the main product photo</CardDescription>
					</CardHeader>
					<CardContent>
						<Input
							type="file"
							accept="image/*"
							onChange={(e) => setImg(e.target.files?.[0] ?? null)}
							required
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle className="text-base">Specifications</CardTitle>
							<CardDescription>Technical features and details</CardDescription>
						</div>
						<Button type="button" variant="outline" size="sm" onClick={addSpec}>
							<Plus className="mr-1 h-4 w-4" />
							Add row
						</Button>
					</CardHeader>
					<CardContent>
						{specs.length === 0 ? (
							<p className="text-muted-foreground py-4 text-center text-sm">
								No specs yet — click "Add row" to add one.
							</p>
						) : (
							<div className="flex flex-col gap-2">
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
						)}
					</CardContent>
				</Card>

				<div className="flex justify-end">
					<Button type="submit" disabled={isPending} size="lg">
						{isPending ? "Creating…" : "Create Device"}
					</Button>
				</div>
			</form>
		</div>
	)
}
