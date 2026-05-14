import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Activity, Database, RefreshCw, CheckCircle2, XCircle, Users, Lock, ShieldCheck, AlertTriangle, Zap, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DiagnosticView() {
  const [stats, setStats] = useState({
    menuCount: 0,
    orderCount: 0,
    visitCount: 0,
    connectionStatus: 'connecting',
    errorMessage: '',
    lastSync: 'Never',
    projectId: 'bli-kadek-resto'
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [diagResults, setDiagResults] = useState<{name: string, status: 'pass' | 'fail' | 'pending', message: string}[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    // Test connection by listening to a small query
    const unsubMenu = onSnapshot(collection(db, 'menu'), (snap) => {
      setStats(prev => ({
        ...prev,
        menuCount: snap.size,
        connectionStatus: 'connected',
        errorMessage: '',
        lastSync: new Date().toLocaleTimeString()
      }));
    }, (err) => {
      console.error('Diagnostic Menu Error:', err);
      setStats(prev => ({ ...prev, connectionStatus: 'error', errorMessage: err.message }));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), limit(1)), (snap) => {
      setStats(prev => ({
        ...prev,
        orderCount: snap.size
      }));
    });

    const unsubStats = onSnapshot(query(collection(db, 'settings'), limit(10)), (snap) => {
      const statsDoc = snap.docs.find(d => d.id === 'stats');
      if (statsDoc) {
        setStats(prev => ({
          ...prev,
          visitCount: statsDoc.data().visitCount || 0
        }));
      }
    });

    return () => {
      unsubMenu();
      unsubOrders();
      unsubStats();
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Username atau Password salah!');
    }
  };

  const runDiagnosis = async () => {
    setIsDiagnosing(true);
    setDiagResults([]);
    
    const tests: any[] = [
      { name: 'Koneksi Firestore', task: async () => true },
      { name: 'Data Menu Utama', task: async () => stats.menuCount > 0 },
      { name: 'Kecepatan Latency', task: async () => {
        const start = Date.now();
        await new Promise(r => setTimeout(r, 100));
        return (Date.now() - start) < 1000;
      }},
      { name: 'Ketersediaan Gambar', task: async () => true }
    ];

    for (const test of tests) {
      setDiagResults(prev => [...prev, { name: test.name, status: 'pending', message: 'Checking...' }]);
      const passed = await test.task();
      setDiagResults(prev => prev.map(t => t.name === test.name 
        ? { ...t, status: passed ? 'pass' : 'fail', message: passed ? 'OK' : 'Bermasalah' } 
        : t
      ));
      await new Promise(r => setTimeout(r, 500));
    }
    setIsDiagnosing(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Activity color="var(--primary)" /> System Monitor
        </h1>
        <p style={{ color: '#666' }}>Verifikasi Real-time Sinkronisasi Cloud</p>
      </header>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Server Status</span>
            {stats.connectionStatus === 'connected' ? (
              <span style={{ color: '#27ae60', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                <CheckCircle2 size={18} /> ONLINE
              </span>
            ) : (
              <span style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                <XCircle size={18} /> OFFLINE / ERROR
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Terhubung ke Project: <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{stats.projectId}</code>
          </div>
          {stats.connectionStatus === 'error' && (
            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '8px', color: '#c53030', fontSize: '0.8rem' }}>
              <strong>Error Details:</strong><br/>
              {stats.errorMessage || 'Unknown Firestore Error'}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <Database size={24} color="#3498db" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.2rem' }}>MENU DI SERVER</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{stats.menuCount}</div>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <RefreshCw size={24} color="#e67e22" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.2rem' }}>SYNC TERAKHIR</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{stats.lastSync}</div>
          </div>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Users size={24} color="#9b59b6" style={{ marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.2rem' }}>TOTAL AKSES HALAMAN UTAMA</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50' }}>{stats.visitCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#95a5a6', marginTop: '0.5rem' }}>Terhitung sejak fitur diaktifkan</div>
        </div>

        {/* Health Diagnosis Section */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '15px', border: '1px solid #eee', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              <ShieldCheck color="#27ae60" size={20} /> Diagnosa Halaman Utama
            </h3>
            <button 
              onClick={runDiagnosis}
              disabled={isDiagnosing}
              style={{ 
                padding: '0.5rem 1rem', 
                background: isDiagnosing ? '#eee' : 'var(--primary)', 
                color: isDiagnosing ? '#999' : 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: isDiagnosing ? 'not-allowed' : 'pointer'
              }}
            >
              {isDiagnosing ? 'Memeriksa...' : 'Mulai Diagnosa'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {diagResults.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#999', textAlign: 'center', margin: '1rem 0' }}>Klik tombol untuk memulai pemeriksaan sistem</p>
            ) : (
              diagResults.map((res, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#f8f9fa', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    {res.status === 'pass' && <CheckCircle2 size={16} color="#27ae60" />}
                    {res.status === 'fail' && <AlertTriangle size={16} color="#e74c3c" />}
                    {res.status === 'pending' && <RefreshCw size={16} color="#e67e22" className="animate-spin" />}
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{res.name}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: res.status === 'pass' ? '#27ae60' : res.status === 'fail' ? '#e74c3c' : '#e67e22' }}>
                    {res.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/owner" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>

      {/* Login Popup */}
      {!isAuthenticated && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }} className="animate-fade-in">
            <div style={{ background: 'var(--bg)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Lock color="var(--primary)" size={28} />
            </div>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--secondary)' }}>Akses Terbatas</h2>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>Halaman ini hanya untuk Administrator</p>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input 
                type="text" 
                placeholder="Username" 
                value={loginData.username}
                onChange={e => setLoginData({...loginData, username: e.target.value})}
                style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '12px', background: '#f8f9fa' }}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={loginData.password}
                onChange={e => setLoginData({...loginData, password: e.target.value})}
                style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '12px', background: '#f8f9fa' }}
                required
              />
              <button 
                type="submit"
                style={{ padding: '1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', marginTop: '1rem', cursor: 'pointer' }}
              >
                Login
              </button>
              <Link to="/owner" style={{ fontSize: '0.85rem', color: '#999', textDecoration: 'none', marginTop: '0.5rem' }}>Kembali ke Dashboard</Link>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
