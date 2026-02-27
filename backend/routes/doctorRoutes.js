const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Route to move a patient (log interaction)
router.post('/move-patient', doctorController.movePatient);

// Route to update a patient's infection status
router.post('/status', doctorController.updatePatientStatus);

// Route to view all pending reports (must be before /reports/:pfid)
router.get('/reports/pending', doctorController.getPendingReports);

// Route to view all reports for a specific patient
router.get('/reports/:pfid', doctorController.getPatientReports);

module.exports = router;
