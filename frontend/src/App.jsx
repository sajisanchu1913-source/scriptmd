import { useState, useRef, useEffect } from 'react';
import './App.css';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Doctor states
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState('Ready');
  const [prescription, setPrescription] = useState({
    symptoms: [], medicine: '', duration: '', frequency: '',
    diagnosis: '', allergies: [], doctor_notes: '', follow_up: '', vitals: {}
  });
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({ blood_pressure: '', temperature: '', heart_rate: '', weight: '', height: '', notes: '' });
  const [newPatientForm, setNewPatientForm] = useState({ name: '', email: '', age: '', gender: 'Male', blood_type: 'O+', phone: '' });
  const [tempPassword, setTempPassword] = useState('');

  // Patient states
  const [patientHistory, setPatientHistory] = useState([]);
  const [patientVitals, setPatientVitals] = useState([]);
  const [patientMessages, setPatientMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://13.232.88.58:3000/auth/verify', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsLoggedIn(true);
          setUserRole(data.role);
          setUserName(data.name);
          setUserId(data.userId);
          if (data.role === 'patient') loadPatientData(data.userId);
        } else { handleLogout(); }
      })
      .catch(() => handleLogout());
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false); setUserRole(''); setUserName(''); setUserId(null);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) { handleLogout(); return null; }
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
  };

  const loadPatientData = async (id) => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': 'Bearer ' + token };
      const [presRes, vitalsRes, msgRes] = await Promise.all([
        fetch(`http://13.232.88.58:3000/patients/${id}/prescriptions`, { headers }),
        fetch(`http://13.232.88.58:3000/patients/${id}/vitals`, { headers }),
        fetch(`http://13.232.88.58:3000/messages/${id}`, { headers })
      ]);
      const [presData, vitalsData, msgData] = await Promise.all([
        presRes.json(), vitalsRes.json(), msgRes.json()
      ]);
      setPatientHistory(Array.isArray(presData) ? presData : []);
      setPatientVitals(Array.isArray(vitalsData) ? vitalsData : []);
      setPatientMessages(Array.isArray(msgData) ? msgData : []);
    } catch (e) { console.error('Could not load patient data'); }
    finally { setLoadingHistory(false); }
  };

  const searchPatients = async (name) => {
    setPatientSearch(name);
    if (name.length < 2) { setPatientResults([]); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://13.232.88.58:3000/patients/search?name=${name}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      setPatientResults(await res.json());
    } catch (e) { console.error('Search failed'); }
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setPatientResults([]);
  };

  const addNewPatient = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://13.232.88.58:3000/patients', {
        method: 'POST', headers,
        body: JSON.stringify(newPatientForm)
      });
      const data = await res.json();
      if (data.patient) {
        setTempPassword(data.tempPassword);
        setSelectedPatient(data.patient);
        setPatientSearch(data.patient.name);
        setShowAddPatient(false);
        setNewPatientForm({ name: '', email: '', age: '', gender: 'Male', blood_type: 'O+', phone: '' });
        setStatus(`Patient added! Temp password: ${data.tempPassword}`);
      } else { setStatus('Error: ' + data.message); }
    } catch (e) { setStatus('Error adding patient!'); }
  };

  const saveVitals = async () => {
    if (!selectedPatient) { setStatus('Select a patient first!'); return; }
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch(`http://13.232.88.58:3000/patients/${selectedPatient.id}/vitals`, {
        method: 'POST', headers,
        body: JSON.stringify(vitalsForm)
      });
      const data = await res.json();
      if (data.id) {
        setStatus('Vitals saved! ✅');
        setShowVitals(false);
        setVitalsForm({ blood_pressure: '', temperature: '', heart_rate: '', weight: '', height: '', notes: '' });
      }
    } catch (e) { setStatus('Error saving vitals!'); }
  };

  const startRecording = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) setTranscription(prev => prev + ' ' + finalTranscript);
      };
      recognition.onerror = (event) => setStatus('Error: ' + event.error);
      recognition.start();
      setIsRecording(true);
      setStatus('Recording... 🎤');
    } catch (error) { setStatus('Speech recognition not supported!'); }
  };

  const handleStopAndExtract = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
    setStatus('Processing...');
    setTimeout(() => sendToExtract(transcription), 500);
  };

  const sendToExtract = async (text) => {
    try {
      setStatus('Extracting medical info...');
      const res = await fetch('http://13.232.88.58:3000/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.symptoms || data.medicine || data.duration) {
        setPrescription({
          symptoms: data.symptoms || [],
          medicine: data.medicine || '',
          duration: data.duration || '',
          frequency: data.frequency || '',
          diagnosis: data.diagnosis || '',
          allergies: data.allergies || [],
          doctor_notes: data.doctor_notes || '',
          follow_up: data.follow_up || '',
          vitals: data.vitals || {},
        });
      }
      setStatus('Done! ✅');
    } catch (error) { setStatus('Error connecting to server!'); }
  };

  const handleSave = async () => {
    if (!selectedPatient) { setStatus('Please select a patient first!'); return; }
    try {
      setStatus('Saving...');
      const headers = getAuthHeaders();
      if (!headers) return;
      const res = await fetch('http://13.232.88.58:3000/prescription', {
        method: 'POST', headers,
        body: JSON.stringify({
          patientName: selectedPatient.name,
          patientId: selectedPatient.id,
          doctorName: userName,
          symptoms: prescription.symptoms.join(', '),
          medicine: prescription.medicine,
          duration: prescription.duration,
          frequency: prescription.frequency,
          originalText: transcription,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setStatus('Saved! Prescription ID: #' + data.id + ' ✅');
        setTranscription('');
        setPrescription({ symptoms: [], medicine: '', duration: '', frequency: '', diagnosis: '', allergies: [], doctor_notes: '', follow_up: '', vitals: {} });
      } else { setStatus('Save failed: ' + data.message); }
    } catch (e) { setStatus('Error saving prescription!'); }
  };

  if (!isLoggedIn) {
    return <Login onLogin={(role, name, id) => {
      setIsLoggedIn(true); setUserRole(role); setUserName(name); setUserId(id);
      if (role === 'patient') loadPatientData(id);
    }} />;
  }

  // ── PATIENT PORTAL ──
  if (userRole === 'patient') {
    const tabs = ['dashboard', 'prescriptions', 'vitals', 'medications', 'messages'];
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        {/* Sidebar */}
        <div style={{ width: '220px', background: '#111', borderRight: '1px solid #222', padding: '20px 0' }}>
          <div style={{ padding: '0 20px 20px', borderBottom: '1px solid #222' }}>
            <h2 style={{ color: '#4caf50', margin: 0 }}>ScriptMD 💊</h2>
            <p style={{ color: '#888', fontSize: '12px', margin: '4px 0 0' }}>{userName}</p>
          </div>
          {[
            { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
            { id: 'prescriptions', icon: '📋', label: 'Prescriptions' },
            { id: 'vitals', icon: '🩺', label: 'My Vitals' },
            { id: 'medications', icon: '💊', label: 'Medications' },
            { id: 'messages', icon: '💬', label: 'Messages' },
            { id: 'settings', icon: '⚙️', label: 'Settings' },
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                background: activeTab === tab.id ? '#1a1a1a' : 'transparent',
                borderLeft: activeTab === tab.id ? '3px solid #4caf50' : '3px solid transparent',
                color: activeTab === tab.id ? '#fff' : '#888',
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ fontSize: '14px' }}>{tab.label}</span>
            </div>
          ))}
          <div onClick={handleLogout} style={{ padding: '12px 20px', cursor: 'pointer', color: '#f44336', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🚪</span><span style={{ fontSize: '14px' }}>Logout</span>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <div>
              <h1 style={{ color: '#fff', marginBottom: '8px' }}>Welcome back, {userName}! 👋</h1>
              <p style={{ color: '#888', marginBottom: '24px' }}>Here's your health summary</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Visits', value: patientHistory.length, icon: '🏥' },
                  { label: 'Medications', value: new Set(patientHistory.map(r => r.medicine)).size, icon: '💊' },
                  { label: 'Messages', value: patientMessages.length, icon: '💬' },
                ].map((stat, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>{stat.value}</div>
                    <div style={{ color: '#888', fontSize: '14px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Recent prescriptions */}
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ color: '#fff', marginBottom: '16px' }}>Recent Prescriptions</h3>
                {patientHistory.slice(0, 3).map((rx, i) => (
                  <div key={i} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 'bold' }}>{rx.medicine}</div>
                      <div style={{ color: '#888', fontSize: '12px' }}>{rx.symptoms}</div>
                    </div>
                    <div style={{ color: '#888', fontSize: '12px' }}>{new Date(rx.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              <h1 style={{ color: '#fff', marginBottom: '24px' }}>My Prescriptions 📋</h1>
              {loadingHistory ? <p style={{ color: '#888' }}>Loading...</p> :
                patientHistory.length === 0 ? <p style={{ color: '#888' }}>No prescriptions yet.</p> :
                patientHistory.map((rx, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ color: '#4caf50', margin: 0 }}>{rx.medicine}</h3>
                      <span style={{ color: '#888', fontSize: '12px' }}>{new Date(rx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      <div><span style={{ color: '#888', fontSize: '12px' }}>Symptoms</span><p style={{ color: '#fff', margin: '2px 0' }}>{rx.symptoms}</p></div>
                      <div><span style={{ color: '#888', fontSize: '12px' }}>Doctor</span><p style={{ color: '#fff', margin: '2px 0' }}>{rx.doctorName|| rx.doctor_name || 'Not specified'}</p></div>
                      <div><span style={{ color: '#888', fontSize: '12px' }}>Duration</span><p style={{ color: '#fff', margin: '2px 0' }}>{rx.duration}</p></div>
                      <div><span style={{ color: '#888', fontSize: '12px' }}>Frequency</span><p style={{ color: '#fff', margin: '2px 0' }}>{rx.frequency || 'Not specified'}</p></div>
                      <span style={{ color: '#888', fontSize: '12px' }}>{new Date(rx.createdAt || rx.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'vitals' && (
            <div>
              <h1 style={{ color: '#fff', marginBottom: '24px' }}>My Vitals 🩺</h1>
              {patientVitals.length === 0 ? <p style={{ color: '#888' }}>No vitals recorded yet.</p> :
                patientVitals.map((v, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ color: '#fff', margin: 0 }}>Vitals Check</h3>
                      <span style={{ color: '#888', fontSize: '12px' }}>{new Date(v.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Blood Pressure', value: v.blood_pressure, icon: '❤️' },
                        { label: 'Temperature', value: v.temperature, icon: '🌡️' },
                        { label: 'Heart Rate', value: v.heart_rate, icon: '💓' },
                        { label: 'Weight', value: v.weight, icon: '⚖️' },
                        { label: 'Height', value: v.height, icon: '📏' },
                      ].map((stat, j) => stat.value && (
                        <div key={j} style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '20px' }}>{stat.icon}</div>
                          <div style={{ color: '#4caf50', fontWeight: 'bold' }}>{stat.value}</div>
                          <div style={{ color: '#888', fontSize: '11px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {v.notes && <p style={{ color: '#888', marginTop: '12px', fontSize: '13px' }}>Notes: {v.notes}</p>}
                  </div>
                ))
              }
            </div>
          )}

          {activeTab === 'medications' && (
            <div>
              <h1 style={{ color: '#fff', marginBottom: '24px' }}>My Medications 💊</h1>
              {[...new Set(patientHistory.map(rx => rx.medicine))].map((med, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#1a3a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💊</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{med}</div>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      Prescribed {patientHistory.filter(rx => rx.medicine === med).length} time(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'messages' && (
            <div>
              <h1 style={{ color: '#fff', marginBottom: '24px' }}>Messages 💬</h1>
              {patientMessages.length === 0 ? <p style={{ color: '#888' }}>No messages yet.</p> :
                patientMessages.map((msg, i) => (
                  <div key={i} style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{msg.doctor_name}</span>
                      <span style={{ color: '#888', fontSize: '12px' }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ color: '#fff', margin: 0 }}>{msg.message}</p>
                  </div>
                ))
              }
            </div>
          )}
          {activeTab === 'settings' && (
  <div>
    <h1 style={{ color: '#fff', marginBottom: '24px' }}>Settings ⚙️</h1>
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '24px', maxWidth: '400px' }}>
      <h3 style={{ color: '#fff', marginBottom: '16px' }}>Change Password</h3>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ color: '#888', fontSize: '12px' }}>New Password</label>
        <input
          type='password'
          id='newPassword'
          placeholder='Enter new password'
          style={{ width: '100%', padding: '8px', background: '#1a1a1a', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '4px' }}
        />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ color: '#888', fontSize: '12px' }}>Confirm Password</label>
        <input
          type='password'
          id='confirmPassword'
          placeholder='Confirm new password'
          style={{ width: '100%', padding: '8px', background: '#1a1a1a', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '4px' }}
        />
      </div>
      <button
        onClick={async () => {
          const newPass = document.getElementById('newPassword').value;
          const confirmPass = document.getElementById('confirmPassword').value;
          if (newPass !== confirmPass) { alert('Passwords do not match!'); return; }
          if (newPass.length < 6) { alert('Password must be at least 6 characters!'); return; }
          const token = localStorage.getItem('token');
          const res = await fetch('http://13.232.88.58:3000/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ newPassword: newPass })
          });
          const data = await res.json();
          if (data.message === 'Password updated!') {
            alert('Password changed successfully!');
          } else { alert('Error: ' + data.message); }
        }}
        style={{ width: '100%', padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Update Password
      </button>
    </div>
  </div>
)}
        </div>
      </div>
    );
  }

  // ── DOCTOR DASHBOARD ──
  return (
    <div className='container'>
      <div className='topbar'>
        <h1>ScriptMD 💊</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <p>{userName} · Dashboard</p>
          <button onClick={handleLogout} style={{ padding: '4px 12px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      <div className='status-bar'>Status: {status}</div>

      {tempPassword && selectedPatient && (
  <div style={{ background: '#1a3a1a', border: '1px solid #4caf50', borderRadius: '8px', padding: '16px', margin: '8px 16px' }}>
    <strong style={{ color: '#4caf50', fontSize: '16px' }}>✅ New Patient Created Successfully!</strong>
    <div style={{ marginTop: '12px', background: '#111', borderRadius: '8px', padding: '12px' }}>
      <p style={{ color: '#888', margin: '0 0 4px', fontSize: '12px' }}>Share these login credentials with the patient:</p>
      <p style={{ color: '#fff', margin: '4px 0' }}>
        📧 <strong>Email:</strong> {selectedPatient.email}
      </p>
      <p style={{ color: '#fff', margin: '4px 0' }}>
        🔑 <strong>Temporary Password:</strong> {tempPassword}
      </p>
      <p style={{ color: '#888', margin: '8px 0 0', fontSize: '12px' }}>
        Patient should go to localhost:5173 → click Login → use these credentials
      </p>3
    </div>
    <button
      onClick={() => setTempPassword('')}
      style={{ marginTop: '8px', padding: '4px 10px', background: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
    >
      Dismiss
    </button>
  </div>
)}

      <div className='grid'>
        {/* CARD 1 — Patient Search + Add */}
        <div className='card'>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Patient Search 🔍</h2>
            <button
              onClick={() => setShowAddPatient(!showAddPatient)}
              style={{ padding: '4px 10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              + New Patient
            </button>
          </div>

          {showAddPatient && (
            <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
              <h4 style={{ color: '#4caf50', margin: '0 0 8px' }}>Add New Patient</h4>
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Age', key: 'age', type: 'number' },
                { label: 'Phone', key: 'phone', type: 'text' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: '8px' }}>
                  <label style={{ color: '#888', fontSize: '12px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={newPatientForm[field.key]}
                    onChange={e => setNewPatientForm({ ...newPatientForm, [field.key]: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '2px' }}
                  />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ color: '#888', fontSize: '12px' }}>Gender</label>
                  <select value={newPatientForm.gender} onChange={e => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '2px' }}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: '#888', fontSize: '12px' }}>Blood Type</label>
                  <select value={newPatientForm.blood_type} onChange={e => setNewPatientForm({ ...newPatientForm, blood_type: e.target.value })}
                    style={{ width: '100%', padding: '6px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '2px' }}>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bt => <option key={bt}>{bt}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={addNewPatient} style={{ width: '100%', padding: '8px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>
                Add Patient
              </button>
            </div>
          )}

          <div className='field'>
            <label>Search Existing Patient</label>
            <input
              type='text'
              placeholder='Type patient name...'
              value={patientSearch}
              onChange={e => searchPatients(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', background: '#1a1a1a', color: 'white', border: '1px solid #333', borderRadius: '4px' }}
            />
          </div>
          {patientResults.length > 0 && (
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '4px', marginTop: '4px' }}>
              {patientResults.map((p, i) => (
                <div key={i} onClick={() => selectPatient(p)}
                  style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #222' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Age: {p.age} | {p.gender} | {p.blood_type} | {p.email}</div>
                </div>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#0a3d0a', borderRadius: '4px' }}>
              <div style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ {selectedPatient.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Age: {selectedPatient.age} | {selectedPatient.gender} | Blood: {selectedPatient.blood_type}</div>
              <button
                onClick={() => setShowVitals(!showVitals)}
                style={{ marginTop: '8px', padding: '4px 8px', background: '#1565c0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
              >
                🩺 Record Vitals
              </button>
            </div>
          )}
          {showVitals && selectedPatient && (
            <div style={{ background: '#1a1a2a', borderRadius: '8px', padding: '12px', marginTop: '8px' }}>
              <h4 style={{ color: '#2196f3', margin: '0 0 8px' }}>Record Vitals for {selectedPatient.name}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Blood Pressure', key: 'blood_pressure', placeholder: '120/80' },
                  { label: 'Temperature', key: 'temperature', placeholder: '98.6F' },
                  { label: 'Heart Rate', key: 'heart_rate', placeholder: '72bpm' },
                  { label: 'Weight', key: 'weight', placeholder: '70kg' },
                  { label: 'Height', key: 'height', placeholder: '175cm' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ color: '#888', fontSize: '12px' }}>{field.label}</label>
                    <input
                      type='text'
                      placeholder={field.placeholder}
                      value={vitalsForm[field.key]}
                      onChange={e => setVitalsForm({ ...vitalsForm, [field.key]: e.target.value })}
                      style={{ width: '100%', padding: '6px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '2px' }}
                    />
                  </div>
                ))}
              </div>
              <input
                type='text'
                placeholder='Notes...'
                value={vitalsForm.notes}
                onChange={e => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                style={{ width: '100%', padding: '6px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', marginTop: '8px' }}
              />
              <button onClick={saveVitals}
                style={{ width: '100%', padding: '8px', background: '#1565c0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>
                Save Vitals
              </button>
            </div>
          )}
        </div>

        {/* CARD 2 — Voice Recording */}
        <div className='card'>
          <h2>Voice Recording 🎤</h2>
          <button
            className={isRecording ? 'btn-stop' : 'btn-record'}
            onClick={isRecording ? handleStopAndExtract : startRecording}
          >
            {isRecording ? '⏹ Stop Recording' : '🎤 Start Recording'}
          </button>
          <div className='transcription-box'>
            {transcription || 'Transcription will appear here...'}
          </div>
        </div>

        {/* CARD 3 — Generated Prescription */}
        <div className='card'>
          <h2>Generated Prescription 💊</h2>
          <div className='field'><label>Symptoms</label>
            <div className='field-value'>
              {prescription.symptoms.length > 0
                ? prescription.symptoms.map((s, i) => <span className='tag' key={i}>{s}</span>)
                : 'No symptoms yet'}
            </div>
          </div>
          {prescription.diagnosis && (
            <div className='field'><label>Diagnosis</label>
              <div className='field-value'>{prescription.diagnosis}</div>
            </div>
          )}
          <div className='field'><label>Medicine</label>
            <div className='field-value'>{prescription.medicine || 'No medicine yet'}</div>
          </div>
          <div className='field'><label>Duration</label>
            <div className='field-value'>{prescription.duration || 'No duration yet'}</div>
          </div>
          <div className='field'><label>Frequency</label>
            <div className='field-value'>{prescription.frequency || 'No frequency yet'}</div>
          </div>
          {prescription.follow_up && (
            <div className='field'><label>Follow Up</label>
              <div className='field-value'>{prescription.follow_up}</div>
            </div>
          )}
          {prescription.doctor_notes && (
            <div className='field'><label>Doctor Notes</label>
              <div className='field-value'>{prescription.doctor_notes}</div>
            </div>
          )}
          <button className='btn-save' onClick={handleSave}>💾 Save Prescription</button>
        </div>

        {/* CARD 4 — Recent */}
        {/* CARD 4 — Message Patient */}
<div className='card'>
  <h2>Message Patient 💬</h2>
  {selectedPatient ? (
    <div>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '8px' }}>
        Sending to: <strong style={{ color: '#4caf50' }}>{selectedPatient.name}</strong>
      </p>
      <textarea
        placeholder='Type a message to the patient...'
        id='doctorMessage'
        rows={4}
        style={{
          width: '100%', padding: '8px', background: '#1a1a1a',
          color: 'white', border: '1px solid #333', borderRadius: '4px',
          resize: 'vertical', fontFamily: 'Arial'
        }}
      />
      <button
        onClick={async () => {
          const msg = document.getElementById('doctorMessage').value;
          if (!msg.trim()) return;
          const headers = getAuthHeaders();
          const res = await fetch('http://13.232.88.58:3000/messages', {
            method: 'POST', headers,
            body: JSON.stringify({ patientId: selectedPatient.id, message: msg })
          });
          const data = await res.json();
          if (data.id) {
            setStatus('Message sent to ' + selectedPatient.name + ' ✅');
            document.getElementById('doctorMessage').value = '';
          }
        }}
        style={{
          width: '100%', padding: '8px', background: '#1565c0',
          color: 'white', border: 'none', borderRadius: '4px',
          cursor: 'pointer', marginTop: '8px'
        }}
      >
        Send Message 📤
      </button>
    </div>
  ) : (
    <p style={{ color: '#888' }}>Select a patient first to send a message</p>
  )}
</div>
      </div>
    </div>
  );
}

export default App;