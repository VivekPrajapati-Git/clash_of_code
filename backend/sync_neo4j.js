require('dotenv').config();
const pool = require('./config/db');
const driver = require('./config/neo4j');

async function syncToNeo4j() {
    const session = driver.session();
    try {
        console.log('Connecting to MySQL and fetching Hospital Interactions...');
        const [interactions] = await pool.query('SELECT * FROM Hospital_Interactions');

        if (interactions.length === 0) {
            console.log('No interactions found in MySQL database.');
            return;
        }

        console.log(`Found ${interactions.length} interactions. Syncing to Neo4j Graph...`);

        // We can clear previous Neo4j graph for testing or keep it. Let's keep it since Neo4j uses MERGE 
        // which prevents duplicates. Alternatively, user might want a fresh graph. Let's just use MERGE.

        for (const log of interactions) {
            const { actor_id, target_id, location_id, action_type, timestamp } = log;
            const timeStr = timestamp.toISOString();

            // Ensure the Location node exists
            await session.run(`MERGE (l:Location {id: $location_id})`, { location_id });

            const isActorStaff = actor_id !== 'system_trigger';
            const isTargetPatient = target_id.startsWith('PFID_');

            // 1. Process Actor
            if (isActorStaff) {
                await session.run(`
          MERGE (a:Staff {id: $actor_id})
          MERGE (l:Location {id: $location_id})
          MERGE (a)-[:VISITED]->(l)
        `, { actor_id, location_id });
            }

            // 2. Process Target
            if (isTargetPatient) {
                // Target is a Patient
                await session.run(`
          MERGE (p:Patient {id: $target_id})
          MERGE (l:Location {id: $location_id})
          MERGE (p)-[:VISITED]->(l)
        `, { target_id, location_id });

                // If staff acted on patient, it's a TREATED interaction
                if (isActorStaff) {
                    await session.run(`
            MATCH (a:Staff {id: $actor_id})
            MATCH (p:Patient {id: $target_id})
            MERGE (a)-[r:TREATED {time: $timeStr, action: $action_type}]->(p)
          `, { actor_id, target_id, timeStr, action_type });
                }
            } else {
                // Target is Equipment
                await session.run(`
          MERGE (e:Equipment {id: $target_id})
          MERGE (l:Location {id: $location_id})
          MERGE (e)-[:LOCATED_AT]->(l)
        `, { target_id, location_id });

                // If staff acted on equipment, it's a USED_DEVICE interaction
                if (isActorStaff) {
                    await session.run(`
            MATCH (a:Staff {id: $actor_id})
            MATCH (e:Equipment {id: $target_id})
            MERGE (a)-[r:USED_DEVICE {time: $timeStr, action: $action_type}]->(e)
          `, { actor_id, target_id, timeStr, action_type });
                }
            }
        }

        console.log('Neo4j Data Sync Complete! Nodes and relationships generated successfully.');
    } catch (err) {
        console.error('Error syncing to Neo4j:', err);
    } finally {
        await session.close();
        await driver.close();
        await pool.end();
    }
}

syncToNeo4j();
