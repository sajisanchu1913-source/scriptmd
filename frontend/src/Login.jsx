import { useState } from 'react';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('doctor');
  const [status, setStatus] = useState('');
  const [accessCode, setAccessCode] = useState('');

  const handleSubmit = async () => {
    try {
      setStatus('Loading...');
      if (isRegister) {
        // Register new user
        const res = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, accessCode }),
        });
        const data = await res.json();
        if (data.message === 'Registered successfully!') {
          setStatus('Registered! Now login.');
          setIsRegister(false);
        } else {
          setStatus(data.message);
        }
      } else {
        // Login existing user
        const res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.token) {
          // Save token to localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          localStorage.setItem('name', data.name);
          onLogin(data.role, data.name, data.userId);
        } else {
          setStatus(data.message);
        }
      }
    } catch (e) {
      setStatus('Error connecting to server!');
    }
  };

  return (
    <div className='container'>
      <div className='topbar'>
        <h1>ScriptMD 💊</h1>
        <p>Healthcare Prescription System</p>
      </div>
      <div className='status-bar'>
        {status || (isRegister ? 'Create your account' : 'Login to continue')}
      </div>
      <div style={{ maxWidth: '400px', margin: '40px auto' }}>
        <div className='card'>
          <h2>{isRegister ? 'Register' : 'Login'}</h2>
          {isRegister && (
            <div className='field'>
              <label>Full Name</label>
              <input
                type='text'
                placeholder='Dr. John Smith'
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>
          )}
          <div className='field'>
            <label>Email</label>
            <input
              type='email'
              placeholder='doctor@hospital.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
          <div className='field'>
            <label>Password</label>
            <input
              type='password'
              placeholder='Enter password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px' }}
            />
          </div>
       {isRegister && (
  <div className='field'>
    <label>Role</label>
    <select
      value={role}
      onChange={e => setRole(e.target.value)}
      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
    >
      <option value='doctor'>Doctor</option>
      <option value='patient'>Patient</option>
    </select>
  </div>
)}
{isRegister && role === 'doctor' && (
  <div className='field'>
    <label>Doctor Access Code</label>
    <input
      type='password'
      placeholder='Enter hospital access code'
      value={accessCode}
      onChange={e => setAccessCode(e.target.value)}
      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
    />
  </div>
)}
          <button className='btn-record' onClick={handleSubmit}>
            {isRegister ? 'Register' : 'Login'}
          </button>
          <p
            style={{ textAlign: 'center', marginTop: '16px', cursor: 'pointer', color: '#888' }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Already have account? Login' : "Don't have account? Register"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;