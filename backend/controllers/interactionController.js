const pool = require('../config/db');

exports.logInteraction = async (req, res) => {
    const { actor_id, target_id, location_id, action_type } = req.body;

    // Basic validation
    if (!actor_id || !target_id || !action_type) {
        return res.status(400).json({
            message: "Missing required fields. Please provide actor_id, target_id, and action_type."
        });
    }

    try {
        console.log(`[Interaction API] Logging new interaction: Actor(${actor_id}) -> Target(${target_id}) Action(${action_type}) at Location(${location_id || 'UNKNOWN'})`);

        const query = `
            INSERT INTO Hospital_Interactions (actor_id, target_id, location_id, action_type, timestamp) 
            VALUES (?, ?, ?, ?, NOW())
        `;

        // Pass null if location_id isn't provided (it's optional in the schema)
        const params = [actor_id, target_id, location_id || null, action_type];

        const [result] = await pool.query(query, params);

        res.status(201).json({
            message: "Interaction logged successfully.",
            data: {
                log_id: result.insertId,
                actor_id,
                target_id,
                location_id: location_id || null,
                action_type,
                timestamp: new Date().toISOString() // Approximate time for the response
            }
        });

    } catch (err) {
        console.error('[Interaction API] Database Error:', err);
        res.status(500).json({ message: "Internal server error while logging interaction", error: err.message });
    }
};

exports.getAllInteractions = async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        // Fetch recent interactions from MySQL for Detailed DB Analysis
        const query = 'SELECT * FROM Hospital_Interactions ORDER BY timestamp DESC LIMIT ?';
        const [interactions] = await pool.query(query, [parseInt(limit, 10)]);

        res.status(200).json({
            message: "Interactions retrieved successfully for DB analysis",
            data: interactions
        });
    } catch (err) {
        console.error('[Interaction API] Database Error:', err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

exports.checkInfectionRisk = async (req, res) => {
    const { pfid } = req.params;

    if (!pfid) {
        return res.status(400).json({ message: "Patient ID (pfid) is required." });
    }

    try {
        console.log(`[Interaction API] Checking infection vectors for patient: ${pfid}`);

        // 1. Find all staff who interacted with this patient (and might have caught the infection)
        const [staffExposure] = await pool.query(`
            SELECT DISTINCT actor_id as staff_id, action_type, timestamp 
            FROM Hospital_Interactions 
            WHERE target_id = ? AND actor_id != 'system_trigger'
        `, [pfid]);

        // 2. Find all locations this patient visited (surfaces might be contaminated)
        const [locationExposure] = await pool.query(`
            SELECT DISTINCT location_id, timestamp 
            FROM Hospital_Interactions 
            WHERE target_id = ? AND location_id IS NOT NULL
        `, [pfid]);

        // 3. Find other patients at risk (e.g., interacted with the same staff who were exposed)
        let atRiskPatients = [];
        if (staffExposure.length > 0) {
            const staffIds = staffExposure.map(s => s.staff_id);
            const [patientsAtRisk] = await pool.query(`
                SELECT DISTINCT target_id as pfid, actor_id as exposed_by_staff 
                FROM Hospital_Interactions 
                WHERE actor_id IN (?) AND target_id != ? AND target_id LIKE 'PFID_%'
            `, [staffIds, pfid]);
            atRiskPatients = patientsAtRisk;
        }

        res.status(200).json({
            message: `Infection trace complete for patient ${pfid}`,
            data: {
                infected_patient: pfid,
                exposed_staff: staffExposure,
                exposed_locations: locationExposure,
                potential_secondary_infections: atRiskPatients
            }
        });

    } catch (err) {
        console.error('[Interaction API] Infection Check Error:', err);
        res.status(500).json({ message: "Internal server error while tracing infection", error: err.message });
    }
};
