"use client"

import type { ColumnDef } from "@tanstack/react-table"

interface Contract {
  id: string
  nombre: string
  email: string
  areas: string[]
  fecha: string
  empresa: string | null
  lugar: string | null
}

export const columns: ColumnDef<Contract>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
    enableSorting: true,
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
    enableSorting: true,
    cell: ({ row }) => row.original.empresa || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: true,
  },
  {
    accessorKey: "areas",
    header: "Áreas",
    enableSorting: true,
    cell: ({ row }) => (row.original.areas || []).join(", "),
  },
  {
    accessorKey: "lugar",
    header: "Lugar",
    enableSorting: true,
    cell: ({ row }) => row.original.lugar || "-",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    enableSorting: true,
    cell: ({ row }) =>
      row.original.fecha
        ? new Date(row.original.fecha).toLocaleDateString()
        : "-",
  },
  {
    id: "actions",
    header: "Acciones",
    enableSorting: false,
    cell: ({ row }) => (
      <a
        href={`${process.env.NEXT_PUBLIC_API_URL}/api/generate-pdf?id=${row.original.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        Descargar PDF
      </a>
    ),
  },
]
