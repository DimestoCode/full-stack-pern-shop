import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StarRating } from "#/components/StarRating";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Label } from "#/components/ui/label";
import { Separator } from "#/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { useAuth } from "#/hooks/useAuth";
import { addToCartFn } from "#/lib/api/cart";
import { deviceQueryOptions } from "#/lib/api/devices";
import {
	createReviewFn,
	type DeviceReview,
	deviceReviewsQueryOptions,
} from "#/lib/api/review";
import { deviceImageSrc } from "#/lib/deviceImage";

export const Route = createFileRoute("/shop/$deviceId")({
	loader: ({ context, params }) => {
		const id = Number(params.deviceId);
		context.queryClient.ensureQueryData(deviceQueryOptions(id));
		context.queryClient.ensureQueryData(deviceReviewsQueryOptions(id));
	},
	component: DevicePage,
});

function formatReviewDate(iso?: string) {
	if (!iso) return "";
	try {
		return new Date(iso).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	} catch {
		return "";
	}
}

function reviewAuthor(r: DeviceReview) {
	if (r.user?.email) {
		const [local] = r.user.email.split("@");
		return local || "Customer";
	}
	return `User #${r.userId}`;
}

function DevicePage() {
	const { deviceId } = Route.useParams();
	const { isAuthenticated, user } = useAuth();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const id = Number(deviceId);

	const { data: device } = useSuspenseQuery(deviceQueryOptions(id));

	const { data: reviewsData } = useQuery({
		...deviceReviewsQueryOptions(id),
	});

	const [draftRate, setDraftRate] = useState(5);
	const [draftText, setDraftText] = useState("");

	const addToCart = useMutation({
		mutationFn: async () => {
			if (!user?.id) {
				throw new Error("Not signed in");
			}
			return addToCartFn(user.id, device.id);
		},
		onSuccess: () => {
			if (user?.id) {
				queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
			}
			toast.success("Added to cart");
		},
		onError: () => toast.error("Failed to add to cart"),
	});

	const submitReview = useMutation({
		mutationFn: () =>
			createReviewFn(device.id, { rate: draftRate, review: draftText.trim() }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reviews", device.id] });
			setDraftText("");
			toast.success("Review submitted");
		},
		onError: () => toast.error("Failed to submit review"),
	});

	function handleAddToCart() {
		if (!isAuthenticated) {
			navigate({ to: "/login" });
			return;
		}
		addToCart.mutate();
	}

	function handleSubmitReview(e: React.FormEvent) {
		e.preventDefault();
		if (!isAuthenticated) {
			navigate({ to: "/login" });
			return;
		}
		if (!draftText.trim()) {
			toast.error("Please write a short review");
			return;
		}
		submitReview.mutate();
	}

	const averageRating =
		reviewsData?.averageRating != null &&
		Number.isFinite(reviewsData.averageRating)
			? reviewsData.averageRating
			: device.rating;

	const reviews = reviewsData?.deviceReviews ?? [];
	const hasSpecs = Boolean(device.info && device.info.length > 0);

	return (
		<main className="mx-auto w-full max-w-7xl px-4 py-8">
			<nav className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
				<Link to="/shop" className="hover:text-foreground transition-colors">
					Shop
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground">{device.name}</span>
			</nav>

			<div className="grid gap-8 lg:grid-cols-2">
				<div className="aspect-[4/3] overflow-hidden rounded-xl">
					<img
						src={deviceImageSrc(device.img)}
						alt={device.name}
						className="h-full w-full object-cover"
					/>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-2">
						{device.typeId ? (
							<Badge variant="secondary">Type #{device.typeId}</Badge>
						) : null}
						{device.brandId ? (
							<Badge variant="outline">Brand #{device.brandId}</Badge>
						) : null}
					</div>

					<h1 className="text-2xl font-bold">{device.name}</h1>

					<p className="text-3xl font-semibold">
						${Number(device.price).toFixed(2)}
					</p>

					<div className="flex flex-col gap-1">
						<StarRating value={averageRating} readonly />
						<p className="text-muted-foreground text-xs">
							Average from customer reviews
							{reviews.length === 0
								? " (no reviews yet — shown value is the catalog rating)"
								: ""}
						</p>
					</div>

					<Button
						size="lg"
						className="mt-2 w-full sm:w-auto"
						onClick={handleAddToCart}
						disabled={addToCart.isPending}
					>
						<ShoppingCart className="mr-2 h-5 w-5" />
						Add to Cart
					</Button>
				</div>
			</div>

			<Separator className="my-8" />

			<Tabs defaultValue="specifications" className="gap-6">
				<TabsList variant="line" className="w-full max-w-md">
					<TabsTrigger value="specifications" className="flex-1">
						Specifications
					</TabsTrigger>
					<TabsTrigger value="reviews" className="flex-1">
						Reviews
					</TabsTrigger>
				</TabsList>

				<TabsContent value="specifications" className="mt-4">
					{hasSpecs && device.info ? (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-1/3">Feature</TableHead>
									<TableHead>Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{device.info.map((item) => (
									<TableRow key={item.id}>
										<TableCell className="font-medium">{item.title}</TableCell>
										<TableCell>{item.description}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					) : (
						<p className="text-muted-foreground text-sm">
							No specifications are listed for this product.
						</p>
					)}
				</TabsContent>

				<TabsContent value="reviews" className="mt-4 flex flex-col gap-8">
					<div className="flex flex-col gap-3">
						<h3 className="text-lg font-semibold">Customer reviews</h3>
						{reviews.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No reviews yet. Be the first to share your experience.
							</p>
						) : (
							<ul className="flex flex-col gap-3">
								{reviews.map((r) => (
									<li key={r.id}>
										<Card>
											<CardHeader className="pb-2">
												<div className="flex flex-wrap items-center justify-between gap-2">
													<CardTitle className="text-base">
														{reviewAuthor(r)}
													</CardTitle>
													{formatReviewDate(r.createdAt) ? (
														<CardDescription>
															{formatReviewDate(r.createdAt)}
														</CardDescription>
													) : null}
												</div>
												<StarRating value={r.rate} readonly size={16} />
											</CardHeader>
											<CardContent className="pt-0">
												<p className="text-sm leading-relaxed">{r.review}</p>
											</CardContent>
										</Card>
									</li>
								))}
							</ul>
						)}
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Write a review</CardTitle>
							<CardDescription>
								{isAuthenticated
									? "Share a rating and a few words about this product."
									: "Log in to submit a review."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isAuthenticated ? (
								<form
									onSubmit={handleSubmitReview}
									className="flex flex-col gap-4"
								>
									<div className="flex flex-col gap-2">
										<Label>Your rating</Label>
										<StarRating value={draftRate} onChange={setDraftRate} />
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="device-review-text">Your review</Label>
										<Textarea
											id="device-review-text"
											placeholder="What did you like or dislike?"
											rows={4}
											value={draftText}
											onChange={(e) => setDraftText(e.target.value)}
											disabled={submitReview.isPending}
										/>
									</div>
									<Button
										type="submit"
										disabled={submitReview.isPending || !draftText.trim()}
									>
										{submitReview.isPending ? "Submitting…" : "Submit review"}
									</Button>
								</form>
							) : (
								<Button asChild variant="secondary">
									<Link to="/login">Log in to review</Link>
								</Button>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</main>
	);
}
