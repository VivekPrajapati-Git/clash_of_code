const express = require('express');
const router = express.Router();
const neo4jController = require('../controllers/neo4jController');

// Route to generate and fetch graph data for a specific patient
router.get('/patient/:pfid', neo4jController.getPatientGraph);

module.exports = router;
