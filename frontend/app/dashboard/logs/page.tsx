import DashboardDataTable from "../_componenets/dashboard-data-table"

const page = async () => {

  const data = await fetch(process.env.BASE_URL + "/interactions").then(data => data.json())
  return (
    <div>
      <DashboardDataTable data={data.data} />

    </div>
  )
}

export default page
