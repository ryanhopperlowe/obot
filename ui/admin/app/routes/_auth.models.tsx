import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { PenSquareIcon } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR, { preload } from "swr";

import { Model } from "~/lib/model/models";
import { ModelApiService } from "~/lib/service/api/modelApiService";

import { TypographyH2, TypographySmall } from "~/components/Typography";
import { DataTable } from "~/components/composed/DataTable";
import { CreateModel } from "~/components/model/CreateModel";
import { DeleteModel } from "~/components/model/DeleteModel";
import { UpdateModelDialog } from "~/components/model/UpdateModel";
import { Button } from "~/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip";

export async function clientLoader() {
    await Promise.all([
        preload(ModelApiService.getModels.key(), ModelApiService.getModels),
        preload(
            ModelApiService.getModelProviders.key(true),
            ({ onlyConfigured }) =>
                ModelApiService.getModelProviders(onlyConfigured)
        ),
    ]);
    return null;
}

export default function Models() {
    const [modelToEdit, setModelToEdit] = useState<Model | null>(null);

    const { data } = useSWR(
        ModelApiService.getModels.key(),
        ModelApiService.getModels
    );

    const { data: providers } = useSWR(
        ModelApiService.getModelProviders.key(true),
        ({ onlyConfigured }) =>
            ModelApiService.getModelProviders(onlyConfigured)
    );

    const providerMap = useMemo(() => {
        if (!providers) return {};
        return providers?.reduce(
            (acc, provider) => {
                acc[provider.id] = provider.name;
                return acc;
            },
            {} as Record<string, string>
        );
    }, [providers]);

    return (
        <div className="h-full flex flex-col p-8 space-y-4">
            <div className="flex items-center justify-between">
                <TypographyH2>Models</TypographyH2>
                <CreateModel />
            </div>

            <DataTable
                columns={getColumns()}
                data={data ?? []}
                sort={[{ id: "id", desc: true }]}
                onRowClick={setModelToEdit}
            />

            <UpdateModelDialog
                model={modelToEdit}
                open={!!modelToEdit}
                setOpen={(open) => setModelToEdit(open ? modelToEdit : null)}
            />
        </div>
    );

    function getColumns(): ColumnDef<Model, string>[] {
        return [
            columnHelper.accessor((model) => model.name ?? model.id, {
                id: "id",
                header: "Model",
            }),
            columnHelper.accessor(
                (model) =>
                    providerMap[model.modelProvider] ?? model.modelProvider,
                {
                    id: "provider",
                    header: "Provider",
                }
            ),
            columnHelper.display({
                id: "default",
                cell: ({ row }) => {
                    const value = row.original.default;

                    if (!value) return null;

                    return (
                        <TypographySmall className="text-muted-foreground flex items-center gap-2">
                            <div className="size-2 bg-success rounded-full" />
                            Default
                        </TypographySmall>
                    );
                },
            }),
            columnHelper.display({
                id: "actions",
                cell: ({ row }) => (
                    <div className="flex justify-end">
                        <Tooltip>
                            <TooltipTrigger>
                                <Button size={"icon"} variant="ghost">
                                    <PenSquareIcon />
                                </Button>
                            </TooltipTrigger>

                            <TooltipContent>Update Model</TooltipContent>
                        </Tooltip>

                        <DeleteModel id={row.original.id} />
                    </div>
                ),
            }),
        ];
    }
}

const columnHelper = createColumnHelper<Model>();