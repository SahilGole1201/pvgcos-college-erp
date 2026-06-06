import React, { useState } from 'react';
import axios from 'axios';
import pvgcosLogo from './pvgcosc-logo.png'; 

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    axios.post('http://localhost:8002/login', { username, password })
      .then(response => {
        onLoginSuccess({
          role: response.data.role,
          id: response.data.id || response.data.user_id,
          name: response.data.name,
          prn: response.data.prn
        });
      })
      .catch(err => {
        setError(err.response?.data?.detail || "Login failed. Check if all services are running.");
        setIsLoading(false);
      });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px', padding: '0 16px' }}>
        
        {/* Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ background: 'var(--erp-primary, #1e40af)', padding: '32px 40px', textAlign: 'center' }}>
            <img 
              src={pvgcosLogo} 
              alt="PVGCOS Logo" 
              style={{ width: '90px', height: '90px', objectFit: 'contain', marginBottom: '12px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h2 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: '800' }}>PVGCOS College ERP</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: '4px', fontSize: '14px' }}>Sign in to your account</p>
          </div>

          {/* Form */}
          <div style={{ padding: '36px 40px' }}>
            {error && (
              <div className="erp-alert erp-alert--danger" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '18px' }}>
                <label htmlFor="login-username" className="erp-label">Username / Email</label>
                <input 
                  id="login-username"
                  name="username"
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  placeholder="Enter Username" 
                  className="erp-form-control"
                  autoComplete="username"
                />
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="login-password" className="erp-label">Password</label>
                <input 
                  id="login-password"
                  name="password"
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  className="erp-form-control"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="erp-btn erp-btn--primary" style={{ textAlign: 'center',width: '100%', padding: '12px', fontSize: '15px', cursor: isLoading ? 'wait' : 'pointer' }}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;