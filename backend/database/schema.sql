-- SQL Schema: The "Source of Truth"
-- This database acts as your Audit Trail. Every physical movement or system trigger is logged here in strict chronological order.

CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- Table: Staff
CREATE TABLE IF NOT EXISTS Staff (
    staff_id VARCHAR(50) PRIMARY KEY, -- Unique identifier (e.g., DOC_101, NUR_202)
    name VARCHAR(255) NOT NULL,       -- Full Name
    role ENUM('DOCTOR', 'NURSE', 'CLEANER', 'WARD_BOY', 'LAB_TECH') NOT NULL
);

-- Table: Patients
CREATE TABLE IF NOT EXISTS Patients (
    pfid VARCHAR(50) PRIMARY KEY,     -- The Patient's unique ID used as the Link Key
    current_status ENUM('STABLE', 'ISOLATED', 'CRITICAL') NOT NULL
);

-- Table: Equipment
CREATE TABLE IF NOT EXISTS Equipment (
    equip_id VARCHAR(50) PRIMARY KEY, -- ID for machines (Ventilators, X-Ray)
    status ENUM('CLEAN', 'IN_USE', 'CONTAMINATED') NOT NULL
);

-- Table: Location
-- This table defines the physical layout of the hospital. It allows the Neo4j Graph to visualize "Hot Zones" where infections are spreading.
CREATE TABLE IF NOT EXISTS Location (
    location_id VARCHAR(50) PRIMARY KEY, -- Unique ID for every room/ward (e.g., WARD_4A, ICU_02)
    floor_number INT NOT NULL,           -- To track vertical spread between floors
    location_type ENUM('WARD', 'ICU', 'OPERATING_THEATER', 'LAB', 'CAFETERIA') NOT NULL,
    ventilation_rating INT NOT NULL,     -- A score from 1-10. AI Engine uses this; poor ventilation = higher spread risk
    max_capacity INT NOT NULL            -- To detect "Crowding" anomalies
);

-- Table: Hospital_Interactions (The Timeline)
CREATE TABLE IF NOT EXISTS Hospital_Interactions (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT, -- For strict sequential tracking
    actor_id VARCHAR(50) NOT NULL,            -- staff_id or system_trigger
    target_id VARCHAR(50) NOT NULL,           -- pfid or equip_id
    location_id VARCHAR(50),                  -- Ward/Floor number
    action_type VARCHAR(100) NOT NULL,        -- SCAN, TREATMENT, AUTO_TRIGGER, DOCTOR_VERIFY
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP -- Server-side captured time
);
