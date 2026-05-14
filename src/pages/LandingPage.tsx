import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Utensils, ChefHat, TrendingUp, ChevronRight, MapPin, Coffee } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useEffect } from 'react';


export default function LandingPage() {
  const tables = useStore((state) => state.tables);
  const incrementVisitCount = useStore((state) => state.incrementVisitCount);

  useEffect(() => {
    incrementVisitCount();
  }, [incrementVisitCount]);

  
  return (
    <div className="animate-fade-in" style={{ paddingBottom: '5rem' }}>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(180deg, #e8dfd8 0%, var(--bg) 100%)', 
        padding: '8rem 1rem 6rem', 
        textAlign: 'center',
        borderRadius: '0 0 80px 80px',
        marginBottom: '5rem',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(212, 163, 115, 0.1)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '10%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(141, 110, 99, 0.05)', filter: 'blur(40px)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '2rem', display: 'inline-block', position: 'relative' }}>
             <div style={{ position: 'absolute', inset: '-15px', border: '1px solid var(--accent)', borderRadius: '50%', opacity: 0.3 }} />
             <img src="/logo.png" alt="Logo" style={{ width: '180px', height: '180px', borderRadius: '50%', border: '4px solid white', boxShadow: 'var(--shadow)', objectFit: 'cover' }} />
          </div>
          
          <h1 style={{ fontSize: '4rem', marginBottom: '0.8rem', color: 'var(--secondary)', letterSpacing: '-0.03em' }}>Hade Panjingan</h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem' }}>
            <p style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Foodcourt & Homestay</p>
            <div style={{ width: '40px', height: '2px', background: 'var(--accent)', margin: '0.5rem 0' }} />
            <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} /> Les Village - Bali
            </p>
          </div>

        </div>
      </section>

      <div className="container">
        {/* Management Access */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Management Dashboards</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Access internal systems for staff and owners</p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem', 
          marginBottom: '6rem' 
        }}>
          <Link to="/cashier" className="card card-hover" style={{ padding: '2.5rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#fdf3e7', padding: '1.2rem', borderRadius: '20px' }}>
                <LayoutGrid color="#d4a373" size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Cashier</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Order verification & Payments</p>
              </div>
            </div>
            <ChevronRight size={24} color="var(--border)" />
          </Link>

          <Link to="/kitchen" className="card card-hover" style={{ padding: '2.5rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#f2f9f5', padding: '1.2rem', borderRadius: '20px' }}>
                <ChefHat color="#27ae60" size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Kitchen</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Live order preparation display</p>
              </div>
            </div>
            <ChevronRight size={24} color="var(--border)" />
          </Link>

          <Link to="/owner" className="card card-hover" style={{ padding: '2.5rem', textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: '#f0f7ff', padding: '1.2rem', borderRadius: '20px' }}>
                <TrendingUp color="#3498db" size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.2rem' }}>Owner</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Analytics & Business Insights</p>
              </div>
            </div>
            <ChevronRight size={24} color="var(--border)" />
          </Link>
        </div>

        {/* QR Section */}
        <section style={{ 
          background: 'var(--surface)', 
          padding: '5rem 2rem', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
          border: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '2.5rem', color: 'var(--secondary)', marginBottom: '1rem' }}>Table QR Codes</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '4rem', fontSize: '1.1rem' }}>Generate and scan to start the dining experience</p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '2.5rem' 
          }}>
            {tables.map(id => (
              <div key={id} className="card-hover" style={{ 
                padding: '2.5rem', 
                textAlign: 'center', 
                background: 'white', 
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ 
                  background: 'var(--bg)', 
                  padding: '2rem', 
                  borderRadius: '24px', 
                  border: '1px solid var(--border)', 
                  marginBottom: '1.5rem', 
                  display: 'inline-block',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <QRCodeSVG value={`${window.location.origin}/table/${id}`} size={160} fgColor="var(--secondary)" />
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.8rem', color: 'var(--secondary)' }}>Table {id}</h3>
                <Link 
                  to={`/table/${id}`} 
                  style={{ 
                    fontSize: '1rem', 
                    color: 'var(--primary)', 
                    textDecoration: 'none', 
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '30px',
                    background: 'var(--bg)'
                  }}
                >
                  View Digital Menu <ChevronRight size={18} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '10rem', textAlign: 'center', padding: '6rem 0', borderTop: '1px solid var(--border)', background: 'white' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1.5rem', opacity: 0.9 }} />
        <p className="brand" style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Hade Panjingan</p>
        <p style={{ color: 'var(--primary)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '1rem' }}>FOODCOURT & HOMESTAY</p>
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Les Village - Bali</p>
        <div style={{ marginTop: '3rem', fontSize: '0.8rem', color: 'var(--text-light)', opacity: 0.6 }}>
          © 2026 Hade Panjingan Bali. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
