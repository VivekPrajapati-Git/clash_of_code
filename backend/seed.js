const pool = require('./config/db');

async function run() {
    try {
        await pool.query(`
      INSERT IGNORE INTO Location (location_id, floor_number, location_type, ventilation_rating, max_capacity) VALUES
      ('WARD_1A', 1, 'WARD', 8, 4),
      ('WARD_1B', 1, 'WARD', 7, 4),
      ('WARD_2A', 2, 'WARD', 9, 2),
      ('ICU_01', 3, 'ICU', 10, 1),
      ('OP_THEATER_1', 4, 'OPERATING_THEATER', 10, 1),
      ('LAB_01', 1, 'LAB', 6, 5);
    `);
        console.log('Seed data inserted successfully!');
    } catch (err) {
        console.error('Error inserting seed data:', err);
    } finally {
        process.exit();
    }
}

run();
