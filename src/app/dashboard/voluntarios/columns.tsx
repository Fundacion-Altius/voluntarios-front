"use client";
import { ColumnDef, CellContext } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Contract } from "@/app/types";
import { Download } from "lucide-react";
import { formatDateToDDMMYYYY, handleDownload } from "@/app/utils";

// Define proper types for the table meta
interface TableMeta {
  refreshData?: () => void;
}

// Helper component for action buttons with state
const ActionButtons = ({ info }: { info: CellContext<Contract, unknown> }) => {
  const { row, table } = info;

  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshData = (table.options.meta as TableMeta | undefined)
    ?.refreshData;
  const host = process.env?.NEXT_PUBLIC_API_URL || "";
  console.log(host);
  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);

    try {
      const newState =
        row.original.estado === "activo" ? "pendiente" : "activo";
      const response = await fetch(
        `${host}/api/contracts/toggle-state?id=${row.original.id}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Refresh data if available
      if (refreshData) refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${host}/api/contracts/${row.original.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete contract");
      }

      // Refresh data if available
      if (refreshData) refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContractDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      await handleDownload(row.original.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {row.original?.estado === "pendiente" ? (
        <Button
          className="bg-blue-800"
          onClick={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? "Activando..." : "Activar"}
        </Button>
      ) : row.original.estado === "activo" ? (
        <Button
          className="bg-red-800"
          onClick={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? "Desactivando..." : "Desactivar"}
        </Button>
      ) : (
        <Button
          className="bg-blue-800"
          onClick={handleActivate}
          disabled={isActivating}
        >
          {isActivating ? "Activando..." : "Activar"}
        </Button>
      )}

      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Eliminando..." : "Eliminar"}
      </Button>

      <Button
        className="flex w-full md:max-w-[180px]"
        onClick={handleContractDownload}
        disabled={isDownloading}
      >
        <Download /> {isDownloading ? "Descargando..." : "Descargar contrato"}
      </Button>

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export const columns: ColumnDef<Contract>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => {
      const fechaValue = row.getValue("fecha") as string;
      return formatDateToDDMMYYYY(fechaValue);
    },
  },
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
  },
  {
    id: "actions",
    enableHiding: false,
    header: "Acciones",
    cell: (info) => <ActionButtons info={info} />,
  },
];
