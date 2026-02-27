const pool = require('../config/db');
const driver = require('../config/neo4j');

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
        // Only close session if you are actually using it, but it's safe to call close
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
        // Find the patient's previous location from MySQL for the response
        const [rows] = await pool.query(
            `SELECT location_id FROM Hospital_Interactions 
             WHERE target_id = ? AND action_type = 'AUTO_TRIGGER'
             ORDER BY timestamp DESC LIMIT 1`,
            [pfid]
        );
        const previous_location = rows.length > 0 ? rows[0].location_id : 'UNKNOWN';

        // [MySQL] Insert into Hospital_Interactions Log
        await pool.query(
            `INSERT INTO Hospital_Interactions 
            (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, ?, ?, ?)`,
            ['system_trigger', pfid, new_location_id, 'AUTO_TRIGGER', new Date(timestamp)]
        );

        // [Neo4j] Create new VISITED relationship
        await session.run(
            `
            MERGE (p:Patient {pfid: $pfid})
            MERGE (l:Location {location_id: $new_location_id})
            MERGE (p)-[v:VISITED {time: $time}]->(l)
            RETURN p, v, l
            `,
            { pfid, new_location_id, time: timestamp }
        );

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
        // [MySQL] Insert into Hospital_Interactions Log
        await pool.query(
            `INSERT INTO Hospital_Interactions 
            (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, NULL, ?, ?)`,
            ['system_trigger', pfid, 'DISCHARGE', new Date(timestamp)]
        );

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
    admitPatient,
    transferPatient,
    dischargePatient
};
