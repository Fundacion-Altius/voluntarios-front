// Page.tsx - Server Component
import React from "react";
import { columns } from "./columns";
import { getContracts } from "@/app/api";
import { ClientDataTable } from "@/components/client-data-table";

async function Page() {
  const contracts = await getContracts();

  return (
    <>
      {!contracts.result ? (
        <p>{contracts.error}</p>
      ) : (
        <ClientDataTable 
          initialData={contracts?.data} 
          columns={columns} 
          endpoint="api/contracts/bulk-delete" 
        />
      )}
    </>
  );
}

export default Page;