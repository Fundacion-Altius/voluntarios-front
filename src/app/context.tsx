/* // generate code that configure context to 
interface ContractData {
  name: string;
  date: string;
  signature: string;
}
*/
import React, { ReactNode, createContext, useState } from "react";


interface ContractData {
  name: string;
  date: string;
  signature: string;
}
interface ContractContextType {
  contractData: ContractData | null;
  setContractData: (data: ContractData) => void;
}
export const ContractContext = createContext<ContractContextType | undefined>(undefined);

interface ContractProviderProps {
  children: ReactNode;
}


export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
  const [contractData, setContractData] = useState<ContractData | null>(null);

  const contextValue: ContractContextType = {
    contractData,
    setContractData,
  };

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
};