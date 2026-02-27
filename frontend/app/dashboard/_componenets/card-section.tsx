import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type CardSectionInput = {
    "active_infections": number,
    "pending_doctor_verifications": number,
    "high_risk_patients": number,
    "contaminated_equipment": number,
}
const CardSection = (data: CardSectionInput) => {
    return (
        <section className='grid grid-cols-2 gap-2'>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Active Infection</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{data?.active_infections}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Pending Doctor Verification</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{data?.pending_doctor_verifications}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>High Risk Patients</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{data?.high_risk_patients}</p>
                </CardContent>
            </Card>
            <Card className='@container/card'>
                <CardHeader>
                    <CardTitle>Contaminated Equipment</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-3xl font-bold'>{data?.contaminated_equipment}</p>
                </CardContent>
            </Card>
        </section>
    )
}

export default CardSection
