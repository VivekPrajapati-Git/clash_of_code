const pool = require('../config/db');

const locationController = {
    // 1. Add a new location
    addLocation: async (req, res) => {
        const { location_id, floor_number, location_type, ventilation_rating, max_capacity } = req.body;

        if (!location_id || floor_number === undefined || !location_type || ventilation_rating === undefined || max_capacity === undefined) {
            return res.status(400).json({ message: "location_id, floor_number, location_type, ventilation_rating, and max_capacity are all required" });
        }

        // Validate location_type enum
        const type = location_type.toUpperCase();
        const validTypes = ['WARD', 'ICU', 'OPERATING_THEATER', 'LAB', 'CAFETERIA'];

        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: `Invalid location_type. Must be one of: ${validTypes.join(', ')}` });
        }

        try {
            // Check if location already exists
            const [existing] = await pool.query('SELECT * FROM Location WHERE location_id = ?', [location_id]);
            if (existing.length > 0) {
                return res.status(409).json({ message: "Location already exists" });
            }

            // Insert into Location table
            await pool.query(
                `INSERT INTO Location (location_id, floor_number, location_type, ventilation_rating, max_capacity) 
                 VALUES (?, ?, ?, ?, ?)`,
                [location_id, floor_number, type, ventilation_rating, max_capacity]
            );

            return res.status(201).json({
                message: "Location added successfully",
                location: {
                    location_id,
                    floor_number,
                    location_type: type,
                    ventilation_rating,
                    max_capacity,
                    current_patients: 0
                }
            });
        } catch (error) {
            console.error("Error adding location:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 2. Update location details (e.g., ventilation rating or capacity)
    updateLocation: async (req, res) => {
        const { location_id, ventilation_rating, max_capacity } = req.body;

        if (!location_id) {
            return res.status(400).json({ message: "location_id is required" });
        }

        if (ventilation_rating === undefined && max_capacity === undefined) {
            return res.status(400).json({ message: "Provide either ventilation_rating or max_capacity to update" });
        }

        try {
            // Check if location exists
            const [locationRows] = await pool.query('SELECT * FROM Location WHERE location_id = ?', [location_id]);
            if (locationRows.length === 0) {
                return res.status(404).json({ message: "Location not found" });
            }

            const existingLocation = locationRows[0];
            const updatedVentilation = ventilation_rating !== undefined ? ventilation_rating : existingLocation.ventilation_rating;
            const updatedCapacity = max_capacity !== undefined ? max_capacity : existingLocation.max_capacity;

            // Update attributes
            await pool.query(
                'UPDATE Location SET ventilation_rating = ?, max_capacity = ? WHERE location_id = ?',
                [updatedVentilation, updatedCapacity, location_id]
            );

            return res.status(200).json({
                message: "Location updated successfully",
                location: {
                    location_id,
                    ventilation_rating: updatedVentilation,
                    max_capacity: updatedCapacity
                }
            });
        } catch (error) {
            console.error("Error updating location:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 3. Get all locations
    getAllLocations: async (req, res) => {
        try {
            const [locations] = await pool.query('SELECT * FROM Location ORDER BY floor_number, location_id ASC');

            return res.status(200).json({
                message: "Locations retrieved successfully",
                count: locations.length,
                locations: locations
            });
        } catch (error) {
            console.error("Error fetching locations:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

module.exports = locationController;
