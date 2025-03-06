<script lang="ts">
	import { popover } from '$lib/actions';
	import CollapsePane from '$lib/components/edit/CollapsePane.svelte';
	import { isCapabilityTool } from '$lib/model/tools';
	import { type AssistantTool } from '$lib/services';
	import { Plus, X } from 'lucide-svelte/icons';
	import { fade } from 'svelte/transition';

	interface Props {
		tools: AssistantTool[];
		onNewTools: (tools: AssistantTool[]) => Promise<void>;
	}

	let { tools, onNewTools }: Props = $props();
	let fixedList = $derived(tools.filter((t) => t.builtin && !isCapabilityTool(t.id)));
	let enabledList = $derived(tools.filter((t) => !t.builtin && t.enabled));
	let disabledList = $derived(tools.filter((t) => !t.builtin && !t.enabled));
	let { ref, tooltip, toggle } = popover();

	async function modify(tool: AssistantTool, remove: boolean) {
		let newTools = enabledList;
		if (remove) {
			newTools = newTools.filter((t) => t.id !== tool.id);
		} else {
			newTools = [
				...newTools,
				{
					...tool,
					enabled: true
				}
			];
		}
		await onNewTools(newTools);
		if (!remove) {
			toggle();
		}
	}
</script>

{#snippet toolList(tools: AssistantTool[], action: 'remove' | 'add' | 'fixed')}
	<ul class="flex flex-col gap-2">
		{#each tools as tool}
			{#key tool.id}
				<div class="flex items-center justify-between gap-1 rounded-3xl px-5 py-4">
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2">
							{#if tool.icon}
								<img
									src={tool.icon}
									class="h-6 rounded-md bg-white p-1"
									alt="tool {tool.name} icon"
								/>
							{/if}
							<span class="text-sm font-medium">{tool.name}</span>
						</div>
						<span class="text-xs">{tool.description}</span>
					</div>
					<button
						class="icon-button"
						class:invisible={action === 'fixed'}
						onclick={() => modify(tool, action === 'remove')}
						disabled={action === 'fixed'}
					>
						{#if action === 'remove'}
							<X class="size-5" />
						{:else}
							<Plus class="size-5" />
						{/if}
					</button>
				</div>
			{/key}
		{/each}
	</ul>
{/snippet}

<CollapsePane header="Tools">
	<div class="flex flex-col gap-2">
		<ul class="flex flex-col gap-2">
			{@render toolList(fixedList, 'fixed')}
			{@render toolList(enabledList, 'remove')}
		</ul>
		{#if disabledList.length > 0}
			<div class="self-end" in:fade>
				<button use:ref class="button flex items-center gap-1" onclick={() => toggle()}>
					<Plus class="h-4 w-4" />
					<span class="text-sm">Tool</span>
				</button>
			</div>
			<div use:tooltip class="z-20 max-h-[500px] overflow-y-auto rounded-3xl bg-surface2 p-3">
				{@render toolList(disabledList, 'add')}
			</div>
		{/if}
	</div>
</CollapsePane>
