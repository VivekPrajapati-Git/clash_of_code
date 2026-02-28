import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type Building = {
    "location_id": string,
    "floor_number": number,
    "location_type": string,
    "ventilation_rating": number,
    "max_capacity": number,
    "current_patients"?: number
}
const BuildingCardRender = ({ buildings }: { buildings: Building[] }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {buildings.map(building => {
                return (
                    <Card key={building.location_id}>
                        <CardHeader>
                            <CardTitle>{building.location_id}</CardTitle>
                            <CardAction>
                                <Badge >{building.location_type}</Badge>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <p>Floor Number : {building.floor_number}</p>
                            <p>Ventilation Rate : {building.ventilation_rating}</p>
                            <p>Max Capacity : {building.max_capacity}</p>
                            <p>Current Capacity : {building.current_patients}</p>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

export default BuildingCardRender
