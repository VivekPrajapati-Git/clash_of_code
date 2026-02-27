const pool = require('../config/db');
const driver = require('../config/neo4j');

exports.getPatientGraph = async (req, res) => {
    const { pfid } = req.params;

    if (!pfid) {
        return res.status(400).json({ message: "Patient ID (pfid) is required." });
    }

    const session = driver.session();

    try {
        console.log(`[Neo4j API] Fetching interactions for patient: ${pfid}`);

        // 1. Fetch Interactions from MySQL matching the target patient
        // We get interactions where target_id = pfid OR interactions by actors who touched the patient
        // For simplicity, we get all interactions where target_id = pfid
        const [interactions] = await pool.query(
            'SELECT * FROM Hospital_Interactions WHERE target_id = ?',
            [pfid]
        );

        if (interactions.length === 0) {
            return res.status(404).json({ message: `No interactions found for patient ${pfid} in MySQL.` });
        }

        console.log(`[Neo4j API] Syncing ${interactions.length} interactions to Neo4j...`);

        // 2. Create the graph in Neo4j
        // We'll clear the old patient data first so we don't duplicate relationships with different timestamps unnecessarily (optional)
        // Let's just use MERGE to gracefully handle updates

        for (const log of interactions) {
            const { actor_id, target_id, location_id, action_type, timestamp } = log;
            const timeStr = timestamp.toISOString();

            // Ensure Location exists
            await session.run(`MERGE (l:Location {id: $location_id})`, { location_id });

            const isActorStaff = actor_id !== 'system_trigger';
            const isTargetPatient = target_id.startsWith('PFID_') || target_id === pfid;

            // Process Actor (Staff)
            if (isActorStaff) {
                await session.run(`
                  MERGE (a:Staff {id: $actor_id})
                  MERGE (l:Location {id: $location_id})
                  MERGE (a)-[:VISITED]->(l)
                `, { actor_id, location_id });
            }

            // Process Target (Patient)
            if (isTargetPatient) {
                await session.run(`
                  MERGE (p:Patient {id: $target_id})
                  MERGE (l:Location {id: $location_id})
                  MERGE (p)-[:VISITED]->(l)
                `, { target_id, location_id });

                if (isActorStaff) {
                    await session.run(`
                        MATCH (a:Staff {id: $actor_id})
                        MATCH (p:Patient {id: $target_id})
                        MERGE (a)-[r:TREATED {time: $timeStr, action: $action_type}]->(p)
                    `, { actor_id, target_id, timeStr, action_type });
                }
            }
        }

        // 3. Query Neo4j to return the graph representation for visualization
        // Fetches the patient, the staff who treated them, and the locations they visited
        const result = await session.run(`
            MATCH (p:Patient {id: $pfid})
            OPTIONAL MATCH (p)-[v:VISITED]->(l:Location)
            OPTIONAL MATCH (s:Staff)-[t:TREATED]->(p)
            OPTIONAL MATCH (s)-[sv:VISITED]->(l)
            RETURN p, collect(DISTINCT v) as patient_visits, collect(DISTINCT l) as locations, collect(DISTINCT s) as staff, collect(DISTINCT t) as treatments, collect(DISTINCT sv) as staff_visits
        `, { pfid });

        const record = result.records[0];
        if (!record) {
            return res.status(404).json({ message: "Graph generation failed or patient not found in graph." });
        }

        const graphData = {
            patient: record.get('p').properties,
            locations: record.get('locations').map(loc => loc.properties),
            staff: record.get('staff').map(st => st.properties),
            relationships: {
                treatments: record.get('treatments').map(t => ({
                    type: t.type,
                    properties: t.properties,
                    // Neo4j integer mapping
                    startNodeId: t.start.toNumber ? t.start.toNumber() : t.start,
                    endNodeId: t.end.toNumber ? t.end.toNumber() : t.end
                })),
                patientVisits: record.get('patient_visits').map(v => ({
                    type: v.type,
                    properties: v.properties,
                    startNodeId: v.start.toNumber ? v.start.toNumber() : v.start,
                    endNodeId: v.end.toNumber ? v.end.toNumber() : v.end
                }))
            }
        };

        res.status(200).json({
            message: `Neo4j graph successfully synced and retrieved for patient ${pfid}`,
            data: graphData
        });

    } catch (err) {
        console.error('[Neo4j API] Error:', err);
        res.status(500).json({ message: "Internal server error during Neo4j sync", error: err.message });
    } finally {
        await session.close();
    }
};
