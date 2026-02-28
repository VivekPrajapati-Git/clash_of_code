import CardSection from "./_componenets/card-section"
import DashboardDataTable from "./_componenets/dashboard-data-table"

const page = async () => {

  const data = {
    "stats": {
      "total_patients": 23,
      "isolated_patients": 23,
      "pending_reports": 23,
      "critical_patients": 23,
      "contaminated_equipment": 23,
    },
    "recentInteraction": [
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
      {
        "location_id": "WARD_B",
        "risk_index": 8.9,
        "log_id": 23,
        "actor_id": 12,
        "target_id": 12,
        "action_type": "string",
        "timestamp": "string"
      },
    ]
  }

  const res = await fetch("http://192.168.0.147:3000/api/stats")
    .then(res => res.json())
    .catch(err => console.error(err))

  return (
    <section>
      <CardSection stats={res.stats || data.stats} />
      <DashboardDataTable data={res.recentInteractions || data.recentInteraction} />
    </section>
  )
}

export default page
