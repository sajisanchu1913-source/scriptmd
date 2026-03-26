-- This file runs automatically when PostgreSQL container starts
-- It creates all 4 tables we need

-- ── TABLE 1: doctors ──
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── TABLE 2: patients ──
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(50),
    blood_type VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── TABLE 3: prescriptions ──
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id),
    patient_id INTEGER REFERENCES patients(id),
    patient_name VARCHAR(255),
    doctor_name VARCHAR(255),
    symptoms TEXT,
    medicine TEXT NOT NULL,
    dosage VARCHAR(255),
    duration VARCHAR(255),
    frequency VARCHAR(255),
    original_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── TABLE 4: medicines ──
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category VARCHAR(255),
    description TEXT
);

-- ── INSERT sample medicines ──
INSERT INTO medicines (name, generic_name, category) VALUES
('Tylenol', 'Acetaminophen', 'Pain Relief'),
('Advil', 'Ibuprofen', 'Pain Relief'),
('Amoxil', 'Amoxicillin', 'Antibiotic'),
('Glucophage', 'Metformin', 'Diabetes'),
('Norvasc', 'Amlodipine', 'Blood Pressure')
ON CONFLICT DO NOTHING;