const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } = require('@aws-sdk/client-transcribe');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
const JWT_SECRET = process.env.JWT_SECRET || 'scriptmd-secret-key';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'scriptmd',
  user: process.env.DB_USER || 'scriptmd_user',
  password: process.env.DB_PASSWORD || 'scriptmd123',
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: 'Too many login attempts. Try again in 15 minutes.' }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION,
  credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ── ROUTE 1: Health check ──
app.get('/', (req, res) => res.json({ message: 'ScriptMD API Gateway running!' }));

// ── ROUTE 2: Verify token ──
app.get('/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, role: req.user.role, name: req.user.name, userId: req.user.userId });
});

// ── ROUTE 3: Register ──
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, accessCode } = req.body;
    if (role === 'doctor' && accessCode !== process.env.DOCTOR_ACCESS_CODE) {
      return res.status(403).json({ message: 'Invalid doctor access code!' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    if (role === 'doctor') {
      const existing = await pool.query('SELECT id FROM doctors WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already registered!' });
      await pool.query('INSERT INTO doctors (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
    } else {
      const existing = await pool.query('SELECT id FROM patients WHERE email = $1', [email]);
      if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already registered!' });
      await pool.query('INSERT INTO patients (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, hashedPassword]);
    }
    res.json({ message: 'Registered successfully!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 4: Login ──
app.post('/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null, role = null;
    const doctorResult = await pool.query('SELECT id, name, email, password_hash FROM doctors WHERE email = $1', [email]);
    if (doctorResult.rows.length > 0) { user = doctorResult.rows[0]; role = 'doctor'; }
    else {
      const patientResult = await pool.query('SELECT id, name, email, password_hash FROM patients WHERE email = $1', [email]);
      if (patientResult.rows.length > 0) { user = patientResult.rows[0]; role = 'patient'; }
    }
    if (!user) return res.status(401).json({ message: 'User not found!' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Wrong password!' });
    const token = jwt.sign({ userId: user.id, name: user.name, role: role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: role, name: user.name, userId: user.id });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 5: Add new patient — doctors only ──
// Doctor creates a patient account with temporary password
app.post('/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can add patients' });
    const { name, email, age, gender, blood_type, phone } = req.body;
    const existing = await pool.query('SELECT id FROM patients WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: 'Email already registered!' });
    // Generate temporary password — patient can change later
    const tempPassword = 'ScriptMD' + Math.floor(1000 + Math.random() * 9000);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const result = await pool.query(
      'INSERT INTO patients (name, email, password_hash, age, gender, blood_type, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email',
      [name, email, hashedPassword, age, gender, blood_type, phone]
    );
    res.json({
      message: 'Patient added successfully!',
      patient: result.rows[0],
      tempPassword: tempPassword // doctor tells patient this password
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 6: Search patients ──
app.get('/patients/search', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can search patients' });
    const { name } = req.query;
    if (!name || name.trim() === '') return res.status(400).json({ message: 'Name is required' });
    const result = await pool.query(
      'SELECT id, name, email, age, gender, blood_type, phone FROM patients WHERE name ILIKE $1 LIMIT 10',
      ['%' + name + '%']
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 7: Get patient by ID ──
app.get('/patients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, name, email, age, gender, blood_type, phone FROM patients WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 8: Get patient prescriptions ──
app.get('/patients/:id/prescriptions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'patient' && req.user.userId !== parseInt(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const response = await fetch(`http://prescription-service:8080/api/prescriptions/patient/${id}`);
    const data = await response.json();
    res.json(data);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 9: Save vitals ──
app.post('/patients/:id/vitals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can record vitals' });
    const { id } = req.params;
    const { blood_pressure, temperature, heart_rate, weight, height, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO vitals (patient_id, doctor_id, blood_pressure, temperature, heart_rate, weight, height, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, req.user.userId, blood_pressure, temperature, heart_rate, weight, height, notes]
    );
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 10: Get patient vitals ──
app.get('/patients/:id/vitals', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'patient' && req.user.userId !== parseInt(id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const result = await pool.query(
      'SELECT * FROM vitals WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 10',
      [id]
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 11: Send message to patient ──
app.post('/messages', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can send messages' });
    const { patientId, message } = req.body;
    const result = await pool.query(
      'INSERT INTO messages (from_doctor_id, to_patient_id, message) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, patientId, message]
    );
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 12: Get patient messages ──
app.get('/messages/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    if (req.user.role === 'patient' && req.user.userId !== parseInt(patientId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const result = await pool.query(
      `SELECT m.*, d.name as doctor_name FROM messages m
       JOIN doctors d ON m.from_doctor_id = d.id
       WHERE m.to_patient_id = $1 ORDER BY m.created_at DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// ── ROUTE 13: AWS Transcribe ──
app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const jobName = 'scriptmd-' + Date.now();
    const s3Key = 'audio/' + jobName + '.wav';
    await s3Client.send(new PutObjectCommand({ Bucket: process.env.AWS_S3_BUCKET, Key: s3Key, Body: req.file.buffer, ContentType: 'audio/wav' }));
    await transcribeClient.send(new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName, LanguageCode: 'en-US', MediaFormat: 'wav',
      Media: { MediaFileUri: 'https://' + process.env.AWS_S3_BUCKET + '.s3.' + process.env.AWS_REGION + '.amazonaws.com/' + s3Key }
    }));
    let done = false, text = '';
    while (!done) {
      await new Promise(r => setTimeout(r, 3000));
      const status = await transcribeClient.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
      if (status.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
        const r = await fetch(status.TranscriptionJob.Transcript.TranscriptFileUri);
        const d = await r.json();
        text = d.results.transcripts[0].transcript;
        done = true;
      } else if (status.TranscriptionJob.TranscriptionJobStatus === 'FAILED') throw new Error('Transcription failed');
    }
    res.json({ message: text });
  } catch (error) { res.status(500).json({ message: 'Transcription failed: ' + error.message }); }
});

// ── ROUTE 14: Extract medical info ──
app.post('/extract', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') return res.status(400).json({ message: 'Text is required' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch('http://nlp-service:8000/extract', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }), signal: controller.signal
    });
    clearTimeout(timeout);
    res.json(await response.json());
  } catch (error) {
    if (error.name === 'AbortError') return res.status(503).json({ message: 'NLP service timeout' });
    res.status(500).json({ message: 'Extract failed: ' + error.message });
  }
});

// ── ROUTE 15: Save prescription ──
app.post('/prescription', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors can save prescriptions' });
    const response = await fetch('http://prescription-service:8080/api/prescriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...req.body, doctorName: req.user.name })
    });
    res.json(await response.json());
  } catch (error) { res.status(500).json({ message: 'Spring Boot not reachable: ' + error.message }); }
});

// ── ROUTE 16: Get history ──
app.get('/history', authenticateToken, async (req, res) => {
  try {
    const response = await fetch('http://prescription-service:8080/api/prescriptions');
    res.json(await response.json());
  } catch (error) { res.status(500).json({ message: 'Could not fetch history' }); }
});
// ROUTE: Change password
app.post('/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    if (req.user.role === 'doctor') {
      await pool.query('UPDATE doctors SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.userId]);
    } else {
      await pool.query('UPDATE patients SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.userId]);
    }
    res.json({ message: 'Password updated!' });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
// ROUTE: Analytics
app.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const [prescriptionsOverTime, topMedicines, topSymptoms, doctorPerformance] = await Promise.all([
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM prescriptions
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
      pool.query(`
        SELECT medicine, COUNT(*) as count
        FROM prescriptions
        WHERE medicine IS NOT NULL AND medicine != ''
        GROUP BY medicine
        ORDER BY count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT symptoms, COUNT(*) as count
        FROM prescriptions
        WHERE symptoms IS NOT NULL AND symptoms != ''
        GROUP BY symptoms
        ORDER BY count DESC
        LIMIT 8
      `),
      pool.query(`
        SELECT doctor_name, 
               COUNT(*) as total_prescriptions,
               COUNT(DISTINCT patient_id) as unique_patients
        FROM prescriptions
        WHERE doctor_name IS NOT NULL
        GROUP BY doctor_name
        ORDER BY total_prescriptions DESC
      `)
    ]);

    res.json({
      prescriptionsOverTime: prescriptionsOverTime.rows,
      topMedicines: topMedicines.rows,
      topSymptoms: topSymptoms.rows,
      doctorPerformance: doctorPerformance.rows
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API Gateway running on http://localhost:' + PORT));