import { getContract } from "@/app/api";
import { Contract } from "@/app/types";
import { capitalize, formatDateToDDMMYYYY } from "@/app/utils";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import Image from "next/image";
const host = process.env.NEXT_PUBLIC_HOST;

async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contractResponse = (await getContract(id)) as {
    result: boolean;
    data: { data: Contract };
    error: any;
  };

  if (!contractResponse.result) return contractResponse.error;

  const { data: contract } = contractResponse.data;
  const { firma, ...rest } = contract;
  return (
    <div className="w-full max-w-[500px] mx-auto ">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl  md:text-center">
        Detalle contrato
      </h1>
      <div className="mt-10 mb-4">
        {Object.entries(rest)?.map(([key, value], i) => {
          if (key === "fecha") {
            return (
              <p key={key}>
                <span className={"font-bold"}>{capitalize(key)}:</span>{" "}
                {formatDateToDDMMYYYY(String(value))}
              </p>
            );
          } else if (Array.isArray(value)) {
            return (
              <p key={key}>
                <span className={"font-bold"}>{capitalize(key)}:</span>{" "}
                {value.join(", ")}
              </p>
            );
          } else if (key === "id" || key === "domicilio") {
            return (
              <p key={key}>
                <span className={"font-bold"}>{capitalize(key)}:</span> {String(value)}
              </p>
            );
          } else {
            return (
              <p key={key}>
                <span className={"font-bold"}>{capitalize(key)}:</span>{" "}
                {value === true || Number(value) === 1 || value === "1"
                  ? "Sí"
                  : value === false || Number(value) === 0 || value === "0"
                  ? "No"
                  : capitalize(String(value))}
              </p>
            );
          }
        })}
      </div>
      <div className="flex  justify-center">
        <CustomBreadcrumb />
      </div>
    </div>
  );
}

export default ContractDetail;
