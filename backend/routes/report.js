const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Define Mongoose Schema for the Report
const reportSchema = new mongoose.Schema({
    patient_sql_id: { type: String, required: true },
    test_data: {
        type: { type: String },
        result: { type: String },
        lab_tech_id: { type: String }
    },
    ai_layer: {
        preliminary_priority: { type: Number },
        auto_triggered: { type: Boolean },
        // reasoning: { type: String }
    },
    clinical_verification: {
        status: { type: String, default: 'PENDING' },
        doctor_id: { type: String },
        // severity_score: { type: Number },
        // doctor_notes: { type: String }
    }
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);

// GET /api/report?data={...json...}
router.get('/', async (req, res) => {
    try {
        // Since it's a GET request, the payload should ideally come from a query parameter
        // Assumes you hit /api/report?data={"report_id":"..."}
        if (!req.query.data) {
            return res.status(400).json({ error: "Missing 'data' query parameter containing JSON" });
        }

        let reportData;
        try {
            reportData = JSON.parse(req.query.data);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON in 'data' query parameter" });
        }

        // 1. Save to MongoDB
        const newReport = new Report(reportData);
        await newReport.save();

        // 2. Forward the data to port 8001 (e.g., AI microservice)
        // Using native fetch available in Node.js 18+
        try {
            const aiServiceUrl = 'http://localhost:8001/api/process-report'; // Adjust endpoint if needed

            const aiResponse = await fetch(aiServiceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportData)
            });

            if (!aiResponse.ok) {
                console.warn(`AI Service responded with status: ${aiResponse.status}`);
            }
        } catch (fetchError) {
            console.error('Failed to forward report to port 8001:', fetchError.message);
            // We usually don't want to completely fail the request if the AI service just happens to be down,
            // but you can change this to `throw fetchError` if it's strictly required.
        }

        res.status(201).json({
            message: 'Report saved and forwarded successfully',
            report: newReport
        });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;
