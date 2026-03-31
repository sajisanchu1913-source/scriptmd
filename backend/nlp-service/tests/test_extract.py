# tests/test_extract.py
# Run with: pytest tests/ -v

import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

client = TestClient(app)

# Test 1: Health check
def test_health_check():
    response = client.get('/')
    assert response.status_code == 200
    assert response.json()['message'] == 'NLP Service running!'

# Test 2: Extract fever and paracetamol
def test_extract_fever_paracetamol():
    response = client.post('/extract', json={
        'text': 'patient has fever prescribe paracetamol 500mg twice daily for 5 days'
    })
    assert response.status_code == 200
    data = response.json()
    symptoms_lower = [s.lower() for s in data['symptoms']]
    assert 'fever' in symptoms_lower
    assert data['medicine'] != ''
    assert '5' in data['duration'] or 'day' in data['duration'].lower()

# Test 3: Empty text returns empty lists
def test_extract_empty_text():
    response = client.post('/extract', json={'text': ''})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data['symptoms'], list)
    assert isinstance(data['medicine'], str)

# Test 4: Multiple medicines extracted
def test_extract_multiple_medicines():
    response = client.post('/extract', json={
        'text': 'prescribe augmentin 625mg twice daily and cetirizine 10mg at night for 7 days'
    })
    assert response.status_code == 200
    data = response.json()
    assert data['medicine'] != ''
    assert '7' in data['duration'] or 'day' in data['duration'].lower()

# Test 5: Frequency extracted correctly
def test_extract_frequency():
    response = client.post('/extract', json={
        'text': 'patient has cold prescribe ibuprofen 400mg three times daily for 3 days'
    })
    assert response.status_code == 200
    data = response.json()
    assert 'three' in data['frequency'].lower() or '3' in data['frequency']

# Test 6: New fields extracted
def test_extract_new_fields():
    response = client.post('/extract', json={
        'text': 'patient has hypertension blood pressure 140/90 prescribe amlodipine 5mg once daily follow up in 2 weeks'
    })
    assert response.status_code == 200
    data = response.json()
    assert 'vitals' in data
    assert 'follow_up' in data
    assert data['follow_up'] != ''

