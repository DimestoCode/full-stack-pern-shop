import { Star } from "lucide-react"
import { cn } from "#/lib/utils"

interface StarRatingProps {
	value: number
	onChange?: (rate: number) => void
	readonly?: boolean
	size?: number
}

export function StarRating({
	value,
	onChange,
	readonly = false,
	size = 20,
}: StarRatingProps) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					disabled={readonly || !onChange}
					onClick={() => onChange?.(star)}
					className={cn(
						"transition-colors",
						!readonly && onChange && "cursor-pointer hover:scale-110",
						readonly && "cursor-default",
					)}
					aria-label={`Rate ${star} out of 5`}
				>
					<Star
						width={size}
						height={size}
						className={cn(
							star <= Math.round(value)
								? "fill-yellow-400 text-yellow-400"
								: "fill-muted text-muted-foreground",
						)}
					/>
				</button>
			))}
		</div>
	)
}
