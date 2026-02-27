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
import { useRouter } from "next/navigation"

const formSchema = z.object({
  staff_id: z
    .string(),
  password: z
    .string()
})

export function LoginForm() {
  const router = useRouter()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      staff_id: "",
      password: "",
    },
  })
  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const res = await fetch(`http://192.168.0.147:3000/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      toast.success(result?.message || "Login successful")
      router.push("/dashboard")
      console.log(result)
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong")
    } finally{
      form.reset()
    }
  }

  return (
    <Card className="container mx-auto">
      <CardHeader>
        <CardTitle>Login </CardTitle>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="staff_id"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="staff_id">
                    Staff ID
                  </FieldLabel>
                  <Input
                    {...field}
                    id="staff_id"
                    suppressHydrationWarning
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    suppressHydrationWarning
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="submit" form="login-form">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}

