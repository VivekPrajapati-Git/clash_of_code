const pool = require('../config/db');
const driver = require('../config/neo4j');

const registerPatient = async (req, res) => {
    const { pfid } = req.body || {};

    if (!pfid) {
        return res.status(400).json({ error: 'pfid is required to register a patient.' });
    }

    try {
        // [MySQL] Check if patient already exists
        const [existing] = await pool.query('SELECT * FROM Patients WHERE pfid = ?', [pfid]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Patient already exists with this pfid' });
        }

        // [MySQL] Insert into Patients table with 'STABLE' default and 'Stable' severity
        await pool.query(
            "INSERT INTO Patients (pfid, current_status, severity) VALUES (?, 'STABLE', 'Stable')",
            [pfid]
        );

        res.status(201).json({
            message: "Patient registered successfully",
            pfid
        });
    } catch (error) {
        console.error('Error registering patient:', error);
        res.status(500).json({ error: 'Internal server error while registering patient' });
    }
};

const admitPatient = async (req, res) => {
    const { pfid } = req.body || {};

    // We auto-assign the location now, so we only need pfid
    if (!pfid) {
        return res.status(400).json({ error: 'pfid is required' });
    }

    const timestamp = new Date().toISOString();
    const session = driver.session();

    try {
        // [MySQL] Find an available WARD room automatically
        const [locations] = await pool.query(
            "SELECT location_id FROM Location WHERE location_type = 'WARD' LIMIT 1"
        );

        if (locations.length === 0) {
            return res.status(404).json({ error: 'No general ward locations available' });
        }

        const location_id = locations[0].location_id;

        // [MySQL] Insert into Hospital_Interactions Log
        const [result] = await pool.query(
            `INSERT INTO Hospital_Interactions 
            (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, ?, ?, ?)`,
            ['system_trigger', pfid, location_id, 'AUTO_TRIGGER', new Date(timestamp)]
        );

        // [Neo4j] Create VISITED relationship
        await session.run(
            `
            MERGE (p:Patient {pfid: $pfid})
            MERGE (l:Location {location_id: $location_id})
            MERGE (p)-[v:VISITED {time: $time}]->(l)
            RETURN p, v, l
            `,
            { pfid, location_id, time: timestamp }
        );

        // Emit real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('patient_admitted', { pfid, location: location_id, timestamp });
        }

        res.status(200).json({
            message: "Patient admitted successfully (Auto-assigned room)",
            pfid,
            location: location_id,
            timestamp
        });

    } catch (error) {
        console.error('Error admitting patient:', error);
        res.status(500).json({ error: 'Internal server error while admitting patient' });
    } finally {
        await session.close();
    }
};

const transferPatient = async (req, res) => {
    const { pfid, new_location_id } = req.body || {};

    if (!pfid || !new_location_id) {
        return res.status(400).json({ error: 'pfid and new_location_id are required' });
    }

    const timestamp = new Date().toISOString();
    const session = driver.session();

    try {
        const [rows] = await pool.query(
            `SELECT location_id FROM Hospital_Interactions 
             WHERE target_id = ? AND action_type = 'AUTO_TRIGGER'
             ORDER BY timestamp DESC LIMIT 1`,
            [pfid]
        );
        const previous_location = rows.length > 0 ? rows[0].location_id : 'UNKNOWN';

        await pool.query(
            `INSERT INTO Hospital_Interactions 
            (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, ?, ?, ?)`,
            ['system_trigger', pfid, new_location_id, 'AUTO_TRIGGER', new Date(timestamp)]
        );

        await session.run(
            `
            MERGE (p:Patient {pfid: $pfid})
            MERGE (l:Location {location_id: $new_location_id})
            MERGE (p)-[v:VISITED {time: $time}]->(l)
            RETURN p, v, l
            `,
            { pfid, new_location_id, time: timestamp }
        );

        // Emit real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('patient_transferred', { pfid, previous_location, new_location: new_location_id, timestamp });
        }

        res.status(200).json({
            message: "Transfer successful",
            previous_location,
            new_location: new_location_id
        });

    } catch (error) {
        console.error('Error transferring patient:', error);
        res.status(500).json({ error: 'Internal server error while transferring patient' });
    } finally {
        await session.close();
    }
};

const dischargePatient = async (req, res) => {
    const { pfid } = req.body || {};

    if (!pfid) {
        return res.status(400).json({ error: 'pfid is required' });
    }

    const timestamp = new Date().toISOString();

    try {
        await pool.query(
            `INSERT INTO Hospital_Interactions 
            (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, NULL, ?, ?)`,
            ['system_trigger', pfid, 'DISCHARGE', new Date(timestamp)]
        );

        // Emit real-time update
        if (req.app.get('io')) {
            req.app.get('io').emit('patient_discharged', { pfid, timestamp });
        }

        res.status(200).json({
            message: "Patient discharged",
            pfid
        });

    } catch (error) {
        console.error('Error discharging patient:', error);
        res.status(500).json({ error: 'Internal server error while discharging patient' });
    }
};

module.exports = {
    registerPatient,
    admitPatient,
    transferPatient,
    dischargePatient
};
