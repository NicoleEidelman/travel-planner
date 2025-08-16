import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function ModernAuthPage({ setUser }) {
  const navigate = useNavigate();
  const query = useQuery();
  const modeFromUrl = query.get('mode');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (modeFromUrl === 'register') setIsLogin(false);
    else setIsLogin(true);
  }, [modeFromUrl]);

  const switchToLogin = () => {
    setIsLogin(true);
    navigate('/?mode=login', { replace: true });
  };
  
  const switchToRegister = () => {
    setIsLogin(false);
    navigate('/?mode=register', { replace: true });
  };

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          padding: '48px 40px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'slideUp 0.6s ease-out'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 20px',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
            }}>
              🗺️
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px 0'
            }}>
              Travel Planner
            </h1>
            <p style={{
              color: '#718096',
              fontSize: '1rem',
              margin: 0
            }}>
              Plan amazing adventures with AI-powered route planning
            </p>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            marginBottom: '32px',
            background: '#f7fafc',
            borderRadius: '16px',
            padding: '6px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={switchToLogin}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                borderRadius: '12px',
                background: isLogin ? 'white' : 'transparent',
                color: isLogin ? '#2d3748' : '#718096',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: isLogin ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Sign In
            </button>
            <button
              onClick={switchToRegister}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: 'none',
                borderRadius: '12px',
                background: !isLogin ? 'white' : 'transparent',
                color: !isLogin ? '#2d3748' : '#718096',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: !isLogin ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Form Content */}
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {isLogin ? (
              <Login onLogin={(user) => {
                setUser(user);
                navigate('/');
              }} />
            ) : (
              <Register onRegister={(user) => navigate('/')} />
            )}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '32px',
            padding: '20px 0',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#a0aec0',
              margin: 0
            }}>
              Secure authentication • Your data is protected
            </p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default ModernAuthPage;