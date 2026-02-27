"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Report = {
  id: string
  patient_id: string
  test_type: string
  status: "pending" | "processing" | "success"
}

async function onSubmit(pfid: string, status: string) {
  const res = await fetch("http://192.168.0.147:3000/api/doctor/status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pfid, status })
    })
    .then(res => res.json())
    .catch(err => console.error(err))

  toast(res?.message)
}

export const columns: ColumnDef<Report>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "patient_id",
    header: "Patient ID",
  },
  {
    accessorKey: "test_type",
    header: "Test Type",
  },
  {
    accessorKey: "test_result",
    header: "Test Result",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const report = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onSubmit(report.patient_id, "STABLE")}>Stable</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSubmit(report.patient_id, "ISOLATED")}>Isolated</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSubmit(report.patient_id, "CRITICAL")}>Critical</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]