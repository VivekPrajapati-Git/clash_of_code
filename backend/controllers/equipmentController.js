const pool = require('../config/db');

const equipmentController = {
    // 1. Add new equipment
    addEquipment: async (req, res) => {
        const { equip_id, status } = req.body;

        if (!equip_id) {
            return res.status(400).json({ message: "equip_id is required" });
        }

        // Validate status if provided, default to 'CLEAN'
        const initialStatus = status ? status.toUpperCase() : 'CLEAN';
        const validStatuses = ['CLEAN', 'IN_USE', 'CONTAMINATED'];

        if (!validStatuses.includes(initialStatus)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        try {
            // Check if equipment already exists
            const [existing] = await pool.query('SELECT * FROM Equipment WHERE equip_id = ?', [equip_id]);
            if (existing.length > 0) {
                return res.status(409).json({ message: "Equipment already exists" });
            }

            // Insert into Equipment table
            await pool.query(
                `INSERT INTO Equipment (equip_id, status) VALUES (?, ?)`,
                [equip_id, initialStatus]
            );

            return res.status(201).json({
                message: "Equipment added successfully",
                equipment: {
                    equip_id,
                    status: initialStatus
                }
            });
        } catch (error) {
            console.error("Error adding equipment:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 2. Update equipment status
    updateEquipmentStatus: async (req, res) => {
        const { equip_id, status } = req.body;

        if (!equip_id || !status) {
            return res.status(400).json({ message: "equip_id and status are required" });
        }

        // Validate status enum
        const newStatus = status.toUpperCase();
        const validStatuses = ['CLEAN', 'IN_USE', 'CONTAMINATED'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        try {
            // Check if equipment exists
            const [equipment] = await pool.query('SELECT * FROM Equipment WHERE equip_id = ?', [equip_id]);
            if (equipment.length === 0) {
                return res.status(404).json({ message: "Equipment not found" });
            }

            // Update status
            await pool.query(
                'UPDATE Equipment SET status = ? WHERE equip_id = ?',
                [newStatus, equip_id]
            );

            return res.status(200).json({
                message: "Equipment status updated successfully",
                equip_id: equip_id,
                new_status: newStatus
            });
        } catch (error) {
            console.error("Error updating equipment status:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },

    // 3. Get all equipment
    getAllEquipment: async (req, res) => {
        try {
            const [equipment] = await pool.query('SELECT * FROM Equipment ORDER BY equip_id ASC');

            return res.status(200).json({
                message: "Equipment retrieved successfully",
                count: equipment.length,
                equipment: equipment
            });
        } catch (error) {
            console.error("Error fetching equipment:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
};

module.exports = equipmentController;
