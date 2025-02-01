import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "~/components/ui/button";

export type PaginationActionsProps = {
	page: number;
	nextPage?: number;
	previousPage?: number;
	totalPages: number;
	onPageChange: (page: number) => void;
};

export function PaginationActions({
	page,
	nextPage,
	previousPage,
	totalPages,
	onPageChange,
}: PaginationActionsProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex flex-nowrap items-center justify-center gap-2">
			<Button
				variant="ghost"
				size="icon-sm"
				disabled={isNaN(previousPage as number)}
				onClick={() => previousPage != null && onPageChange(previousPage)}
			>
				<ChevronLeft />
			</Button>

			<p className="min-w-fit">
				{page + 1} / {totalPages}
			</p>

			<Button
				variant="ghost"
				size="icon-sm"
				disabled={!nextPage}
				onClick={() => nextPage != null && onPageChange(nextPage)}
			>
				<ChevronRight />
			</Button>
		</div>
	);
}
