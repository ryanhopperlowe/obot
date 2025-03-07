import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { EllipsisIcon } from "lucide-react";
import { useMemo } from "react";
import { ClientLoaderFunction, MetaFunction } from "react-router";
import { $path } from "safe-routes";
import useSWR, { preload } from "swr";

import { Project } from "~/lib/model/project";
import { UserRoutes } from "~/lib/routers/userRoutes";
import { AgentService } from "~/lib/service/api/agentService";
import { ProjectApiService } from "~/lib/service/api/projectApiService";
import { ThreadsService } from "~/lib/service/api/threadsService";

import { ConfirmationDialog } from "~/components/composed/ConfirmationDialog";
import { DataTable } from "~/components/composed/DataTable";
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

export const clientLoader: ClientLoaderFunction = async () => {
	await Promise.all([
		preload(...ProjectApiService.getAll.swr({})),
		preload(...AgentService.getAgents.swr({})),
		preload(...ThreadsService.getThreads.swr({})),
	]);
};

export default function ProjectsPage() {
	const { data: projects, mutate: refresh } = useSWR(
		...ProjectApiService.getAll.swr({}),
		{ suspense: true }
	);
	const projectMap = useMemo(
		() => new Map(projects.map((p) => [p.id, p])),
		[projects]
	);

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
				if (!thread.projectID) return acc;

				const count = acc.get(thread.projectID) ?? 0;
				acc.set(thread.projectID, count + 1);

				return acc;
			}, new Map()),
		[threads]
	);

	console.log(
		threads.filter((t) => !!t.projectID),
		threadCounts
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

					<DataTable columns={getColumns()} data={projects} />
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
						<small className="text-muted-foreground">{row.original.id}</small>
					</div>
				),
			}),
			columnHelper.accessor("parentID", {
				header: "Copied From",
				cell: ({ row }) => {
					if (!row.original.parentID) return "-";

					return <p>{projectMap.get(row.original.parentID)?.name}</p>;
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
			columnHelper.accessor((row) => String(threadCounts.get(row.id) ?? 0), {
				header: "Threads",
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
