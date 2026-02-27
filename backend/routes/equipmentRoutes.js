const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');

// Route to get a list of all equipment
router.get('/', equipmentController.getAllEquipment);

// Route to add a new piece of equipment
router.post('/add', equipmentController.addEquipment);

// Route to update equipment status (e.g. CLEAN -> IN_USE or CONTAMINATED)
router.post('/status', equipmentController.updateEquipmentStatus);

module.exports = router;
