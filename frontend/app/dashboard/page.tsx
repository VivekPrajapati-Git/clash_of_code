import CardSection from "./_componenets/card-section"
import DashboardDataTable from "./_componenets/dashboard-data-table"

const page = async () => {

  const data = {
    "active_infections": 4,
    "pending_doctor_verifications": 3,
    "high_risk_patients": 7,
    "contaminated_equipment": 2,
    "hotspot_locations": [
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

  // const res = await fetch("")

  return (
    <section>
      <CardSection
        active_infections={data.active_infections}
        pending_doctor_verifications={data.pending_doctor_verifications}
        high_risk_patients={data.high_risk_patients}
        contaminated_equipment={data.contaminated_equipment}
      />
      <DashboardDataTable data={data.hotspot_locations} />
    </section>
  )
}

export default page
