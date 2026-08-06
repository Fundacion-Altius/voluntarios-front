import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Contract {
  id: string;
  nombre: string;
  email: string;
  areas: string[];
  fecha: string;
}

interface ContractTableProps {
  contracts: Contract[];
}

export async function ContractTable({ contracts }: ContractTableProps) {
  const t = await getTranslations("admin.contracts");

  if (contracts.length === 0) {
    return <p className="text-muted-foreground">{t("noDisponibles")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("headerNombre")}</TableHead>
          <TableHead>{t("headerEmail")}</TableHead>
          <TableHead>{t("headerAreas")}</TableHead>
          <TableHead>{t("headerFecha")}</TableHead>
          <TableHead>{t("headerAcciones")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((contract) => (
          <TableRow key={contract.id}>
            <TableCell className="font-medium">{contract.nombre}</TableCell>
            <TableCell>{contract.email}</TableCell>
            <TableCell>{(contract.areas || []).join(', ')}</TableCell>
            <TableCell>
              {contract.fecha ? new Date(contract.fecha).toLocaleDateString() : '-'}
            </TableCell>
            <TableCell>
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/api/generate-pdf?id=${contract.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {t("descargarPdf")}
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
