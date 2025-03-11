// client-data-table.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { Contract } from "@/app/types";
import { ColumnDef, flexRender } from "@tanstack/react-table";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [data, setData] = useState<TData[]>(initialData);
  const [loading, setLoading] = useState(false);

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

// get current URL

  return (
    <>
      {/* {loading && <div>Refreshing data...</div>} */}
      <DataTable
        columns={columns}
        data={data}
        endpoint={endpoint}
        onRefresh={fetchData}
        basePath={`${pathname}/`}
      />
    </>
  );
}
