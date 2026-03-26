# ScriptMD 💊 — AI-Powered Voice Prescription System

> Convert doctor’s voice into structured digital prescriptions using AI + microservices architecture

---

## 🚀 Live Demo

Run locally:

```bash
docker-compose up
```

Open:

```
http://localhost:5173
```

---

## 🧠 One-Line Pitch

ScriptMD converts doctor speech into structured prescriptions using AI (Groq Llama 3), standardizes medicines with RxNorm, and stores everything in a microservices architecture with analytics on 10,000+ records.

---

## 🏗️ Architecture

Doctor speaks → React (Voice Capture) → Node.js API Gateway →
Python NLP (Groq AI + RxNorm) → Spring Boot → PostgreSQL → Patient Portal

---

## ⚙️ Tech Stack

### Frontend

* React + Vite
* Web Speech API (dev fallback)
* Recharts (real-time UI charts)

### Backend

* Node.js + Express (API Gateway)
* JWT Authentication + RBAC
* bcrypt (password hashing)
* Rate limiting (login protection)

### AI / NLP Service

* Python + FastAPI
* Groq Llama 3 (medical extraction)
* RxNorm API (medicine standardization)

### Prescription Service

* Java Spring Boot
* iText (PDF generation)
* JPA/Hibernate

### Database

* PostgreSQL
* 10,000 seeded prescription records

### DevOps

* Docker + docker-compose
* Microservices architecture

---

## 🔥 Key Features

### 👨‍⚕️ Doctor Features

* Voice-to-prescription in seconds
* AI extracts:

  * Symptoms
  * Medicines
  * Diagnosis
  * Allergies
  * Doctor notes
  * Follow-up
  * Vitals (BP, temperature, heart rate, weight)
* Add & search patients
* Record vitals
* Send messages to patients

### 🧑‍💻 Patient Features

* Patient portal with sidebar navigation
* View prescriptions & history
* View vitals
* Receive doctor messages
* Change password

### 🔐 Security

* JWT authentication (24h expiry)
* Role-based access (doctor vs patient)
* bcrypt password hashing
* Rate limiting (10 login attempts / 15 min)

---

## 📊 Analytics

* 10,000 synthetic records with realistic patterns
* 50+ medical conditions
* Seasonal disease distribution
* Advanced SQL queries:

  * CTEs
  * Window functions
* Tableau dashboards (4 dashboards)

---

## 🧪 Testing

```bash
cd backend/nlp-service
pytest tests/test_extract.py -v
```

✅ 6 tests — 100% passing

---

## 🧬 Database Features

* PostgreSQL persistent storage
* Tables:

  * doctors
  * patients
  * prescriptions
  * vitals
  * messages

---

## 🔄 API Highlights

* Authentication (register, login, JWT verify)
* Patient CRUD + search
* Vitals recording & retrieval
* Messaging system
* AI extraction endpoint
* Prescription service integration

---

## 📈 Advanced Features (Portfolio Boost)

* Microservices architecture (4+ services)
* AI + healthcare integration
* Real-time + batch analytics
* SQL (window functions, CTEs)
* Dockerized system
* 10k dataset simulation

---

## 🚧 Next Steps

* Deploy to AWS EC2
* Kafka (event streaming for prescriptions)
* Airflow (ETL pipelines)
* Data warehouse (OLAP separation)
* CI/CD pipeline

---

## 👩‍💻 Author

**Sajitha Mathi**
MS Computer Engineering — NYU

GitHub: https://github.com/sajisanchu1913-source

---

## ⭐ Why This Project Stands Out

* Real-world healthcare problem
* End-to-end system (frontend → AI → backend → DB → analytics)
* Covers **SWE + Data + AI + Systems design**
* Production-style architecture (microservices + Docker)

---
