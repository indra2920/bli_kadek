import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';
import { Activity, Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DiagnosticView() {
  const [stats, setStats] = useState({
    menuCount: 0,
    orderCount: 0,
    connectionStatus: 'connecting',
    errorMessage: '',
    lastSync: 'Never',
    projectId: 'bli-kadek-resto'
  });

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

    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, []);

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

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/owner" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
