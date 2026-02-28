import { Separator } from "@/components/ui/separator"
import BuildingCardRender from "./_components/building-render"
import AddBuilding from "./_components/add-building"
import UpdateBuilding from "./_components/update-building"

const buildingsData = [
  {
    "location_id": "LAB_01",
    "floor_number": 1,
    "location_type": "LAB",
    "ventilation_rating": 6,
    "max_capacity": 5,
    "current_patients": 0
  },
  {
    "location_id": "WARD_1A",
    "floor_number": 1,
    "location_type": "WARD",
    "ventilation_rating": 8,
    "max_capacity": 4,
    "current_patients": 1
  },
  {
    "location_id": "WARD_1B",
    "floor_number": 1,
    "location_type": "WARD",
    "ventilation_rating": 7,
    "max_capacity": 4,
    "current_patients": 0
  },
  {
    "location_id": "WARD_2A",
    "floor_number": 2,
    "location_type": "WARD",
    "ventilation_rating": 9,
    "max_capacity": 2,
    "current_patients": 0
  },
  {
    "location_id": "ICU_01",
    "floor_number": 3,
    "location_type": "ICU",
    "ventilation_rating": 10,
    "max_capacity": 1,
    "current_patients": 0
  },
]
const page = async () => {

  const res = await fetch("http://192.168.0.147:3000/api/location", { next: { revalidate: 90 } })
    .then(res => res.json())
    .catch(err => console.error(err))

  return (
    <div>
      <h1 className="text-pretty text-primary text-3xl my-2">Buildings</h1>
      <Separator className="my-4" />
      <div className="flex gap-2">
        <AddBuilding />
        <UpdateBuilding />
      </div>
      <Separator className="my-4" />
      <BuildingCardRender buildings={res.locations || buildingsData} />
    </div>
  )
}

export default page
