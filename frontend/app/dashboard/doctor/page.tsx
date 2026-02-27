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

  const res = await fetch(process.env.BASE_URL + "/doctor/reports/pending")
    .then(res => res.json())
    .catch(err => console.error(err))

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={res.reports || data} />
    </div>
  )
}

export default page
