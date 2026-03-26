from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
import os, json, re, requests

load_dotenv()
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

class TextInput(BaseModel):
    text: str

def get_standard_medicine_name(medicine_name):
    try:
        search_url = f'https://rxnav.nlm.nih.gov/REST/rxcui.json?name={medicine_name}&search=2'
        response = requests.get(search_url, timeout=3)
        data = response.json()
        rxcui = data.get('idGroup', {}).get('rxnormId', [])
        if not rxcui:
            return medicine_name.capitalize()
        name_url = f'https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui[0]}/property.json?propName=RxNorm%20Name'
        name_response = requests.get(name_url, timeout=3)
        name_data = name_response.json()
        properties = name_data.get('propConceptGroup', {}).get('propConcept', [])
        if properties:
            return properties[0].get('propValue', medicine_name).capitalize()
        return medicine_name.capitalize()
    except:
        return medicine_name.capitalize()

@app.get('/')
def home():
    return {'message': 'NLP Service running!'}

@app.post('/extract')
def extract(input: TextInput):
    try:
        response = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {
                    'role': 'system',
                    'content': '''You are a medical NLP assistant.
                    Extract from doctor speech. Return ONLY valid JSON:
                    {
                      "symptoms": ["list", "of", "symptoms"],
                      "medicines": ["list", "of", "medicines"],
                      "duration": "e.g. 5 days",
                      "frequency": "e.g. twice daily",
                      "diagnosis": "primary diagnosis",
                      "allergies": ["known allergies or empty list"],
                      "doctor_notes": "any additional notes",
                      "follow_up": "follow up date or instructions",
                      "vitals": {
                        "blood_pressure": "e.g. 120/80 or null",
                        "temperature": "e.g. 98.6F or null",
                        "heart_rate": "e.g. 72bpm or null",
                        "weight": "e.g. 70kg or null"
                      }
                    }
                    Rules:
                    - Use proper medical terminology
                    - List ALL symptoms and ALL medicines found
                    - Empty list [] if nothing found
                    - null for missing vitals
                    - NO text outside the JSON!'''
                },
                { 'role': 'user', 'content': input.text }
            ],
            temperature=0.1,
        )
        result_text = response.choices[0].message.content.strip()
        result_text = re.sub(r'```json\n?', '', result_text)
        result_text = re.sub(r'```\n?', '', result_text).strip()
        result = json.loads(result_text)

        raw_medicines = result.get('medicines', [])
        standardized = []
        for medicine in raw_medicines:
            standard = get_standard_medicine_name(medicine)
            if standard not in standardized:
                standardized.append(standard)

        return {
            'symptoms': result.get('symptoms', []),
            'medicine': ', '.join(standardized),
            'duration': result.get('duration', ''),
            'frequency': result.get('frequency', ''),
            'diagnosis': result.get('diagnosis', ''),
            'allergies': result.get('allergies', []),
            'doctor_notes': result.get('doctor_notes', ''),
            'follow_up': result.get('follow_up', ''),
            'vitals': result.get('vitals', {}),
            'original_text': input.text
        }
    except Exception as e:
        return {
            'symptoms': [], 'medicine': '', 'duration': '',
            'frequency': '', 'diagnosis': '', 'allergies': [],
            'doctor_notes': '', 'follow_up': '', 'vitals': {},
            'error': str(e)
        }