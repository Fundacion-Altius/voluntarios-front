import React from "react";
import { columns } from "./columns";
import { getContracts } from "@/app/api";
import { DataTable } from "@/components/data-table";

async function Page() {
  const contracts = await getContracts();

  const renderComponent = () => {
    if (!contracts.result) {
      return <p>{contracts.error}</p>;
    } else {
      return <DataTable columns={columns} data={contracts?.data} endpoint="api/contracts/bulk-delete"/>;
    }
  };
  return <>{renderComponent()};</>;
}

export default Page;
