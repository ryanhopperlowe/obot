import { Fragment, useState } from "react";

import {
	ToolReference,
	UncategorizedToolCategory,
} from "~/lib/model/toolReferences";

import { ToolItem } from "~/components/tools/ToolItem";
import { CommandGroup } from "~/components/ui/command";

export function ToolCatalogGroup({
	category,
	configuredTools,
	tools,
	selectedTools,
	onAddTool,
	onRemoveTool,
}: {
	category: string;
	configuredTools: Set<string>;
	tools: ToolReference[];
	selectedTools: string[];
	onAddTool: (
		toolIds: string[],
		toolsToRemove: string[],
		oauthToAdd?: string
	) => void;
	onRemoveTool: (toolIds: string[], toolOauth?: string) => void;
	oauths: string[];
}) {
	const handleSelect = (
		toolId: string,
		bundleTool: ToolReference,
		toolOauth?: string
	) => {
		if (selectedTools.includes(toolId)) {
			onRemoveTool([toolId, bundleTool.id], toolOauth);
		} else {
			const toolsToAdd = [toolId];

			const hasAllTools = bundleTool.tools?.every((t) =>
				selectedTools.concat([toolId]).includes(t.id)
			);

			if (hasAllTools) {
				toolsToAdd.push(bundleTool.id);
			}

			onAddTool(toolsToAdd, [], toolOauth);
		}
	};

	const handleSelectAll = (bundleTool: ToolReference, toolOauth?: string) => {
		const tools = [bundleTool, ...(bundleTool.tools ?? [])].map(({ id }) => id);

		const add = !selectedTools.some((t) => tools.includes(t));
		if (add) {
			onAddTool(tools, tools, toolOauth);
		} else {
			onRemoveTool(tools, toolOauth);
		}
	};

	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	return (
		<CommandGroup
			key={category}
			heading={category !== UncategorizedToolCategory ? category : undefined}
		>
			{tools.map((tool) => {
				const allTools = [tool, ...(tool.tools ?? [])].map(({ id }) => id);
				const configured = configuredTools.has(tool.id);

				return (
					<Fragment key={tool.id}>
						<ToolItem
							key={tool.id}
							tool={tool}
							configured={configured}
							isSelected={selectedTools.some((t) => allTools.includes(t))}
							onSelect={(toolOauthToAdd) =>
								handleSelectAll(tool, toolOauthToAdd)
							}
							expanded={expanded[tool.id]}
							canExpand={!!tool.tools?.length && tool.tools?.length > 0}
							onExpand={(expanded) => {
								setExpanded((prev) => ({ ...prev, [tool.id]: expanded }));
							}}
							isGroup
						/>

						{expanded[tool.id] &&
							tool.tools?.map((categoryTool) => (
								<ToolItem
									key={categoryTool.id}
									configured={configured}
									tool={categoryTool}
									isSelected={selectedTools.includes(categoryTool.id)}
									onSelect={(toolOauthToAdd) =>
										handleSelect(categoryTool.id, tool, toolOauthToAdd)
									}
								/>
							))}
					</Fragment>
				);
			})}
		</CommandGroup>
	);
}
