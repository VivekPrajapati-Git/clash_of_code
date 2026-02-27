const pool = require('../config/db');
const mongoose = require('mongoose');

// Helper to get the Report model without needing to export it from report.js
// As long as report.js is required before this (which it is in app.js), this works.
const getReportModel = () => {
    try {
        return mongoose.model('Report');
    } catch (e) {
        console.error("Report model not found in Mongoose. Ensure routes/report.js is loaded first.");
        return null;
    }
};

const doctorController = {
    // 1. Move a patient to a new location (creates an interaction)
    movePatient: async (req, res) => {
        const { pfid, location_id, actor_id } = req.body;

        if (!pfid || !location_id || !actor_id) {
            return res.status(400).json({ message: "pfid, location_id, and actor_id are required" });
        }

        try {
            const action_type = 'PATIENT_MOVE';

            // Insert into Hospital_Interactions table
            const [result] = await pool.query(
                `INSERT INTO Hospital_Interactions (actor_id, target_id, location_id, action_type)
                 VALUES (?, ?, ?, ?)`,
                [actor_id, pfid, location_id, action_type]
            );

            return res.status(201).json({
                message: "Patient movement logged successfully",
                interactionId: result.insertId
            });
        } catch (error) {
            console.error("Error moving patient:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 2. Mark a patient as infected or not (updates Patients table status)
    // If marked ISOLATED, also traces their room/equipment interactions and marks equipment as CONTAMINATED
    updatePatientStatus: async (req, res) => {
        const { pfid, status } = req.body;

        if (!pfid || !status) {
            return res.status(400).json({ message: "pfid and status are required" });
        }

        // Validate status enum
        const validStatuses = ['STABLE', 'ISOLATED', 'CRITICAL'];
        if (!validStatuses.includes(status.toUpperCase())) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        try {
            // Check if patient exists
            const [patient] = await pool.query('SELECT * FROM Patients WHERE pfid = ?', [pfid]);
            if (patient.length === 0) {
                return res.status(404).json({ message: "Patient not found" });
            }

            // Update status
            await pool.query(
                'UPDATE Patients SET current_status = ? WHERE pfid = ?',
                [status.toUpperCase(), pfid]
            );

            let equipmentUpdatedCount = 0;

            // Trace equipment and update to CONTAMINATED if patient is ISOLATED
            if (status.toUpperCase() === 'ISOLATED') {
                // Find all unique equipment IDs the patient interacted with
                // In Hospital_Interactions, target_id could be the equip_id if actor_id is the pfid
                // Or actor_id could be equip_id if target_id is pfid
                const [interactions] = await pool.query(
                    `SELECT DISTINCT target_id as equip_id 
                     FROM Hospital_Interactions 
                     WHERE actor_id = ? AND target_id LIKE 'EQ_%'
                     UNION
                     SELECT DISTINCT actor_id as equip_id
                     FROM Hospital_Interactions
                     WHERE target_id = ? AND actor_id LIKE 'EQ_%'`,
                    [pfid, pfid]
                );

                if (interactions.length > 0) {
                    const equipIds = interactions.map(i => i.equip_id);

                    // Update all associated equipment to CONTAMINATED
                    // Using IN clause for bulk update
                    const placeholders = equipIds.map(() => '?').join(',');
                    const [updateResult] = await pool.query(
                        `UPDATE Equipment SET status = 'CONTAMINATED' WHERE equip_id IN (${placeholders})`,
                        equipIds
                    );

                    equipmentUpdatedCount = updateResult.affectedRows;
                    console.log(`Marked ${equipmentUpdatedCount} pieces of equipment as CONTAMINATED due to patient ${pfid} isolation.`);
                }
            }

            // Emit real-time update
            if (req.app.get('io')) {
                req.app.get('io').emit('patient_status_updated', {
                    pfid: pfid,
                    new_status: status.toUpperCase(),
                    equipment_contaminated: equipmentUpdatedCount > 0
                });
            }

            return res.status(200).json({
                message: "Patient status updated successfully",
                pfid: pfid,
                new_status: status.toUpperCase(),
                equipment_traced_and_contaminated: equipmentUpdatedCount
            });
        } catch (error) {
            console.error("Error updating patient status:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 3. Update patient severity (Doctor only)
    updatePatientSeverity: async (req, res) => {
        const { pfid, severity, actor_id } = req.body;

        if (!pfid || !severity || !actor_id) {
            return res.status(400).json({ message: "pfid, severity, and actor_id are required" });
        }

        // Format to match ENUM ('Critical', 'Moderate', 'Stable')
        const formattedSeverity = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
        const validSeverities = ['Critical', 'Moderate', 'Stable'];

        if (!validSeverities.includes(formattedSeverity)) {
            return res.status(400).json({ message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` });
        }

        try {
            // Verify actor is a DOCTOR
            const [staff] = await pool.query('SELECT role FROM Staff WHERE staff_id = ?', [actor_id]);
            if (staff.length === 0) {
                return res.status(404).json({ message: "Staff member not found." });
            }
            if (staff[0].role !== 'DOCTOR') {
                return res.status(403).json({ message: "Forbidden: Only doctors can update patient severity." });
            }

            // Check if patient exists
            const [patient] = await pool.query('SELECT * FROM Patients WHERE pfid = ?', [pfid]);
            if (patient.length === 0) {
                return res.status(404).json({ message: "Patient not found" });
            }

            // Update severity
            await pool.query(
                'UPDATE Patients SET severity = ? WHERE pfid = ?',
                [formattedSeverity, pfid]
            );

            // Log this as an interaction
            const action_type = 'UPDATE_SEVERITY';
            await pool.query(
                `INSERT INTO Hospital_Interactions (actor_id, target_id, action_type)
                 VALUES (?, ?, ?)`,
                [actor_id, pfid, action_type]
            );

            // Emit real-time update
            if (req.app.get('io')) {
                req.app.get('io').emit('patient_severity_updated', {
                    pfid: pfid,
                    severity: formattedSeverity
                });
            }

            return res.status(200).json({
                message: "Patient severity updated successfully",
                pfid: pfid,
                severity: formattedSeverity
            });
        } catch (error) {
            console.error("Error updating patient severity:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 4. View all reports of a specific patient (from MongoDB)
    getPatientReports: async (req, res) => {
        const { pfid } = req.params;

        if (!pfid) {
            return res.status(400).json({ message: "Patient ID (pfid) is required" });
        }

        try {
            const Report = getReportModel();
            if (!Report) {
                return res.status(500).json({ message: "Report model not initialized" });
            }

            // Find all reports in MongoDB matching the patient's pfid
            const reports = await Report.find({ patient_sql_id: pfid }).sort({ createdAt: -1 });

            return res.status(200).json({
                message: "Reports retrieved successfully",
                count: reports.length,
                reports: reports
            });
        } catch (error) {
            console.error("Error fetching patient reports:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 4. View all pending reports across all patients (from MongoDB)
    getPendingReports: async (req, res) => {
        try {
            const Report = getReportModel();
            if (!Report) {
                return res.status(500).json({ message: "Report model not initialized" });
            }

            // Find all reports where clinical_verification.status is PENDING
            // Sort by AI priority (highest first)
            const reports = await Report.find(
                { "clinical_verification.status": "PENDING" }
            ).sort({ "ai_layer.preliminary_priority": -1 });

            // Format the response to exactly what the frontend needs
            const formattedReports = reports.map(report => ({
                id: report._id,
                priority: report.ai_layer ? report.ai_layer.preliminary_priority : 0,
                patient_id: report.patient_sql_id,
                status: report.clinical_verification.status,
                test_type: report.test_data ? report.test_data.type : 'UNKNOWN',
                test_result: report.test_data ? report.test_data.result : 'UNKNOWN',
                data: report.test_data
            }));

            return res.status(200).json({
                message: "Pending reports retrieved successfully",
                count: formattedReports.length,
                reports: formattedReports
            });
        } catch (error) {
            console.error("Error fetching pending reports:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

module.exports = doctorController;
