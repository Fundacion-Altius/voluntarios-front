"use client";

import { useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import LoadingButton from "./loading-button";

const host = process.env?.NEXT_PUBLIC_API_URL;
interface Identifiable {
  id: string | number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  basePath?: string;
  endpoint?: string;
}

export function DataTable<TData extends Identifiable, TValue>({
  columns,
  data,
  basePath,
  endpoint,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [action, setAction] = useState(""); // new state to track the selected action
  const [loading, setLoading] = useState(false);

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

    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });
  const handleBulkAction = async () => {
    if (action === "delete") {
      // Get IDs of selected rows. Adjust this if your row data uses a different key.
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original.id);
      if (!ids.length) return;
      setLoading(true);
      try {
        // Replace `/api/bulk-delete/` with your actual Django endpoint
        const res = await fetch(`${host}/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Include CSRF token if needed
          },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
          throw new Error("Bulk delete failed");
        }

        setRowSelection({});
        router.push("/dashboard/voluntarios");
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // You can add more actions here if needed.
  };
  return (
    <div className="rounded-md border">
      <div className="flex items-center py-4 md:w-[100%] mr-2">
        <Input
          placeholder="Filter names..."
          value={(table.getColumn("nombre")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nombre")?.setFilterValue(event.target.value)
          }
        />
      </div>
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">Action:</span>
        <select
          className="p-2 border rounded"
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="">Select action</option>
          <option value="delete">Delete selected item(s)</option>
          {/* Add more actions if needed */}
        </select>
        <LoadingButton
          isLoading={loading}
          disabled={!table.getFilteredSelectedRowModel().rows.length || !action}
          onClick={handleBulkAction}
        >
          Apply
        </LoadingButton>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex text-sm text-muted-foreground w-full justify-center p-2">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex w-full items-center justify-center text-sm font-medium">
        Page {table.getState().pagination.pageIndex + 1} of{" "}
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
          <span className="sr-only">Go to next page</span>
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight />
        </Button>
      </div>
    </div>
  );
}
