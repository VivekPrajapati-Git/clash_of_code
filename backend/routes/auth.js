const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // You might need to install this: npm i jsonwebtoken
const db = require('../config/db.js')

// Replace this with your actual database connection pool/instance
// const db = require('../utils/db');

router.post('/login', (req, res) => {
    const { staff_id, password } = req.body;

    if (!staff_id || !password) {
        return res.status(400).json({ message: "staff_id and password are required." });
    }

    // Replace `db` with your actual MySQL connection variables.
    // Ensure you handle DB connection errors appropriately here.
    const query = 'SELECT * FROM staff WHERE staff_id = ?';

    db.query(query, [staff_id], (err, results) => {
        if (err) {
            console.error("Database error: ", err);
            return res.status(500).json({ message: "Internal server error" });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid staff_id or password" });
        }

        const user = results[0];

        // Ensure you hash passwords in production (e.g., using bcrypt)
        // Here we just use a simple string comparison for clarity
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid staff_id or password" });
        }

        // Generate JWT token 
        const secretKey = process.env.JWT_SECRET || 'your_super_secret_key'; // Use env variable in prod
        const token = jwt.sign(
            { staff_id: user.staff_id, role: user.role, name: user.name },
            secretKey,
            { expiresIn: '1h' }
        );

        // Required response according to specification
        return res.status(200).json({
            token: token,
            role: user.role,
            name: user.name
        });
    });

    // Placeholder logic so syntax is valid if not uncommented yet.
    res.status(501).json({ message: "Database query logic is currently commented out. Please configure your MySQL connection." });
});

module.exports = router;
