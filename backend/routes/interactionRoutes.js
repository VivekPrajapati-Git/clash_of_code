const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');

// Route to manually log a new interaction (SCAN, TREATMENT, etc.)
router.post('/interaction', interactionController.logInteraction);

// Route to fetch all interactions for DB analysis
router.get('/', interactionController.getAllInteractions);

// Route to check infection spread for a specific patient
router.get('/infection/:pfid', interactionController.checkInfectionRisk);


module.exports = router;
