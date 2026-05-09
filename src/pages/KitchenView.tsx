import { useStore, OrderStatus } from '../store/useStore';
import { ChefHat, Flame, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function KitchenView() {
  const { orders, updateOrderStatus } = useStore();
  
  const kitchenOrders = orders.filter(o => ['verified', 'processing', 'ready'].includes(o.status));

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ color: 'var(--text)', background: 'var(--surface)', padding: '0.6rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 className="gradient-text" style={{ fontSize: '2.2rem' }}>Kitchen Display</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>To Prepare</p>
            <h2 style={{ color: '#3498db', fontSize: '2rem' }}>{orders.filter(o => o.status === 'verified').length}</h2>
          </div>
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>Cooking</p>
            <h2 style={{ color: '#e67e22', fontSize: '2rem' }}>{orders.filter(o => o.status === 'processing').length}</h2>
          </div>
          <div className="card" style={{ padding: '1rem 2rem', textAlign: 'center', minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase' }}>Ready</p>
            <h2 style={{ color: '#2ecc71', fontSize: '2rem' }}>{orders.filter(o => o.status === 'ready').length}</h2>
          </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {kitchenOrders.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
             <ChefHat size={64} style={{ color: 'var(--border)', marginBottom: '1.5rem' }} />
             <h2 style={{ color: 'var(--text-light)', fontSize: '1.5rem' }}>No orders in queue</h2>
             <p style={{ color: 'var(--text-light)', opacity: 0.7 }}>Enjoy a quick break!</p>
          </div>
        ) : (
          kitchenOrders.map(order => (
            <div key={order.id} className="card animate-fade-in" style={{ overflow: 'hidden', borderTop: `8px solid ${getStatusColor(order.status)}` }}>
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.01)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Table {order.tableId}</h3>
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
                        <span style={{ fontWeight: '800' }}>Note:</span> {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', gap: '0.8rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.01)' }}>
                {order.status === 'verified' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    style={{ flex: 1, background: '#e67e22', color: 'white', padding: '1.1rem', gap: '0.6rem', fontSize: '1rem' }}
                  >
                    <Flame size={20} /> START COOKING
                  </button>
                )}
                {order.status === 'processing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    style={{ flex: 1, background: '#2ecc71', color: 'white', padding: '1.1rem', gap: '0.6rem', fontSize: '1rem' }}
                  >
                    <CheckCircle size={20} /> READY TO SERVE
                  </button>
                )}
                {order.status === 'ready' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    style={{ flex: 1, background: 'var(--secondary)', color: 'white', padding: '1.1rem', gap: '0.6rem', fontSize: '1rem' }}
                  >
                    <CheckCircle size={20} /> ORDER SERVED
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
