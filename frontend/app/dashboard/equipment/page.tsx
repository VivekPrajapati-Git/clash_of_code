import { Separator } from "@/components/ui/separator"
import AddEquipment from "./_components/add-equipment"
import { columns } from "./_components/colunm"
import { DataTable } from "./_components/data-table"
import { EquipmentGraph } from "./_components/equipment-graph"

const chartData = [
  {
    status: "CONTAMINATED",
    count: 10
  },
  {
    status: "IN_USE",
    count: 15
  },
  {
    status: "CLEAN",
    count: 11
  },
]

const data = [
  {
    "equip_id": "ECG_6436",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "ECG_7308",
    "status": "CLEAN",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQ_101",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQ_202",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQIP_6592_1",
    "status": "IN_USE",
    "current_location": "WARD_1A"
  },
  {
    "equip_id": "EQIP_6592_10",
    "status": "CLEAN",
    "current_location": "ICU_01"
  },
  {
    "equip_id": "EQIP_6592_11",
    "status": "CONTAMINATED",
    "current_location": "WARD_1A"
  },
  {
    "equip_id": "EQIP_6592_12",
    "status": "CONTAMINATED",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQIP_6592_13",
    "status": "CONTAMINATED",
    "current_location": "LAB_01"
  },
  {
    "equip_id": "EQIP_6592_2",
    "status": "CONTAMINATED",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQIP_6592_3",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQIP_6592_4",
    "status": "CONTAMINATED",
    "current_location": "WARD_1A"
  },
  {
    "equip_id": "EQIP_6592_5",
    "status": "CLEAN",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "EQIP_6592_6",
    "status": "CONTAMINATED",
    "current_location": "WARD_2A"
  },
  {
    "equip_id": "EQIP_6592_7",
    "status": "IN_USE",
    "current_location": "LAB_01"
  },
  {
    "equip_id": "EQIP_6592_8",
    "status": "CLEAN",
    "current_location": "LAB_01"
  },
  {
    "equip_id": "EQIP_6592_9",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
  {
    "equip_id": "VENT_6436",
    "status": "IN_USE",
    "current_location": "UNKNOWN"
  },
]

const page = async () => {
  const res = await fetch("http://192.168.0.147:3000/api/equipment")
  .then(res => res.json())
  return (
    <div>
      <div className="flex gap-2 container mx-auto ">
        <EquipmentGraph chartData={res?.stats || chartData} total={res.total || 0} />
        <AddEquipment />
      </div>
      <Separator className="my-4" />
      <div className="container mx-auto h-1">
        <DataTable columns={columns} data={res.equipment || data} />
      </div>
    </div>
  )
}

export default page
