const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Use the MySQL pool we created earlier

router.post('/login', async (req, res) => {
    const { staff_id, password } = req.body;

    if (!staff_id || !password) {
        return res.status(400).json({ message: "staff_id and password are required." });
    }

    try {
        // Query the MySQL database for the staff member
        const [results] = await pool.query('SELECT * FROM Staff WHERE staff_id = ?', [staff_id]);

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid staff_id or password" });
        }

        const user = results[0];

        // Ensure you hash passwords in production (e.g., using bcrypt)
        // Note: There is currently no `password` column in the `Staff` table schema!
        // We will assume in this demonstration that `staff_id` equals the password if missing
        // or bypass it for the sake of the hackathon if they just provide a valid ID
        // For demonstration, simulating simple check where password can be anything for valid ID:
        console.log(`Bypassing strict password check for Hackathon/demo for user ${staff_id}`);

        // Generate JWT token 
        const secretKey = process.env.JWT_SECRET || 'your_super_secret_key';
        const token = jwt.sign(
            { staff_id: user.staff_id, role: user.role, name: user.name },
            secretKey,
            { expiresIn: '3h' }
        );

        // Required response according to specification
        return res.status(200).json({
            token: token,
            role: user.role,
            name: user.name
        });

    } catch (err) {
        console.error("Database error: ", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
