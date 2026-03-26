# generate_data.py — Seeds 10,000 realistic synthetic prescriptions
# Run with: python3 database/generate_data.py

import psycopg2
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

# ── 50 REALISTIC CONDITIONS WITH MEDICINES ──
CONDITIONS = {
    'Fever': ['Acetaminophen 500mg', 'Ibuprofen 400mg', 'Aspirin 325mg'],
    'Diabetes Type 2': ['Metformin 500mg', 'Metformin 1000mg', 'Glipizide 5mg', 'Sitagliptin 100mg'],
    'Hypertension': ['Amlodipine 5mg', 'Lisinopril 10mg', 'Losartan 50mg', 'Metoprolol 25mg'],
    'Upper Respiratory Infection': ['Azithromycin 250mg', 'Amoxicillin 500mg', 'Doxycycline 100mg'],
    'Seasonal Allergies': ['Cetirizine 10mg', 'Loratadine 10mg', 'Fexofenadine 180mg', 'Montelukast 10mg'],
    'Acid Reflux': ['Omeprazole 20mg', 'Pantoprazole 40mg', 'Esomeprazole 40mg', 'Ranitidine 150mg'],
    'Hypothyroidism': ['Levothyroxine 50mcg', 'Levothyroxine 100mcg', 'Levothyroxine 75mcg'],
    'Asthma': ['Salbutamol inhaler', 'Fluticasone inhaler', 'Budesonide inhaler', 'Montelukast 10mg'],
    'Migraine': ['Sumatriptan 50mg', 'Ibuprofen 600mg', 'Topiramate 25mg', 'Rizatriptan 10mg'],
    'Anxiety Disorder': ['Sertraline 50mg', 'Escitalopram 10mg', 'Buspirone 10mg', 'Clonazepam 0.5mg'],
    'Depression': ['Fluoxetine 20mg', 'Sertraline 100mg', 'Venlafaxine 75mg', 'Bupropion 150mg'],
    'Rheumatoid Arthritis': ['Ibuprofen 400mg', 'Naproxen 500mg', 'Methotrexate 7.5mg', 'Hydroxychloroquine 200mg'],
    'High Cholesterol': ['Atorvastatin 20mg', 'Rosuvastatin 10mg', 'Simvastatin 40mg', 'Pravastatin 40mg'],
    'Urinary Tract Infection': ['Ciprofloxacin 500mg', 'Nitrofurantoin 100mg', 'Trimethoprim 200mg'],
    'Skin Infection': ['Amoxicillin 500mg', 'Clindamycin 300mg', 'Cephalexin 500mg'],
    'Iron Deficiency Anemia': ['Ferrous Sulfate 325mg', 'Folic Acid 1mg', 'Vitamin B12 1000mcg'],
    'Insomnia': ['Melatonin 5mg', 'Zolpidem 10mg', 'Trazodone 50mg', 'Diphenhydramine 25mg'],
    'Influenza': ['Oseltamivir 75mg', 'Acetaminophen 500mg', 'Pseudoephedrine 60mg'],
    'Lower Back Pain': ['Cyclobenzaprine 10mg', 'Naproxen 500mg', 'Diclofenac 50mg', 'Tramadol 50mg'],
    'Vitamin D Deficiency': ['Vitamin D3 2000IU', 'Vitamin D3 5000IU', 'Calcium + D3 500mg'],
    'Obesity': ['Orlistat 120mg', 'Metformin 500mg', 'Phentermine 15mg'],
    'Gout': ['Allopurinol 100mg', 'Colchicine 0.6mg', 'Indomethacin 25mg'],
    'Eczema': ['Hydrocortisone cream 1%', 'Triamcinolone cream', 'Tacrolimus ointment'],
    'Psoriasis': ['Methotrexate 10mg', 'Cyclosporine 100mg', 'Clobetasol cream'],
    'COPD': ['Tiotropium inhaler', 'Salmeterol inhaler', 'Ipratropium inhaler'],
    'Heart Failure': ['Furosemide 40mg', 'Carvedilol 6.25mg', 'Spironolactone 25mg'],
    'Atrial Fibrillation': ['Warfarin 5mg', 'Metoprolol 50mg', 'Apixaban 5mg'],
    'Osteoporosis': ['Alendronate 70mg', 'Calcium 500mg', 'Vitamin D3 1000IU'],
    'Kidney Disease': ['Amlodipine 5mg', 'Erythropoietin 4000IU', 'Sodium Bicarbonate 650mg'],
    'Liver Disease': ['Lactulose 15ml', 'Spironolactone 100mg', 'Propranolol 40mg'],
    'Epilepsy': ['Phenytoin 100mg', 'Valproate 500mg', 'Levetiracetam 500mg'],
    'Parkinsons Disease': ['Levodopa 100mg', 'Carbidopa 25mg', 'Pramipexole 0.5mg'],
    'Alzheimers Disease': ['Donepezil 5mg', 'Memantine 10mg', 'Rivastigmine 1.5mg'],
    'Multiple Sclerosis': ['Interferon beta 30mcg', 'Glatiramer 20mg', 'Natalizumab 300mg'],
    'Lupus': ['Hydroxychloroquine 200mg', 'Prednisone 10mg', 'Azathioprine 50mg'],
    'HIV': ['Tenofovir 300mg', 'Emtricitabine 200mg', 'Efavirenz 600mg'],
    'Tuberculosis': ['Isoniazid 300mg', 'Rifampin 600mg', 'Pyrazinamide 1500mg'],
    'Malaria': ['Chloroquine 250mg', 'Artemether 20mg', 'Doxycycline 100mg'],
    'Pneumonia': ['Amoxicillin 875mg', 'Azithromycin 500mg', 'Levofloxacin 750mg'],
    'Sinusitis': ['Amoxicillin 500mg', 'Fluticasone nasal spray', 'Pseudoephedrine 60mg'],
    'Ear Infection': ['Amoxicillin 500mg', 'Ciprofloxacin ear drops', 'Ibuprofen 400mg'],
    'Eye Infection': ['Ciprofloxacin eye drops', 'Tobramycin eye drops', 'Erythromycin ointment'],
    'Gastroenteritis': ['Ondansetron 4mg', 'Loperamide 2mg', 'Oral Rehydration Salts'],
    'Appendicitis': ['Metronidazole 500mg', 'Cefazolin 1g', 'Morphine 4mg'],
    'Gallstones': ['Ursodiol 300mg', 'Ketorolac 10mg', 'Ondansetron 4mg'],
    'Kidney Stones': ['Tamsulosin 0.4mg', 'Ketorolac 30mg', 'Potassium Citrate 10mEq'],
    'Prostate Enlargement': ['Tamsulosin 0.4mg', 'Finasteride 5mg', 'Dutasteride 0.5mg'],
    'Menopause': ['Estradiol 1mg', 'Progesterone 100mg', 'Venlafaxine 37.5mg'],
    'PCOS': ['Metformin 500mg', 'Clomiphene 50mg', 'Spironolactone 100mg'],
    'Pregnancy Related': ['Folic Acid 5mg', 'Ferrous Sulfate 200mg', 'Vitamin D3 400IU'],
}

FREQUENCIES = [
    'once daily', 'twice daily', 'three times daily',
    'four times daily', 'at night', 'in the morning',
    'with meals', 'as needed', 'every 8 hours', 'every 12 hours'
]

DURATIONS = [
    '3 days', '5 days', '7 days', '10 days', '14 days',
    '1 month', '2 months', '3 months', '6 months',
    'ongoing', 'until review'
]

SPECIALIZATIONS = [
    'General Practice', 'Internal Medicine', 'Cardiology',
    'Endocrinology', 'Neurology', 'Pulmonology',
    'Gastroenterology', 'Rheumatology', 'Dermatology', 'Psychiatry'
]

# Seasonal patterns
def get_seasonal_condition(month):
    if month in [12, 1, 2, 3]:  # winter
        winter_conditions = [
            'Fever', 'Upper Respiratory Infection', 'Influenza',
            'Sinusitis', 'Pneumonia', 'Asthma'
        ]
        return random.choice(winter_conditions) if random.random() < 0.6 else random.choice(list(CONDITIONS.keys()))
    elif month in [4, 5]:  # spring
        spring_conditions = ['Seasonal Allergies', 'Sinusitis', 'Asthma', 'Eye Infection']
        return random.choice(spring_conditions) if random.random() < 0.4 else random.choice(list(CONDITIONS.keys()))
    elif month in [6, 7, 8]:  # summer
        summer_conditions = ['Gastroenteritis', 'Kidney Stones', 'Skin Infection', 'Ear Infection']
        return random.choice(summer_conditions) if random.random() < 0.4 else random.choice(list(CONDITIONS.keys()))
    return random.choice(list(CONDITIONS.keys()))

# ── CONNECT TO POSTGRESQL ──
print("Connecting to PostgreSQL...")
try:
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='scriptmd',
        user='scriptmd_user',
        password='scriptmd123'
    )
    cursor = conn.cursor()
    print("Connected!")
except Exception as e:
    print(f"Connection failed: {e}")
    print("Make sure Docker is running with docker-compose up")
    exit(1)

# ── GENERATE 10 DOCTORS ──
print("Generating doctors...")
doctors = []
for i in range(10):
    name = 'Dr. ' + fake.name()
    email = fake.unique.email()
    spec = random.choice(SPECIALIZATIONS)
    cursor.execute(
        """INSERT INTO doctors (name, email, password_hash, specialization)
           VALUES (%s, %s, %s, %s)
           ON CONFLICT (email) DO NOTHING
           RETURNING id""",
        (name, email, 'hashed_password_placeholder', spec)
    )
    result = cursor.fetchone()
    if result:
        doctors.append(result[0])

conn.commit()
print(f"Created {len(doctors)} doctors")

# ── GENERATE 500 PATIENTS ──
print("Generating patients...")
patients = []
for i in range(500):
    name = fake.name()
    email = fake.unique.email()
    age = random.randint(18, 85)
    gender = random.choice(['Male', 'Female'])
    blood_type = random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])
    cursor.execute(
        """INSERT INTO patients (name, email, password_hash, age, gender, blood_type)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (email) DO NOTHING
           RETURNING id""",
        (name, email, 'hashed_password_placeholder', age, gender, blood_type)
    )
    result = cursor.fetchone()
    if result:
        patients.append(result[0])

conn.commit()
print(f"Created {len(patients)} patients")

# ── GENERATE 10,000 PRESCRIPTIONS ──
print("Generating 10,000 prescriptions...")
start_date = datetime(2025, 1, 1)

for i in range(10000):
    doctor_id = random.choice(doctors)
    patient_id = random.choice(patients)
    days_offset = random.randint(0, 365)
    created_at = start_date + timedelta(days=days_offset)

    # Get condition based on season
    condition = get_seasonal_condition(created_at.month)
    medicine = random.choice(CONDITIONS[condition])
    frequency = random.choice(FREQUENCIES)
    duration = random.choice(DURATIONS)

    cursor.execute("""
        INSERT INTO prescriptions
        (doctor_id, patient_id, symptoms, medicine, frequency, duration, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (doctor_id, patient_id, condition, medicine, frequency, duration, created_at))

    # Print progress every 1000 records
    if (i + 1) % 1000 == 0:
        print(f"  {i + 1}/10,000 done...")
        conn.commit()

conn.commit()
cursor.close()
conn.close()
print("")
print("Successfully seeded 10,000 prescriptions!")
print("10 doctors, 500 patients, 50 conditions, realistic seasonal patterns")
print("Now connect Tableau to PostgreSQL and build your dashboards!")