const pool = require('./config/db');

// Random helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Parse CLI arguments (e.g. node seed.js --patients=10 --equip=5 --interactions=50)
const args = process.argv.slice(2);
const getArg = (key, defaultVal) => {
    const match = args.find(arg => arg.startsWith(`--${key}=`));
    return match ? parseInt(match.split('=')[1], 10) : defaultVal;
};

const numPatients = getArg('patients', 4);
const numEquipment = getArg('equip', 13);
const numInteractions = getArg('interact', 20);

async function run() {
    try {
        console.log('--- Database Seeding Started ---');
        console.log(`Generating: ${numPatients} Patients, ${numEquipment} Equipment, ${numInteractions} Interactions`);

        // 1. Clear existing generic data (Optional, commented out by default so it doesn't wipe real data later)
        // await pool.query('DELETE FROM Hospital_Interactions');
        // await pool.query('DELETE FROM Patients');
        // await pool.query('DELETE FROM Equipment');
        // console.log('Previous mock data cleared.');

        // 2. Seed Locations & Staff (IGNORE if already exists)
        await pool.query(`
            INSERT IGNORE INTO Location (location_id, floor_number, location_type, ventilation_rating, max_capacity) VALUES
            ('WARD_1A', 1, 'WARD', 8, 4),
            ('WARD_1B', 1, 'WARD', 7, 4),
            ('WARD_2A', 2, 'WARD', 9, 2),
            ('ICU_01', 3, 'ICU', 10, 1),
            ('OP_THEATER_1', 4, 'OPERATING_THEATER', 10, 1),
            ('LAB_01', 1, 'LAB', 6, 5);
        `);

        await pool.query(`
            INSERT IGNORE INTO Staff (staff_id, name, role) VALUES
            ('DOC_101', 'Dr. Alice Smith', 'DOCTOR'),
            ('NUR_202', 'Nurse Bob Jones', 'NURSE'),
            ('ADM_303', 'Admin Carol', 'WARD_BOY'),
            ('CLN_404', 'Cleaner Dave', 'CLEANER'),
            ('TECH_505','Tech Eve','LAB_TECH');
        `);
        console.log('Core Infrastructure (Locations & Staff) ensured.');

        // 3. Generate New Unique Patients & Equipment
        const runId = Date.now().toString().slice(-4); // Unique suffix for this run
        const newPatients = Array.from({ length: numPatients }, (_, i) => `PFID_${runId}_${i + 1}`);
        const newEquipment = Array.from({ length: numEquipment }, (_, i) => `EQIP_${runId}_${i + 1}`);

        // Insert Patients
        for (const pfid of newPatients) {
            const status = randomItem(['STABLE', 'STABLE', 'ISOLATED', 'CRITICAL']);
            await pool.query(`INSERT INTO Patients (pfid, current_status) VALUES (?, ?)`, [pfid, status]);
        }

        // Insert Equipment
        for (const eqid of newEquipment) {
            const status = randomItem(['CLEAN', 'IN_USE', 'CONTAMINATED']);
            await pool.query(`INSERT INTO Equipment (equip_id, status) VALUES (?, ?)`, [eqid, status]);
        }
        console.log(`Generated ${newPatients.length} Patients and ${newEquipment.length} Equipments.`);

        // 4. Generate Random Interactive Timeline (Interactions)
        if (numInteractions > 0) {
            console.log(`Generating ${numInteractions} random interactions timeline...`);

            const staffs = ['DOC_101', 'NUR_202', 'ADM_303', 'CLN_404', 'TECH_505', 'system_trigger'];
            const locations = ['WARD_1A', 'WARD_1B', 'WARD_2A', 'ICU_01', 'OP_THEATER_1', 'LAB_01'];
            const actionTypes = ['SCAN', 'TREATMENT', 'CHECKUP', 'CLEANING', 'TRANSFER'];

            // Combine all available targets
            let targets = [...newPatients, ...newEquipment];

            // Fallback: If no new targets generated this run, fetch from DB to log against
            if (targets.length === 0) {
                const [dbPatients] = await pool.query('SELECT pfid AS id FROM Patients LIMIT 50');
                const [dbEquip] = await pool.query('SELECT equip_id AS id FROM Equipment LIMIT 50');
                targets = [...dbPatients.map(p => p.id), ...dbEquip.map(e => e.id)];
            }

            if (targets.length === 0) {
                console.log("No targets (Patients or Equipment) available to log interactions for.");
            } else {
                const now = new Date();
                const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

                for (let i = 0; i < numInteractions; i++) {
                    const actor = randomItem(staffs);
                    const target = randomItem(targets);
                    const loc = randomItem(locations);
                    let action = randomItem(actionTypes);

                    // Logic tweaks for realism
                    if (actor === 'CLN_404') action = 'CLEANING';
                    if (actor === 'system_trigger') action = 'AUTO_TRIGGER';
                    if (actor === 'DOC_101' && target.startsWith('PFID')) action = 'DOCTOR_VERIFY';

                    const time = randomDate(threeDaysAgo, now);

                    await pool.query(
                        `INSERT INTO Hospital_Interactions (actor_id, target_id, location_id, action_type, timestamp) VALUES (?, ?, ?, ?, ?)`,
                        [actor, target, loc, action, time]
                    );
                }
                console.log(`${numInteractions} historical interactions injected successfully!`);
            }
        }

        console.log('--- Database Seeding Complete ---');

    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        process.exit();
    }
}

run();


// node seed.js --patients=10 --equip=0 --interact=2