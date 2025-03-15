import popover from './popover.svelte.js';
import type { Placement } from '@floating-ui/dom';
import { twMerge } from 'tailwind-merge';

function hasOverflow(element: HTMLElement) {
	return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
}

export function overflowToolTip(
	node: HTMLElement,
	{
		placement = 'top',
		tooltipClass,
		offset = 4
	}: { placement?: Placement; tooltipClass?: string; offset?: number } = {}
) {
	const { ref, tooltip } = popover({ placement, offset, hover: true });

	node.classList.add('line-clamp-1', 'break-all');

	const p = document.createElement('p');
	p.classList.add(
		...twMerge('tooltip', 'break-all', ...(tooltipClass?.split(' ') ?? [])).split(' ')
	);
	p.textContent = node.textContent;

	node.insertAdjacentElement('afterend', p);
	node.addEventListener('mouseenter', (e) => {
		if (!hasOverflow(node)) {
			e.stopImmediatePropagation();
		}
	});

	// Register after the above event listener to ensure we can stop propagation
	tooltip(p);
	ref(node);
}
