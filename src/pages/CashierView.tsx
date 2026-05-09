import { useState } from 'react';
import { useStore, OrderStatus, Order } from '../store/useStore';
import { CheckCircle, Printer, AlertCircle, Clock, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CashierView() {
  const { orders, updateOrderStatus } = useStore();
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status !== 'pending' && o.status !== 'completed');

  const handleVerify = (orderId: string) => {
    updateOrderStatus(orderId, 'verified');
  };

  const handlePrint = (order: Order) => {
    setPrintingOrder(order);
    
    // Give React time to render the print template
    setTimeout(() => {
      window.print();
      // Update status after print dialog closes (it blocks in most browsers)
      updateOrderStatus(order.id, 'processing');
      // Clear printing state after a short delay to ensure print process finished
      setTimeout(() => setPrintingOrder(null), 500);
    }, 300);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header className="no-print" style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/" style={{ color: 'var(--text)', background: 'var(--surface)', padding: '0.6rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
              <ArrowLeft size={20} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h1 className="gradient-text" style={{ fontSize: '1.6rem', lineHeight: 1 }}>Hade Panjingan</h1>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', marginTop: '0.2rem' }}>Foodcourt & Homestay</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontWeight: '700' }}>CASHIER DASHBOARD</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>PENDING VERIFICATION</p>
              <h2 style={{ color: 'orange', fontSize: '1.8rem' }}>{pendingOrders.length}</h2>
            </div>
            <AlertCircle color="orange" size={32} opacity={0.2} />
          </div>
          <div className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>ACTIVE ORDERS</p>
              <h2 style={{ color: 'var(--primary)', fontSize: '1.8rem' }}>{activeOrders.length}</h2>
            </div>
            <Clock color="var(--primary)" size={32} opacity={0.2} />
          </div>
        </div>
      </header>

      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
        {/* Pending Verification */}
        <section>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem' }}>
            <AlertCircle color="orange" size={20} /> Needs Verification
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {pendingOrders.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-light)' }}>All payments verified! 🎉</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="card animate-fade-in" style={{ padding: '1.5rem', borderLeft: '6px solid orange' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Table {order.tableId}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>ORDER #{order.id.toUpperCase().slice(0, 8)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <p style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--secondary)' }}>Rp {order.total.toLocaleString()}</p>
                       <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  {/* Payment Proof Preview */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Payment Proof</p>
                    {order.paymentProof ? (
                      <div 
                        onClick={() => {
                          const win = window.open();
                          win?.document.write(`<body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000;"><img src="${order.paymentProof}" style="max-width:100%;max-height:100vh;"></body>`);
                        }}
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
                      >
                        <img src={order.paymentProof} alt="Proof" style={{ width: '100%', height: '120px', objectFit: 'cover', transition: 'transform 0.3s' }} className="proof-img" />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.3s' }} className="proof-overlay">
                           <Eye color="white" />
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#e74c3c', fontSize: '0.85rem', fontWeight: '600' }}>No proof uploaded</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {order.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-light)' }}>{item.name}</span>
                          <span style={{ fontWeight: '600' }}>x{item.quantity}</span>
                        </div>
                        {item.note && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', marginTop: '2px', display: 'flex', gap: '4px' }}>
                             <span style={{ fontWeight: 'bold' }}>Note:</span> {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button 
                      onClick={() => handleVerify(order.id)}
                      style={{ flex: 1, background: 'var(--accent)', color: 'white', padding: '1rem', gap: '0.6rem', fontSize: '0.95rem' }}
                    >
                      <CheckCircle size={18} /> Verify Payment
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Verified / Processing */}
        <section>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem' }}>
            <Clock color="var(--primary)" size={20} /> Active Orders
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeOrders.length === 0 ? (
               <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>No orders in progress.</p>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {order.tableId}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>Table {order.tableId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: order.status === 'verified' ? 'orange' : 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: order.status === 'verified' ? 'orange' : 'var(--primary)', fontWeight: '700' }}>{order.status === 'processing' ? 'Proses Masak' : order.status}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>Rp {order.total.toLocaleString()}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{order.items.length} items</p>
                    </div>
                    {order.status === 'verified' && (
                      <button 
                        onClick={() => handlePrint(order)}
                        style={{ padding: '0.8rem', background: 'var(--secondary)', color: 'white' }}
                        title="Print Kitchen Slip"
                      >
                        <Printer size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Print Template (Kitchen Slip) */}
      {printingOrder && (
        <div className="print-only" style={{ padding: '20px', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '10px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '20px', margin: '0' }}>HADE PANJINGAN</h1>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>KITCHEN SLIP</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>TABLE: <strong>{printingOrder.tableId}</strong></span>
            <span>#{printingOrder.id.toUpperCase().slice(0, 5)}</span>
          </div>
          
          <div style={{ borderBottom: '1px dashed black', paddingBottom: '5px', marginBottom: '10px' }}>
            <span>Time: {new Date(printingOrder.createdAt).toLocaleTimeString()}</span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            {printingOrder.items.map((item, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.name}</span>
                </div>
                {item.note && (
                  <div style={{ marginLeft: '15px', fontSize: '12px' }}>
                    *** NOTE: {item.note} ***
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px dashed black', paddingTop: '10px' }}>
            <p style={{ fontSize: '12px' }}>PLEASE PREPARE IMMEDIATELY</p>
          </div>
        </div>
      )}

      <style>{`
        .proof-img:hover { transform: scale(1.05); }
        .proof-overlay:hover { opacity: 1 !important; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; visibility: visible !important; }
    }
  `}</style>
    </div>
  );
}
