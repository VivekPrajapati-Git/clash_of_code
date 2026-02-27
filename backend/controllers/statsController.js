const pool = require('../config/db');
const mongoose = require('mongoose');

// Helper to get the Report model
const getReportModel = () => {
    try {
        return mongoose.model('Report');
    } catch (e) {
        return null;
    }
};

const statsController = {
    getDashboardStats: async (req, res) => {
        try {
            // 1. Total Patients
            const [totalPatientsResult] = await pool.query('SELECT COUNT(*) as count FROM Patients');
            const totalPatients = totalPatientsResult[0].count;

            // 2. Critical & Isolated Patients
            const [statusCounts] = await pool.query(
                `SELECT current_status, COUNT(*) as count 
                 FROM Patients 
                 GROUP BY current_status`
            );

            let isolatedPatients = 0;
            let criticalPatients = 0;

            statusCounts.forEach(row => {
                if (row.current_status === 'ISOLATED') isolatedPatients = row.count;
                if (row.current_status === 'CRITICAL') criticalPatients = row.count;
            });

            // 3. Contaminated Equipment
            const [equipmentResult] = await pool.query(
                `SELECT COUNT(*) as count FROM Equipment WHERE status = 'CONTAMINATED'`
            );
            const contaminatedEquipment = equipmentResult[0].count;

            // 4. Pending Reports
            let pendingReports = 0;
            const Report = getReportModel();
            if (Report) {
                pendingReports = await Report.countDocuments({ "clinical_verification.status": "PENDING" });
            }

            // // 5. Recent Interactions (Last 10)
            // const [recentInteractions] = await pool.query(
            //     `SELECT log_id, actor_id, target_id, location_id, action_type, timestamp 
            //      FROM Hospital_Interactions 
            //      ORDER BY timestamp DESC LIMIT 10`
            // );

            return res.status(200).json({
                message: "Stats retrieved successfully",
                stats: {
                    total_patients: totalPatients,
                    isolated_patients: isolatedPatients,
                    critical_patients: criticalPatients,
                    contaminated_equipment: contaminatedEquipment,
                    pending_reports: pendingReports
                },
                // recentInteractions: recentInteractions
            });

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

module.exports = statsController;
