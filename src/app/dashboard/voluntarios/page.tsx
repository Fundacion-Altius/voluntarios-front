// Page.tsx - Server Component
import React from "react";
import { columns } from "./columns";
import { getContracts } from "@/app/api";
import { ClientDataTable } from "@/components/client-data-table";
import { formatDateToDDMMYYYY } from "@/app/utils";

async function Page() {
  const contracts = await getContracts();
  const formattedData = contracts?.data.map((contract: any) => ({
    ...contract,
    fecha: formatDateToDDMMYYYY(contract.fecha),
  }));
  console.log(formattedData);
  return (
    <>
      {!contracts.result ? (
        <p>{contracts.error}</p>
      ) : (
        <ClientDataTable
          initialData={formattedData}
          columns={columns}
          endpoint="api/contracts/bulk-delete"
        />
      )}
    </>
  );
}

export default Page;
