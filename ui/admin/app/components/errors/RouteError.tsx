import { ErrorResponse, useNavigate } from "react-router";

import { ObotLogo } from "~/components/branding/ObotLogo";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export function RouteError({ error }: { error: ErrorResponse }) {
	const navigate = useNavigate();

	return (
		<div className="flex min-h-screen w-full items-center justify-center p-4">
			<Card className="w-96">
				<CardHeader className="mx-4">
					<ObotLogo />
				</CardHeader>
				<CardContent className="mb-4 space-y-2 border-b text-center">
					<CardTitle>Oops! {error.status}</CardTitle>
					<CardDescription>{error.statusText}</CardDescription>
					<p className="text-sm text-muted-foreground">{error.data}</p>
				</CardContent>
				<CardFooter>
					<Button
						className="w-full"
						variant="secondary"
						onClick={() => navigate(0)}
					>
						Try Again
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
