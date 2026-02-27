const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/controller');

/**
 * POST /api/presence/register
 * Registers a new patient into the system without admitting them to a room.
 */
router.post('/register', presenceController.registerPatient);

/**
 * POST /api/presence/admit
 * Admits a patient into a ward.
 */
router.post('/admit', presenceController.admitPatient);

/**
 * POST /api/presence/transfer
 * Transfers a patient to a new ward.
 */
router.post('/transfer', presenceController.transferPatient);

/**
 * POST /api/presence/discharge
 * Discharges a patient.
 */
router.post('/discharge', presenceController.dischargePatient);

module.exports = router;
