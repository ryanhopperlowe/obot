import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { EllipsisIcon } from "lucide-react";
import { useMemo } from "react";
import {
	ClientLoaderFunctionArgs,
	MetaFunction,
	useLoaderData,
} from "react-router";
import { $path } from "safe-routes";
import useSWR, { preload } from "swr";

import { Project } from "~/lib/model/project";
import { UserRoutes } from "~/lib/routers/userRoutes";
import { AgentService } from "~/lib/service/api/agentService";
import { ProjectApiService } from "~/lib/service/api/projectApiService";
import { ThreadsService } from "~/lib/service/api/threadsService";
import { RouteQueryParams, RouteService } from "~/lib/service/routeService";
import { pluralize } from "~/lib/utils";

import { ConfirmationDialog } from "~/components/composed/ConfirmationDialog";
import { DataTable } from "~/components/composed/DataTable";
import { Filters } from "~/components/composed/Filters";
import { Truncate } from "~/components/composed/typography";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Link } from "~/components/ui/link";
import { useConfirmationDialog } from "~/hooks/component-helpers/useConfirmationDialog";
import { useAsync } from "~/hooks/useAsync";

export type SearchParams = RouteQueryParams<"obotsSchema">;

export async function clientLoader({ request }: ClientLoaderFunctionArgs) {
	await Promise.all([
		preload(...ProjectApiService.getAll.swr({})),
		preload(...AgentService.getAgents.swr({})),
		preload(...ThreadsService.getThreads.swr({})),
	]);

	const query = RouteService.getQueryParams(
		"/obots",
		new URL(request.url).search
	);

	return { query };
}

export default function ProjectsPage() {
	const { query } = useLoaderData<typeof clientLoader>();
	const { obotId, parentObotId } = query ?? {};

	const { data: projects, mutate: refresh } = useSWR(
		...ProjectApiService.getAll.swr({}),
		{ suspense: true }
	);
	const projectMap = useMemo(
		() => new Map(projects.map((p) => [p.id, p])),
		[projects]
	);

	function getChildCount(projectId: string) {
		return projects.filter((p) => p.parentID === projectId).length;
	}

	const filteredProjects = useMemo(() => {
		if (!obotId && !parentObotId) return projects;

		let filtered = projects;
		if (obotId) {
			filtered = filtered.filter((p) => p.id === obotId);
		}
		if (parentObotId) {
			filtered = filtered.filter((p) => p.parentID === parentObotId);
		}

		return filtered;
	}, [projects, obotId, parentObotId]);

	const { data: agents } = useSWR(...AgentService.getAgents.swr({}), {
		suspense: true,
	});
	const agentMap = useMemo(
		() => new Map(agents?.map((a) => [a.id, a])),
		[agents]
	);

	const { data: threads } = useSWR(...ThreadsService.getThreads.swr({}), {
		suspense: true,
	});
	const threadCounts = useMemo(
		() =>
			threads.reduce<Map<string, number>>((acc, thread) => {
				// filter out threads that don't have a parent project, or that are projects themselves
				if (!thread.projectID || thread.project) return acc;

				const count = acc.get(thread.projectID) ?? 0;
				acc.set(thread.projectID, count + 1);

				return acc;
			}, new Map()),
		[threads]
	);

	const { interceptAsync, dialogProps } = useConfirmationDialog();

	const deleteProject = useAsync(ProjectApiService.delete, {
		onSuccess: () => refresh(),
	});

	const handleDelete = (id: string, agentId: string) => {
		interceptAsync(() => deleteProject.executeAsync({ id, agentId }));
	};

	return (
		<div>
			<div className="flex h-full flex-col gap-4 p-8">
				<div className="flex-auto overflow-hidden">
					<div className="width-full mb-8 flex justify-between space-x-2">
						<h2>Obots</h2>
					</div>

					<Filters projectMap={projectMap} url="/obots" />

					<DataTable columns={getColumns()} data={filteredProjects} />
				</div>
			</div>

			<ConfirmationDialog
				{...dialogProps}
				title="Delete Project?"
				description="Are you sure you want to delete this project? This action cannot be undone."
				confirmProps={{
					variant: "destructive",
					children: "Delete",
					loading: deleteProject.isLoading,
					disabled: deleteProject.isLoading,
				}}
			/>
		</div>
	);

	function getColumns(): ColumnDef<Project, string>[] {
		return [
			columnHelper.accessor("name", {
				header: "Name",
				cell: ({ row }) => (
					<div>
						<p>{row.original.name}</p>
						<Truncate asChild classNames={{ content: "text-muted-foreground" }}>
							<small className="break-all">{row.original.id}</small>
						</Truncate>
					</div>
				),
			}),
			columnHelper.accessor("parentID", {
				header: "Parent",
				cell: ({ row }) => {
					if (!row.original.parentID) return "-";

					return (
						<Link to={$path("/obots", { obotId: row.original.parentID })}>
							{projectMap.get(row.original.parentID)?.name}
						</Link>
					);
				},
			}),
			columnHelper.accessor("assistantID", {
				header: "Agent",
				cell: ({ getValue }) => (
					<Link to={$path("/agents/:id", { id: getValue() })}>
						{agentMap.get(getValue())?.name}
					</Link>
				),
			}),
			columnHelper.display({
				id: "info",
				cell: ({ row }) => {
					const childCount = getChildCount(row.original.id);
					const threadCount = threadCounts.get(row.original.id) ?? 0;

					return (
						<div className="flex flex-col">
							<p className="flex items-center gap-2">
								{childCount > 0 ? (
									<Link to={$path("/obots", { parentObotId: row.original.id })}>
										{childCount} {pluralize(childCount, "child", "children")}
									</Link>
								) : (
									<span className="text-muted-foreground">No children</span>
								)}
							</p>

							<p className="flex items-center gap-2">
								{threadCount > 0 ? (
									<Link
										to={$path("/chat-threads", {
											obotId: row.original.id,
											from: "obots",
										})}
									>
										{threadCount} {pluralize(threadCount, "thread", "threads")}
									</Link>
								) : (
									<span className="text-muted-foreground">No threads</span>
								)}
							</p>
						</div>
					);
				},
			}),
			columnHelper.display({
				id: "actions",
				cell: ({ row }) => (
					<DropdownMenu>
						<DropdownMenuTrigger asChild className="float-end">
							<Button variant="ghost" size="icon">
								<EllipsisIcon />
							</Button>
						</DropdownMenuTrigger>

						<DropdownMenuContent side="top" align="end">
							<DropdownMenuItem asChild>
								<a
									href={UserRoutes.obot(row.original.id).url}
									target="_blank"
									rel="noopener noreferrer"
								>
									Try it out!
								</a>
							</DropdownMenuItem>

							<DropdownMenuItem
								variant="destructive"
								onClick={() =>
									handleDelete(row.original.id, row.original.assistantID)
								}
							>
								Delete Project
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			}),
		];
	}
}

const columnHelper = createColumnHelper<Project>();

export const meta: MetaFunction = () => {
	return [{ title: "Obot • Obots" }];
};
