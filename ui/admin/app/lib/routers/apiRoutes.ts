import queryString from "query-string";
import { mutate } from "swr";

import { ToolReferenceType } from "~/lib/model/toolReferences";

export const apiBaseUrl = "http://localhost:8080/api" as const;
const prodBaseUrl = new URL(apiBaseUrl).pathname;

const buildUrl = (path: string, params?: object) => {
    const query = params
        ? queryString.stringify(params, { skipNull: true })
        : "";

    if (process.env.NODE_ENV === "production") {
        return {
            url: prodBaseUrl + path + (query ? "?" + query : ""),
            path,
        };
    }

    const urlObj = new URL(apiBaseUrl + path + (query ? "?" + query : ""));

    return {
        url: urlObj.toString(),
        path: urlObj.pathname,
    };
};

export const ApiRoutes = {
    agents: {
        base: () => buildUrl("/agents"),
        getById: (agentId: string) => buildUrl(`/agents/${agentId}`),
        getKnowledge: (agentId: string) =>
            buildUrl(`/agents/${agentId}/knowledge`),
        addKnowledge: (agentId: string, fileName: string) =>
            buildUrl(`/agents/${agentId}/knowledge/${fileName}`),
        deleteKnowledge: (agentId: string, fileName: string) =>
            buildUrl(`/agents/${agentId}/knowledge/${fileName}`),
        triggerKnowledgeIngestion: (agentId: string) =>
            buildUrl(`/agents/${agentId}/knowledge`),
        createRemoteKnowledgeSource: (agentId: string) =>
            buildUrl(`/agents/${agentId}/remote-knowledge-sources`),
        getRemoteKnowledgeSource: (agentId: string) =>
            buildUrl(`/agents/${agentId}/remote-knowledge-sources`),
        updateRemoteKnowledgeSource: (
            agentId: string,
            remoteKnowledgeSourceId: string
        ) =>
            buildUrl(
                `/agents/${agentId}/remote-knowledge-sources/${remoteKnowledgeSourceId}`
            ),
        deleteRemoteKnowledgeSource: (
            agentId: string,
            remoteKnowledgeSourceId: string
        ) =>
            buildUrl(
                `/agents/${agentId}/remote-knowledge-sources/${remoteKnowledgeSourceId}`
            ),
    },
    workflows: {
        base: () => buildUrl("/workflows"),
        getById: (workflowId: string) => buildUrl(`/workflows/${workflowId}`),
        getKnowledge: (workflowId: string) =>
            buildUrl(`/workflows/${workflowId}/knowledge`),
        addKnowledge: (workflowId: string, fileName: string) =>
            buildUrl(`/workflows/${workflowId}/knowledge/${fileName}`),
        deleteKnowledge: (workflowId: string, fileName: string) =>
            buildUrl(`/workflows/${workflowId}/knowledge/${fileName}`),
    },
    threads: {
        base: () => buildUrl("/threads"),
        getById: (threadId: string) => buildUrl(`/threads/${threadId}`),
        getByAgent: (agentId: string) => buildUrl(`/agents/${agentId}/threads`),
        events: (
            threadId: string,
            params?: { follow?: boolean; runID?: string }
        ) => buildUrl(`/threads/${threadId}/events`, params),
        getKnowledge: (threadId: string) =>
            buildUrl(`/threads/${threadId}/knowledge`),
        getFiles: (threadId: string) => buildUrl(`/threads/${threadId}/files`),
    },
    runs: {
        base: () => buildUrl("/runs"),
        getDebugById: (runId: string) => buildUrl(`/runs/${runId}/debug`),
        getByThread: (threadId: string) =>
            buildUrl(`/threads/${threadId}/runs`),
    },
    toolReferences: {
        base: (params?: { type?: ToolReferenceType }) =>
            buildUrl("/toolreferences", params),
        getById: (toolReferenceId: string) =>
            buildUrl(`/toolreferences/${toolReferenceId}`),
    },
    invoke: (id: string, threadId?: Nullish<string>) => {
        return threadId
            ? buildUrl(`/invoke/${id}/threads/${threadId}`)
            : buildUrl(`/invoke/${id}`);
    },
};

/** revalidates the cache for all routes that match the filter callback
 *
 * Standard format for setting up cache keys is { url: urlPath, ...restData }
 * where urlPath is the path of the api route
 */
export const revalidateWhere = async (filterCb: (url: string) => boolean) => {
    await mutate((key: unknown) => {
        if (
            key &&
            typeof key === "object" &&
            "url" in key &&
            typeof key.url === "string"
        ) {
            return filterCb(key.url);
        }
    });
};