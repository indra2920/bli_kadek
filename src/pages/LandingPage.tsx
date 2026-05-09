import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Utensils, ChefHat, TrendingUp, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LandingPage() {
  const tables = useStore((state) => state.tables);
  
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%)', 
        padding: '6rem 1rem', 
        textAlign: 'center',
        color: 'white',
        borderRadius: '0 0 60px 60px',
        marginBottom: '4rem',
        boxShadow: 'var(--shadow)'
      }}>
        <div className="container">
          <img src="/logo.png" alt="Logo" style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '1.5rem', border: '3px solid white', objectFit: 'cover' }} />
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem', lineHeight: 1.1 }}>Hade Panjingan</h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem', fontWeight: 300 }}>
            Les Village - Bali
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="glass" style={{ padding: '0.8rem 1.5rem', borderRadius: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Utensils size={18} /> Balinese Cuisine
            </div>
            <div className="glass" style={{ padding: '0.8rem 1.5rem', borderRadius: '40px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={18} /> Digital Ordering
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Management Links */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.5rem', 
          marginBottom: '5rem' 
        }}>
          <Link to="/cashier" className="card card-hover" style={{ padding: '2rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#fff9e6', padding: '1rem', borderRadius: '16px' }}>
                <LayoutGrid color="#f39c12" size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Cashier</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Verify & Payments</p>
              </div>
            </div>
            <ChevronRight size={20} color="var(--border)" />
          </Link>

          <Link to="/kitchen" className="card card-hover" style={{ padding: '2rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#eafaf1', padding: '1rem', borderRadius: '16px' }}>
                <ChefHat color="#27ae60" size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Kitchen</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Order Preparation</p>
              </div>
            </div>
            <ChevronRight size={20} color="var(--border)" />
          </Link>

          <Link to="/owner" className="card card-hover" style={{ padding: '2rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#ebf5fb', padding: '1rem', borderRadius: '16px' }}>
                <TrendingUp color="#3498db" size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Owner</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Analytics & Menu</p>
              </div>
            </div>
            <ChevronRight size={20} color="var(--border)" />
          </Link>
        </div>

        {/* QR Section */}
        <section style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Table QR Codes</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '3rem' }}>Scan to start ordering from your table</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: '2rem' 
          }}>
            {tables.map(id => (
              <div key={id} className="card card-hover" style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'inline-block' }}>
                  <QRCodeSVG value={`${window.location.origin}/table/${id}`} size={140} />
                </div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Table {id}</h3>
                <Link 
                  to={`/table/${id}`} 
                  style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--primary)', 
                    textDecoration: 'none', 
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  Open Menu <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '8rem', textAlign: 'center', padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '1rem' }} />
        <p className="brand" style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Hade Panjingan</p>
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>© 2026 Les Village - Bali</p>
      </footer>
    </div>
  );
}
