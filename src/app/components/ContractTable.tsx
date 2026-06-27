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

export function ContractTable({ contracts }: ContractTableProps) {
  if (contracts.length === 0) {
    return <p className="text-muted-foreground">No hay contratos disponibles.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Áreas</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Acciones</TableHead>
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
                Descargar PDF
              </a>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
