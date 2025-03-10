import { getContract } from "@/app/api";
import { Contract } from "@/app/types";
import CustomBreadcrumb from "@/components/custom-breadcrumb";
import Image from "next/image";
const host = process.env.NEXT_PUBLIC_HOST;

async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contractResponse = await getContract(id);

  if (!contractResponse.result) return contractResponse.error;
  
  const {data:contract} = contractResponse.data;
  return (
    <div className="h-screen flex flex-col justify-center items-center gap-4 p-4">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl  md:text-center">
        Detalle contracto
      </h1>
      <div className="flex  gap-4 p-4">
        <div className="flex flex-2 first-letter:border mr-4"></div>
        <div className="flex flex-1 flex-col justify-center  max-w-[300px]">
          <p>
            <span className="text-lg font-semibold">Nombre contrato</span>:{" "}
            {contract?.nombre}
          </p>
        </div>
      </div>
      <div className="flex  justify-center">
        <CustomBreadcrumb />
      </div>
    </div>
  );
}

export default ContractDetail;
