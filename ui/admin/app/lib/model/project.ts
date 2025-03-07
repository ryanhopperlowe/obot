import { EntityMeta } from "~/lib/model/primitives";
import { ThreadManifest } from "~/lib/model/threads";

type ProjectManifest = ThreadManifest & {
	parentID: string;
	assistantID: string;
	editor: boolean;
};

export type Project = EntityMeta & ProjectManifest;
