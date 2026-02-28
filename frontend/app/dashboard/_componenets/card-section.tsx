import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type CardSectionInput = {
    "total_patients": number,
    "isolated_patients":number,
    "pending_reports": number,
    "critical_patients": number,
    "contaminated_equipment": number,
}
const CardSection = ({stats}:{stats:CardSectionInput}) => {
    return (
        <section className='grid grid-cols-2 gap-2'>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Total Patients</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{stats?.total_patients}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Pending Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{stats?.pending_reports}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Critical Risk Patients</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{stats?.critical_patients}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Contaminated Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{stats?.contaminated_equipment}</p>
                </CardContent>
            </Card>
        </section>
    )
}

export default CardSection
