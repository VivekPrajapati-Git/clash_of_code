"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Equipment = {
  equip_id: string
  current_location: string
  status: "CONTAMINATED" | "CLEAN" | "IN_USE"
}

async function onSubmit(equip_id: string, status: string) {
  const res = await fetch("http://192.168.0.147:3000/api/equipment/status",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ equip_id, status })
    })
    .then(res => res.json())
    .catch(err => console.error(err))

  toast(res?.message)
}

export const columns: ColumnDef<Equipment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "current_location",
    header: "Current Location",
  },
  {
    accessorKey: "equip_id",
    header: "Equipment ID",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const equipment = row.original
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
            <DropdownMenuItem onClick={() => onSubmit(equipment.equip_id, "IN_USE")}>INUSE</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSubmit(equipment.equip_id, "CLEAN")}>CLEAN</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]