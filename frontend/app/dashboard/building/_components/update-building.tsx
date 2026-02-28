"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
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
import { useRouter } from "next/navigation"

// Define schema with number type validation
const formSchema = z.object({
    location_id: z.string(),
    ventilation_rating: z.number().min(1, { message: "Ventilation rating must be at least 1" }),
    max_capacity: z.number().min(1, { message: "Max capacity must be at least 1" }),
})

const UpdateBuilding = () => {
    const router = useRouter()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            location_id: "ICU_01",
            ventilation_rating: 10,
            max_capacity: 1,
        },
    })

    // Handle submit by converting the data to ensure it's in correct format
    async function onSubmit(data: z.infer<typeof formSchema>) {
        // Ensure values are numbers (in case they come in as strings)
        data.ventilation_rating = parseInt(data.ventilation_rating.toString(), 10)
        data.max_capacity = parseInt(data.max_capacity.toString(), 10)

        const res = await fetch("http://192.168.0.147:3000/api/location/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        })
            .then((res) => res.json())
            .catch((err) => {
                console.error(err)
                toast.error("An error occurred while updating the building.")
            })

        toast.success(res?.message || "Building updated successfully")
        router.refresh()
    }

    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Update Building Data</CardTitle>
            </CardHeader>
            <CardContent>
                <form id="add-equipment-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div className="flex gap-2">
                            <Controller
                                name="location_id"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="location_id">Location ID</FieldLabel>
                                        <Input
                                            {...field}
                                            id="location_id"
                                            suppressHydrationWarning
                                            aria-invalid={fieldState.invalid}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Controller
                                name="ventilation_rating"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="ventilation_rating">Ventilation Rating</FieldLabel>
                                        <Input
                                            {...field}
                                            id="ventilation_rating"
                                            type="number"
                                            suppressHydrationWarning
                                            aria-invalid={fieldState.invalid}
                                            // Ensure the input value is always a valid number
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10)
                                                form.setValue("ventilation_rating", value, { shouldValidate: true })
                                            }}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="max_capacity"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="max_capacity">Max Capacity</FieldLabel>
                                        <Input
                                            {...field}
                                            id="max_capacity"
                                            type="number"
                                            suppressHydrationWarning
                                            aria-invalid={fieldState.invalid}
                                            // Ensure the input value is always a valid number
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10)
                                                form.setValue("max_capacity", value, { shouldValidate: true })
                                            }}
                                        />
                                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                    </Field>
                                )}
                            />
                        </div>
                        <Field orientation="horizontal">
                            <Button type="submit">Submit</Button>
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
        </Card>
    )
}

export default UpdateBuilding