// client-data-table.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { Contract } from "@/app/types";
import { ColumnDef, flexRender } from "@tanstack/react-table";

interface ClientDataTableProps<TData, TValue> {
  initialData: TData[];
  columns: ColumnDef<TData, TValue>[];
  endpoint: string;
}
const host = process.env?.NEXT_PUBLIC_API_URL;

export function ClientDataTable<TData extends Contract, TValue>({
  initialData,
  columns,
  endpoint,
}: ClientDataTableProps<TData, TValue>) {
  const [data, setData] = useState<TData[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Create a modified version of the columns to pass refreshData
  const columnsWithRefresh = useMemo(() => {
    // We need to modify the columns to include our refreshData function
    return columns.map((col) => {
      // If this is the actions column, we need to make sure it has access to refreshData
      if (col.id === "actions") {
        return {
          ...col,
          cell: (info: any) => {
            // Pass the refresh function through the info context
            return flexRender(col.cell, {
              ...info,
              table: {
                ...info.table,
                options: {
                  ...info.table.options,
                  meta: {
                    ...info.table.options.meta,
                    refreshData: fetchData,
                  },
                },
              },
            });
          },
        };
      }
      return col;
    });
  }, [columns]);

  const fetchData = async () => {
    console.log("Fetching fresh data...");
    setLoading(true);
    try {
      const url = `${host}/api/contracts/ `;
      console.log("Sending request to:", url);
      const response = await fetch(url);
      const refreshedData = await response.json();

      if (refreshedData) {
        console.log("Got fresh data:", refreshedData);
        setData(refreshedData as TData[]);
      } else {
        console.error("Error in response:", refreshedData);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setLoading(false);
    }
  };

  // For debugging
  useEffect(() => {
    console.log("ClientDataTable mounted with data:", initialData);
  }, [initialData]);

  return (
    <>
      {/* {loading && <div>Refreshing data...</div>} */}
      <DataTable
        columns={columns}
        data={data}
        endpoint={endpoint}
        onRefresh={fetchData}
      />
    </>
  );
}
