import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type DashboardDataTableInput = {
    "location_id": string,
    "risk_index": number,
    "log_id": number,
    "actor_id": number,
    "target_id": number,
    "action_type": string,
    "timestamp": string
}

const DashboardDataTable = ({ data }: { data: DashboardDataTableInput[] }) => {
    return (
        <Table className="mt-1">
            <TableHeader>
                <TableRow>
                    <TableHead>Log ID</TableHead>
                    <TableHead>Location ID</TableHead>
                    <TableHead>Actor ID</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Risk Index</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Timestamp</TableHead>
                </TableRow>
            </TableHeader>
                <TableBody>
                    {data.map((item) => (
                        <TableRow key={item.log_id}>
                            <TableCell>{item.log_id}</TableCell>
                            <TableCell>{item.location_id}</TableCell>
                            <TableCell>{item.actor_id}</TableCell>
                            <TableCell>{item.target_id}</TableCell>
                            <TableCell>{item.action_type}</TableCell>
                            <TableCell>{item.timestamp}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
        </Table>
    )
}

export default DashboardDataTable
