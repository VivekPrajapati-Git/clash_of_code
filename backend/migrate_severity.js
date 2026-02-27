const pool = require('./config/db');

async function migrate() {
    try {
        await pool.query("ALTER TABLE Patients ADD COLUMN severity ENUM('Critical', 'Moderate', 'Stable') DEFAULT 'Stable'");
        console.log("Migration successful: Added severity column.");
    } catch (e) {
        console.error("Migration failed or column already exists:");
        console.error(e.message);
    } finally {
        process.exit();
    }
}

migrate();
