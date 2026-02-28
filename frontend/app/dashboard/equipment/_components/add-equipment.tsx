"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

const status = ["IN_USE", "CLEAN"]
const formSchema = z.object({
    equip_id: z.string(),
    status: z.enum(status),
})

const AddEquipment = () => {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            equip_id: "",
            status: "CLEAN", // default value for status
        },
    })

    async function onSubmit(data: z.infer<typeof formSchema>) {

        const res = await fetch("http://192.168.0.147:3000/api/equipment/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .catch((err) => {
                console.error(err)
                toast.error("An error occurred while adding equipment.")
            })

        toast.success(res?.message || "Equipment added successfully")
        router.refresh()
    }

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Add Equipment</CardTitle>
            </CardHeader>
            <CardContent>
                <form id="add-equipment-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Controller
                            name="equip_id"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="equip_id">Equipment ID</FieldLabel>
                                    <Input
                                        {...field}
                                        id="equip_id"
                                        suppressHydrationWarning
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <Controller
                            name="status"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor="status">Status</FieldLabel>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                {field.value || "Select Status"}
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => field.onChange("IN_USE")}>
                                                IN_USE
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => field.onChange("CLEAN")}>
                                                CLEAN
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                        <CardFooter>
                            <Field orientation="horizontal">
                                <Button type="submit">Submit</Button>
                            </Field>
                        </CardFooter>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}

export default AddEquipment