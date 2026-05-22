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
        setError(err.response?.data?.detail || "Invalid credentials! Check if auth service is running.");
        setIsLoading(false);
      });
  };

  return (
    <div className="erp-login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-gradient, linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%))' }}>
      <div className="erp-login-card" style={{ width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img 
            src={pvgcosLogo} 
            alt="PVGCOS Logo" 
            style={{ width: '80px', height: '80px', margin: '0 auto 15px auto', objectFit: 'contain' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.insertAdjacentHTML('afterbegin', '<div style="width: 80px; height: 80px; background: #1e40af; color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin: 0 auto 15px auto;">PVGCOS</div>');
            }} 
          />
          <h2 style={{ color: 'var(--text-dark, #0f172a)', margin: 0, fontSize: '24px', fontWeight: '800' }}>PVGCOS College ERP</h2>
          <p style={{ color: 'var(--text-light, #64748b)', marginTop: '5px' }}>Sign in to your account</p>
        </div>
        
        {error && (
            <div className="erp-alert-error" style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', borderLeft: '4px solid #ef4444' }}>
                {error}
            </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            {/* FIXED: Added htmlFor to match the input ID */}
            <label htmlFor="login-username" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>Username</label>
            
            {/* FIXED: Added id and name attributes */}
            <input 
              id="login-username"
              name="username"
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="e.g. PriyaP" 
              className="erp-input" 
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            {/* FIXED: Added htmlFor to match the input ID */}
            <label htmlFor="login-password" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#334155', fontSize: '14px' }}>Password</label>
            
            {/* FIXED: Added id, name, and autoComplete attributes */}
            <input 
              id="login-password"
              name="password"
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
              autoComplete="current-password"
              className="erp-input" 
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} 
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="erp-btn erp-btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '8px', cursor: isLoading ? 'wait' : 'pointer', fontWeight: '600' }}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;