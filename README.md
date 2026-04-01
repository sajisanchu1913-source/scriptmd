# ScriptMD 💊 — AI-Powered Voice Prescription System

> Convert a doctor's voice into structured digital prescriptions using LLM-based NLP, built with a microservices architecture and real-time clinical analytics.

**Live Demo:** http://13.232.88.58:5173  
**Author:** Sajitha Mathi | sm12344@nyu.edu  
**Stack:** React · Node.js · Python · Spring Boot · PostgreSQL · Docker · AWS EC2 · Apache Airflow · Apache Superset

---

## 🎯 Problem Statement

Doctors spend 30–40% of their time on administrative tasks like writing prescriptions manually. Transcription errors cause 1.5 million medication injuries annually in the US. ScriptMD solves this by letting doctors **speak naturally** while AI extracts structured prescription data automatically.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                    React.js (Port 5173)                      │
│         Voice Recording · Dashboard · Analytics              │
└─────────────────────┬───────────────────────────────────────┘
                       │
┌─────────────────────▼───────────────────────────────────────┐
│                    API GATEWAY (Node.js)                      │
│              Authentication · Routing · REST API              │
│                        Port 3000                             │
└──────┬──────────────┬──────────────────┬────────────────────┘
       │              │                  │
┌──────▼──────┐ ┌─────▼──────┐ ┌────────▼────────┐
│ NLP Service │ │Prescription│ │   PostgreSQL     │
│  (Python)   │ │  Service   │ │   Database       │
│  Port 8000  │ │(Spring Boot)│ │   Port 5432      │
│  Groq LLM   │ │  Port 8080  │ │ 500 patients     │
│  Extraction │ │    JPA     │ │ 10,000 Rx        │
└─────────────┘ └────────────┘ └────────┬─────────┘
                                         │
                              ┌──────────▼──────────┐
                              │   DATA PIPELINE      │
                              │  Apache Airflow DAG  │
                              │  (Production-ready)  │
                              │  → Analytics Tables  │
                              │  Apache Superset     │
                              │  BI Dashboards       │
                              └─────────────────────┘
```

---

## ✨ Features

### Doctor Dashboard
- 🎤 **Voice Recording** — Browser-based speech recognition captures doctor's speech
- 🤖 **AI Extraction** — Groq LLaMA extracts medicine, symptoms, dosage, duration, frequency
- 👥 **Patient Management** — Search 500+ patients, add new patients, assign temp passwords
- 🩺 **Vitals Recording** — Blood pressure, temperature, heart rate, weight, height
- 💊 **Prescription Saving** — Structured data saved to PostgreSQL via Spring Boot
- 💬 **Patient Messaging** — Send messages directly to patients
- 📊 **Analytics Dashboard** — Real-time charts built with Recharts

### Patient Portal
- 📋 Prescription history
- 🩺 Vitals history
- 💊 Medication tracker
- 💬 Messages from doctor
- ⚙️ Password management

### Analytics Dashboard
- 📈 Prescriptions over time (line chart)
- 💊 Top 10 most prescribed medicines (bar chart)
- 🏥 Top symptoms/diseases (horizontal bar chart)
- 👨‍⚕️ Doctor performance metrics (table)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js + Recharts | UI + analytics visualization |
| API Gateway | Node.js + Express | Authentication, routing, REST API |
| NLP Service | Python + FastAPI + Groq | LLM-based medical data extraction |
| Prescription Service | Spring Boot + JPA | Prescription persistence |
| Database | PostgreSQL 16 | OLTP — live patient/prescription data |
| Containerization | Docker + Docker Compose | Orchestrates 7 services |
| Cloud | AWS EC2 (t2.micro) | Production deployment |
| BI Dashboard | Apache Superset | Executive-level clinical analytics |
| AI Model | Groq LLaMA 3 | Fast medical NLP inference |

---

## 📊 Data Engineering Pipeline

```
Prescriptions (OLTP) → Airflow DAG → Analytics Tables (OLAP) → Superset Dashboards
```

**Design Decision:** At clinic scale (500 patients, 10,000 prescriptions), the React analytics dashboard queries PostgreSQL directly in real-time — instant updates, no latency.

**For hospital-network scale** (millions of records), the Airflow DAG (`scriptmd_nightly_etl`) is production-ready and would trigger at 00:00 UTC daily to:
- Aggregate `daily_prescription_counts`
- Compute `top_medications` rankings
- Track `disease_trends` by month
- Calculate `doctor_performance` metrics

**Why separate OLTP and OLAP at scale?**
Direct analytics queries on a live prescription database slow down real-time operations. Pre-aggregated analytics tables ensure dashboards load instantly without impacting doctors using the live system.

---

## 🗄️ Database Schema

```sql
patients        — id, name, email, age, gender, blood_type, phone
doctors         — id, name, email, specialization
prescriptions   — id, patient_id, doctor_id, medicine, symptoms, duration, frequency, created_at
vitals          — id, patient_id, blood_pressure, temperature, heart_rate, weight, height
messages        — id, patient_id, doctor_id, message, created_at

-- Analytics (populated by Airflow at scale)
daily_prescription_counts
top_medications
disease_trends
doctor_performance
```

**Dataset:** 500 patients · 10 doctors · 10,000 prescriptions · 50 conditions with realistic seasonal patterns

---

## 🚀 Getting Started

### Prerequisites
- Docker Desktop
- Python 3.11+

### Local Setup

```bash
# Clone the repo
git clone https://github.com/sajisanchu1913-source/scriptmd.git
cd scriptmd

# Create .env file
touch .env
# Add: GROQ_API_KEY=your_key_here

# Start all 7 services
docker-compose up --build

# Seed the database with 10,000 prescriptions
python3 database/generate_data.py
```

**App runs at:** http://localhost:5173

### Default Credentials
- **Doctor Access Code:** `SCRIPTMD2026`
- Register a new doctor account using the access code

---

## 🌐 Deployment

App deployed on **AWS EC2 (t2.micro, Mumbai region)**:

| Service | URL |
|---|---|
| Frontend | http://13.232.88.58:5173 |
| API Gateway | http://13.232.88.58:3000 |
| Superset | http://13.232.88.58:8088 |

> **Note:** Voice recording requires HTTPS. For full demo including voice features, run locally at `http://localhost:5173`.

---

## 📁 Project Structure

```
scriptmd/
├── frontend/                   # React.js app
│   └── src/
│       ├── App.jsx             # Doctor dashboard + analytics
│       └── Login.jsx           # Auth UI
├── backend/
│   ├── api-gateway/            # Node.js — auth, routing, REST
│   ├── nlp-service/            # Python — Groq LLM extraction
│   └── prescription-service/   # Spring Boot — JPA persistence
├── database/
│   ├── init.sql                # Schema
│   ├── generate_data.py        # Seeds 10,000 prescriptions
│   └── queries.sql             # Analytics SQL queries
├── airflow/
│   └── dags/
│       └── scriptmd_etl.py     # Production-ready nightly ETL DAG
├── docker/
│   └── superset/               # Custom Superset image with PostgreSQL driver
└── docker-compose.yml          # 7-service orchestration
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register doctor/patient |
| POST | `/auth/login` | Login |
| GET | `/auth/verify` | Verify JWT token |
| GET | `/patients/search` | Search patients by name |
| POST | `/patients` | Add new patient |
| POST | `/patients/:id/vitals` | Record vitals |
| POST | `/extract` | AI prescription extraction |
| POST | `/prescription` | Save prescription |
| GET | `/analytics` | Real-time analytics data |
| POST | `/messages` | Send message to patient |

---

## 🧪 Testing

```bash
# Run Python NLP tests
cd backend/nlp-service
pytest tests/

# Test API
curl http://localhost:3000/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"test123"}'
```

---

## 📈 Future Improvements

- **HTTPS/SSL** via AWS Certificate Manager for production voice recording
- **Kafka** event streaming for prescription events at hospital-network scale
- **dbt** data models for complex analytics transformations
- **WebSockets** for real-time prescription count updates
- **PDF export** for printable prescriptions
- - **Apache Airflow** ETL pipeline for nightly batch aggregation at hospital-network scale (DAG designed, integration in progress)

---

## 👩‍💻 Author

**Sajitha Mathi**
MS Computer Engineering @ NYU
sm12344@nyu.edu
[GitHub](https://github.com/sajisanchu1913-source) · [LinkedIn](https://linkedin.com/in/sajitha-mathi)

---

*Built as a full-stack + data engineering portfolio project demonstrating microservices architecture, LLM integration, ETL pipeline design, and cloud deployment.*
