const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE Location ADD COLUMN current_patients INT DEFAULT 0");
        console.log("Migration successful: Added current_patients column to Location table.");
    } catch (e) {
        console.error("Migration failed or column already exists:");
        console.error(e.message);
    } finally {
        process.exit();
    }
}

migrate();
