import { Separator } from '@/components/ui/separator'
import { columns } from './_components/colunm'
import { DataTable } from './_components/data-table'

const page = async () => {

  const data = [
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
    {
      id: "string",
      patient_id: "string",
      test_type: "string",
      status: "pending"
    },
  ]

  const res = await fetch("http://192.168.0.147:3000/api/doctor/reports/pending", { next: { revalidate: 30 } })
    .then(res => res.json())
    .catch(err => console.error(err))

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-pretty text-primary text-3xl my-2">Doctor</h1>
      <Separator className="my-4" />
      <DataTable columns={columns} data={res.reports || data} />
    </div>
  )
}

export default page
