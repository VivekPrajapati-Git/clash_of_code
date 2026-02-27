const pool = require('../config/db');
const mongoose = require('mongoose');

// Helper to get the Report model without needing to export it from report.js
const getReportModel = () => {
    try {
        return mongoose.model('Report');
    } catch (e) {
        console.error("Report model not found in Mongoose. Ensure routes/report.js is loaded first.");
        return null;
    }
};

const techController = {
    // 1. Create a new patient report
    createPatientReport: async (req, res) => {
        const { patient_sql_id, test_data } = req.body;

        if (!patient_sql_id || !test_data || !test_data.type || !test_data.result || !test_data.lab_tech_id) {
            return res.status(400).json({ message: "patient_sql_id and complete test_data are required" });
        }

        try {
            // Find the most recent DOCTOR who interacted with this patient
            const [doctorData] = await pool.query(
                `SELECT h.actor_id AS doctor_id
                 FROM Hospital_Interactions h
                 JOIN Staff s ON h.actor_id = s.staff_id
                 WHERE h.target_id = ? AND s.role = 'DOCTOR'
                 ORDER BY h.timestamp DESC
                 LIMIT 1`,
                [patient_sql_id]
            );

            const assignedDoctorId = doctorData.length > 0 ? doctorData[0].doctor_id : "UNKNOWN_DOCTOR";

            // Find the most recent location of the patient
            const [locationData] = await pool.query(
                `SELECT location_id
                 FROM Hospital_Interactions
                 WHERE target_id = ? AND location_id IS NOT NULL AND location_id != ''
                 ORDER BY timestamp DESC
                 LIMIT 1`,
                [patient_sql_id]
            );

            // We aren't explicitly saving location to MongoDB right now per schema, 
            // but we fetch it to prove we can pass it to AI or append to notes.
            const currentLocation = locationData.length > 0 ? locationData[0].location_id : "UNKNOWN_LOCATION";

            const Report = getReportModel();
            if (!Report) {
                return res.status(500).json({ message: "Report model not initialized" });
            }

            // Construct new Report
            const newReport = new Report({
                patient_sql_id: patient_sql_id,
                test_data: test_data,
                ai_layer: {
                    preliminary_priority: 0, // Placeholder for AI logic later
                    auto_triggered: false
                },
                clinical_verification: {
                    status: 'PENDING',
                    doctor_id: assignedDoctorId
                }
            });

            await newReport.save();

            // Note: If you want to forward this to your Python AI layer as before,
            // you can include a fetch call here targeting port 8001 just like in report.js

            return res.status(201).json({
                message: "Patient report created successfully",
                report: newReport,
                meta: {
                    assigned_doctor: assignedDoctorId,
                    current_location: currentLocation
                }
            });

        } catch (error) {
            console.error("Error creating report:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 2. View all reports created by this technician (History)
    getTechReports: async (req, res) => {
        const { lab_tech_id } = req.params;

        if (!lab_tech_id) {
            return res.status(400).json({ message: "Lab Tech ID is required" });
        }

        try {
            const Report = getReportModel();
            if (!Report) {
                return res.status(500).json({ message: "Report model not initialized" });
            }

            const reports = await Report.find({ "test_data.lab_tech_id": lab_tech_id }).sort({ createdAt: -1 });

            return res.status(200).json({
                message: "Reports retrieved successfully",
                count: reports.length,
                reports: reports
            });
        } catch (error) {
            console.error("Error fetching tech reports:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 3. Get list of patients for the dropdown menu
    getPatients: async (req, res) => {
        try {
            const [patients] = await pool.query('SELECT pfid, current_status FROM Patients');

            return res.status(200).json({
                message: "Patients retrieved successfully",
                count: patients.length,
                patients: patients
            });
        } catch (error) {
            console.error("Error fetching patients:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

module.exports = techController;
