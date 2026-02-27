require('dotenv').config();
const pool = require('./config/db');
const driver = require('./config/neo4j');

// Parse CLI arguments (e.g. node sync_neo4j.js --clear --patient=PFID_A_1234)
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const patientArg = args.find(arg => arg.startsWith('--patient='));
const targetPatient = patientArg ? patientArg.split('=')[1] : null;

async function syncToNeo4j() {
    const session = driver.session();
    try {
        if (shouldClear) {
            console.log('Clearing existing Neo4j graph...');
            await session.run('MATCH (n) DETACH DELETE n');
            console.log('Neo4j graph cleared successfully.');
        }

        console.log('Connecting to MySQL and fetching Hospital Interactions...');

        let query = 'SELECT * FROM Hospital_Interactions';
        let queryParams = [];

        if (targetPatient) {
            console.log(`Filtering for interactions related to patient: ${targetPatient}`);
            // Fetch interactions where the patient is directly targeted
            query = 'SELECT * FROM Hospital_Interactions WHERE target_id = ?';
            queryParams = [targetPatient];
        }

        const [interactions] = await pool.query(query, queryParams);

        if (interactions.length === 0) {
            console.log('No interactions found in MySQL database for the specified criteria.');
            return;
        }

        console.log(`Found ${interactions.length} interactions. Syncing to Neo4j Graph...`);

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

                // If staff acted on patient, link them using the action type!
                if (isActorStaff) {
                    await session.run(`
            MATCH (a:Staff {id: $actor_id})
            MATCH (p:Patient {id: $target_id})
            MERGE (a)-[r:\`${action_type}\` {time: $timeStr}]->(p)
          `, { actor_id, target_id, timeStr });
                }
            } else {
                // Target is Equipment
                await session.run(`
          MERGE (e:Equipment {id: $target_id})
          MERGE (l:Location {id: $location_id})
          MERGE (e)-[:LOCATED_AT]->(l)
        `, { target_id, location_id });

                // If staff acted on equipment, link them using the action type!
                if (isActorStaff) {
                    await session.run(`
            MATCH (a:Staff {id: $actor_id})
            MATCH (e:Equipment {id: $target_id})
            MERGE (a)-[r:\`${action_type}\` {time: $timeStr}]->(e)
          `, { actor_id, target_id, timeStr });
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
