const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Route to get a list of all locations
router.get('/', locationController.getAllLocations);

// Route to add a new location
router.post('/add', locationController.addLocation);

// Route to update a location (capacity or ventilation rating)
router.post('/update', locationController.updateLocation);

module.exports = router;
