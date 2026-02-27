const express = require('express');
const router = express.Router();
const techController = require('../controllers/techController');

// Route to get a list of all patients
router.get('/patients', techController.getPatients);

// Route to submit a new patient report
router.post('/report', techController.createPatientReport);

// Route to get all past reports submitted by a specific lab technician
router.get('/reports/:lab_tech_id', techController.getTechReports);

module.exports = router;
