import { useStore, OrderStatus } from '../store/useStore';
import { Utensils, Clock, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translations } from '../utils/translations';

export default function KitchenView() {
  const { orders, updateOrderStatus, language, setLanguage } = useStore();
  const t = translations[language];
  
  const kitchenOrders = orders.filter(o => ['verified', 'processing', 'ready'].includes(o.status));
  const ordersToPrepare = orders.filter(o => o.status === 'verified');
  const ordersCooking = orders.filter(o => o.status === 'processing');
  const ordersReady = orders.filter(o => o.status === 'ready');

  const getStatusColor = (status: OrderStatus) => {
    switch(status) {
      case 'verified': return '#3498db'; 
      case 'processing': return '#e67e22'; 
      case 'ready': return '#2ecc71'; 
      default: return 'var(--text-light)';
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <Link to="/" style={{ color: 'var(--secondary)', background: 'var(--surface)', padding: '0.8rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <ArrowLeft size={22} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
              <div>
                <h1 className="brand" style={{ fontSize: '1.5rem', color: 'var(--secondary)', lineHeight: 1 }}>Hade Panjingan</h1>
                <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{t.foodcourt}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', marginTop: '2px' }}>{t.kitchenDisplay}</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border)' }}>
             <button onClick={() => setLanguage('id')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'id' ? 'var(--primary)' : 'transparent', color: language === 'id' ? 'white' : 'var(--text-light)' }}>ID</button>
             <button onClick={() => setLanguage('en')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-light)' }}>EN</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>{t.toPrepare}</p>
            <h2 style={{ color: '#3498db', fontSize: '2rem' }}>{ordersToPrepare.length}</h2>
          </div>
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>{t.cooking}</p>
            <h2 style={{ color: '#e67e22', fontSize: '2rem' }}>{ordersCooking.length}</h2>
          </div>
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>{t.ready}</p>
            <h2 style={{ color: '#2ecc71', fontSize: '2rem' }}>{ordersReady.length}</h2>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {kitchenOrders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
             <Utensils size={64} style={{ color: 'var(--border)', marginBottom: '1.5rem' }} />
             <h2 style={{ color: 'var(--text-light)', fontSize: '1.5rem' }}>{t.noOrdersQueue}</h2>
          </div>
        ) : (
          kitchenOrders.map(order => (
            <div key={order.id} className="card animate-fade-in" style={{ overflow: 'hidden', borderTop: `8px solid ${getStatusColor(order.status)}` }}>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.01)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{t.table} {order.tableId}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', fontWeight: '700' }}>{order.customerName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>#{order.id.toUpperCase().slice(0, 8)}</p>
                </div>
                <div style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: '800', padding: '0.4rem 0.8rem', borderRadius: '20px', background: getStatusColor(order.status) + '22', color: getStatusColor(order.status) }}>
                  {order.status}
                </div>
              </div>
              
              <div className="hide-scrollbar" style={{ padding: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg)', color: 'var(--secondary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                        {item.quantity}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', paddingTop: '2px' }}>{item.name}</div>
                    </div>
                    {item.note && (
                      <div style={{ marginLeft: '42px', marginTop: '0.4rem', padding: '0.5rem', background: '#fff9e6', borderLeft: '3px solid #f39c12', borderRadius: '4px', fontSize: '0.85rem', color: '#7e5109' }}>
                        <span style={{ fontWeight: '800' }}>{t.note}:</span> {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                {order.status === 'verified' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    style={{ width: '100%', background: 'var(--secondary)', color: 'white', padding: '1rem', fontWeight: '800', fontSize: '0.9rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    {t.startCooking}
                  </button>
                )}
                {order.status === 'processing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    style={{ width: '100%', background: '#27ae60', color: 'white', padding: '1rem', fontWeight: '800', fontSize: '0.9rem', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}
                  >
                    <CheckCircle size={20} /> {t.readyToServe}
                  </button>
                )}
                {order.status === 'ready' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    style={{ flex: 1, background: 'var(--secondary)', color: 'white', padding: '1.1rem', gap: '0.6rem', fontSize: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <CheckCircle size={20} /> {t.orderServed}
                  </button>
                )}
                <button className="card" style={{ padding: '1.1rem', background: 'white' }}>
                  <Clock size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
