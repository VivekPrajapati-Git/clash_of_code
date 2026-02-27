const pool = require('../config/db');
const driver = require('../config/neo4j');

exports.getPatientGraph = async (req, res) => {
    const { pfid } = req.params;
    const { hours } = req.query; // e.g., ?hours=24

    if (!pfid) {
        return res.status(400).json({ message: "Patient ID (pfid) is required." });
    }

    const session = driver.session();

    try {
        console.log(`[Neo4j API] Fetching interactions for patient: ${pfid}, Timeframe: ${hours ? `Last ${hours} hours` : 'All time'}`);

        let query = 'SELECT * FROM Hospital_Interactions WHERE target_id = ?';
        const queryParams = [pfid];

        // Apply time-based filter if 'hours' is provided
        if (hours) {
            const parsedHours = parseInt(hours, 10);
            if (!isNaN(parsedHours) && parsedHours > 0) {
                query += ' AND timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)';
                queryParams.push(parsedHours);
            }
        }

        const [interactions] = await pool.query(query, queryParams);

        if (interactions.length === 0) {
            return res.status(404).json({ message: `No interactions found for patient ${pfid} in MySQL matching the criteria.` });
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
                        MERGE (a)-[r:\`${action_type}\` {time: $timeStr}]->(p)
                    `, { actor_id, target_id, timeStr });
                }
            }
        }

        // 3. Query Neo4j to return the graph representation for visualization
        // Fetches the entire relevant environment (Patient, Staff, Locations, Equipment)
        const result = await session.run(`
            MATCH (p:Patient {id: $pfid})
            OPTIONAL MATCH (p)-[v:VISITED]->(l:Location)
            OPTIONAL MATCH (s:Staff)-[ts]->(p)
            OPTIONAL MATCH (s)-[sv:VISITED]->(l)
            OPTIONAL MATCH (s)-[te]->(e:Equipment)
            OPTIONAL MATCH (e)-[el:LOCATED_AT]->(l)
            RETURN 
               p, 
               collect(DISTINCT v) as patient_visits, 
               collect(DISTINCT l) as locations, 
               collect(DISTINCT s) as staff, 
               collect(DISTINCT e) as equipment,
               collect(DISTINCT ts) as staff_patient_interactions, 
               collect(DISTINCT sv) as staff_visits,
               collect(DISTINCT te) as staff_equipment_interactions,
               collect(DISTINCT el) as equipment_locations
        `, { pfid });

        const record = result.records[0];
        if (!record) {
            return res.status(404).json({ message: "Graph generation failed or patient not found in graph." });
        }

        const nodesMap = new Map();
        const links = [];

        function addNode(node, label) {
            if (node && node.properties && node.properties.id) {
                nodesMap.set(node.properties.id, {
                    id: node.properties.id,
                    label: label,
                    group: label,
                    ...node.properties
                });
            }
        }

        const pNode = record.get('p');
        addNode(pNode, 'Patient');

        record.get('locations').forEach(loc => addNode(loc, 'Location'));
        record.get('staff').forEach(st => addNode(st, 'Staff'));
        record.get('equipment').forEach(eq => addNode(eq, 'Equipment'));

        // Build an internal mapping so we can link relationships by logical string IDs instead of Neo4j internal IDs
        const internalIdToLogicalId = {};

        function extractInternalIds(node) {
            if (node && node.properties && node.properties.id) {
                // Handle different versions of neo4j-driver gracefully (v4 vs v5 API elements)
                const elementId = node.elementId !== undefined ? node.elementId : (node.identity && node.identity.toNumber ? node.identity.toNumber() : node.identity);
                internalIdToLogicalId[elementId] = node.properties.id;
            }
        }

        extractInternalIds(pNode);
        record.get('locations').forEach(extractInternalIds);
        record.get('staff').forEach(extractInternalIds);
        record.get('equipment').forEach(extractInternalIds);

        function processRelationship(r) {
            if (!r) return;
            const startId = r.startNodeElementId !== undefined ? r.startNodeElementId : (r.start && r.start.toNumber ? r.start.toNumber() : r.start);
            const endId = r.endNodeElementId !== undefined ? r.endNodeElementId : (r.end && r.end.toNumber ? r.end.toNumber() : r.end);

            const source = internalIdToLogicalId[startId];
            const target = internalIdToLogicalId[endId];

            if (source && target) {
                links.push({
                    source: source,
                    target: target,
                    type: r.type,
                    ...r.properties
                });
            }
        }

        record.get('patient_visits').forEach(processRelationship);
        record.get('staff_patient_interactions').forEach(processRelationship);
        record.get('staff_visits').forEach(processRelationship);
        record.get('staff_equipment_interactions').forEach(processRelationship);
        record.get('equipment_locations').forEach(processRelationship);

        const graphData = {
            nodes: Array.from(nodesMap.values()),
            links: links
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
