/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  CellContext,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";

import { Suspense, useState } from "react";

import { useRouter } from "next/navigation";
import LoadingButton from "./loading-button";
import SkeletonRectangle from "./skeletons/skeleton-rectangle";
import SkeletonSquare from "./skeletons/skeleton-square";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// Example host and API endpoint
const host = process.env?.NEXT_PUBLIC_URL;

// Define table meta for refresh functionality
interface TableMeta {
  refreshData?: () => void;
}

interface Identifiable {
  id: string | number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  basePath?: string;
  endpoint?: string;
  onRefresh?: () => Promise<void>;
}

export function DataTable<TData extends Identifiable, TValue>({
  columns,
  data,
  basePath,
  endpoint,
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [action, setAction] = useState(""); // track the selected action
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [addNewLoading, setAddNewLoading] = useState(false);

  // Handler for bulk actions
  const handleBulkAction = async () => {
    if (action === "delete") {
      // Get IDs of selected rows
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id);

      if (!ids.length) return;

      setBulkActionLoading(true);
      const url = endpoint
        ? `${host || ""}/${endpoint}`
        : "/api/contracts/bulk-delete";
      console.log("Sending request to:", url);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids }),
        });

        if (!res.ok) {
          throw new Error("Bulk delete failed");
        }

        setRowSelection({});

        // Refresh data if available
        if (onRefresh) await onRefresh();
        else router.refresh();
      } catch (error) {
        console.error(error);
      } finally {
        setBulkActionLoading(false);
      }
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    meta: {
      refreshData: onRefresh,
    } as TableMeta,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      {/* Top bar with filter and add new button */}
      <div className="flex justify-between">
        <div className="flex items-center py-4 md:w-[100%] mr-2">
          <Input
            placeholder="Filtrar por nombre..."
            value={
              (table.getColumn("nombre")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("nombre")?.setFilterValue(event.target.value)
            }
          />
        </div>
        <div className="flex items-center py-4">
          {/* <Link href={`${basePath}/add`} onClick={() => setAddNewLoading(true)}>
            <LoadingButton isLoading={addNewLoading}>Add new</LoadingButton>
          </Link> */}
        </div>
      </div>

      {/* Bulk action section */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">Acción:</span>
        <select
          className="p-2 border rounded"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">Seleccionar acción</option>
          <option value="delete">Borrar item(s) seleccionado(s)</option>
        </select>
        <LoadingButton
          isLoading={bulkActionLoading}
          disabled={!table.getFilteredSelectedRowModel().rows.length || !action}
          onClick={handleBulkAction}
        >
          Ejecutar
        </LoadingButton>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id}>
                      {cell.column.id === "select" ||
                      cell.column.id === "actions" ? (
                        // For select and actions columns, use the column's custom cell renderer
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      ) : typeof cell.getValue() === "string" &&
                        (cell.column.id === "id" ||
                          cell.column.id === "product") ? (
                        <Link
                          href={`${basePath}${cell.getValue()}`}
                          className="text-blue-500 hover:underline"
                        >
                          {cell.getValue()}
                        </Link>
                      ) : (
                        renderImageOrValue(cell.getValue())
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se han creado datos aún.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      <div className="flex text-sm text-muted-foreground w-full justify-center p-2">
        {table.getFilteredSelectedRowModel().rows.length} de{" "}
        {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
      </div>
      <div className="flex w-full items-center justify-center text-sm font-medium">
        Página {table.getState().pagination.pageIndex + 1} de{" "}
        {table.getPageCount()}
      </div>
      <div className="flex items-center space-x-2 w-full justify-center">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Ir a la siguiente página</span>
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Ir a la página previa</span>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}

function renderImageOrValue(value: any) {
  if (Array.isArray(value)) {
    return (
      <div className="flex gap-2">
        {value.slice(0, 3).map((url, idx) => (
          <div
            key={idx}
            className="relative w-12 h-12 overflow-hidden rounded-md"
          >
            <Suspense fallback={<SkeletonSquare />}>
              <Image
                src={`${host}${url}`}
                alt="Thumbnail"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />
            </Suspense>
          </div>
        ))}
      </div>
    );
  } else if (typeof value === "string" && value.startsWith("http")) {
    return (
      <div className="relative w-12 h-12 overflow-hidden rounded-md">
        <Suspense fallback={<SkeletonSquare />}>
          <Image
            src={value}
            alt="Thumbnail"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </Suspense>
      </div>
    );
  } else if (typeof value === "string" && value.startsWith("/media")) {
    return (
      <div className="relative w-12 h-12 overflow-hidden rounded-md">
        <Suspense fallback={<SkeletonSquare />}>
          <Image
            src={`${value}`}
            alt="Thumbnail"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
          />
        </Suspense>
      </div>
    );
  } else {
    return (
      <Suspense fallback={<SkeletonRectangle />}>
        {value == null || value === "" ? "N/D" : String(value)}
      </Suspense>
    );
  }
}
