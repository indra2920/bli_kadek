import { useState, useEffect, useRef } from 'react';
import { useStore, OrderStatus, Order } from '../store/useStore';
import { CheckCircle, Printer, AlertCircle, Clock, ArrowLeft, Eye, BellRing, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { translations } from '../utils/translations';

export default function CashierView() {
  const { orders, updateOrderStatus, language, setLanguage } = useStore();
  const t = translations[language];
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [newOrderPopup, setNewOrderPopup] = useState<Order | null>(null);
  
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status !== 'pending' && o.status !== 'completed');
  
  const prevPendingCount = useRef(pendingOrders.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSystemStarted, setIsSystemStarted] = useState(false);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    // Check if a new pending order has arrived
    if (pendingOrders.length > prevPendingCount.current) {
      const latestOrder = pendingOrders[pendingOrders.length - 1];
      setNewOrderPopup(latestOrder);
      
      // Start looping sound if system is started
      if (isSystemStarted && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
        
        // Loop every 3 seconds
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          if (audioRef.current) audioRef.current.play().catch(() => {});
        }, 3000);
      }
    }
    prevPendingCount.current = pendingOrders.length;
  }, [pendingOrders, isSystemStarted]);

  // Stop sound when popup is closed
  useEffect(() => {
    if (!newOrderPopup && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [newOrderPopup]);

  const handleVerify = (orderId: string) => {
    updateOrderStatus(orderId, 'verified');
    if (newOrderPopup?.id === orderId) setNewOrderPopup(null);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <Link to="/" style={{ color: 'var(--secondary)', background: 'var(--surface)', padding: '0.8rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
              <ArrowLeft size={22} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
              <div>
                <h1 className="brand" style={{ fontSize: '1.8rem', color: 'var(--secondary)', lineHeight: 1 }}>Hade Panjingan</h1>
                <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{t.foodcourt}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', marginTop: '2px' }}>{t.cashierDashboard}</p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
             <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border)' }}>
               <button onClick={() => setLanguage('id')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'id' ? 'var(--primary)' : 'transparent', color: language === 'id' ? 'white' : 'var(--text-light)' }}>ID</button>
               <button onClick={() => setLanguage('en')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-light)' }}>EN</button>
             </div>
             <div style={{ padding: '0.5rem 1rem', background: '#e6fffa', color: '#38b2ac', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #b2f5ea' }}>
                <div style={{ width: '8px', height: '8px', background: '#38b2ac', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                {t.systemOnline}
             </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>{t.pendingVerification}</p>
              <h2 style={{ color: 'orange', fontSize: '1.8rem' }}>{pendingOrders.length}</h2>
            </div>
            <AlertCircle color="orange" size={32} opacity={0.2} />
          </div>
          <div className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>{t.activeOrders}</p>
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
            <AlertCircle color="orange" size={20} /> {t.needsVerification}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {pendingOrders.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
                <p style={{ color: 'var(--text-light)' }}>{t.allVerified}</p>
              </div>
            ) : (
              pendingOrders.map(order => (
                <div key={order.id} className="card animate-fade-in" style={{ padding: '1.5rem', borderLeft: '6px solid orange' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>{t.table} {order.tableId}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '700' }}>{order.customerName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '600' }}>{t.orderId.split(' ')[0]} #{order.id.toUpperCase().slice(0, 8)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <p style={{ fontWeight: '800', fontSize: '1.3rem', color: 'var(--secondary)' }}>Rp {order.total.toLocaleString()}</p>
                       <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  
                  {/* Payment Proof Preview */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>{t.paymentProof}</p>
                      <div style={{ 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem', 
                        fontWeight: '800',
                        background: order.paymentMethod === 'qris' ? '#e1f5fe' : '#fbe9e7',
                        color: order.paymentMethod === 'qris' ? '#0288d1' : '#d84315'
                      }}>
                        {order.paymentMethod === 'qris' ? 'QRIS' : 'TUNAI'}
                      </div>
                    </div>
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
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#e74c3c', fontSize: '0.85rem', fontWeight: '600' }}>{t.noProof}</div>
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
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                            {item.selectedVariants.map((v, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', background: '#e1f5fe', padding: '2px 6px', borderRadius: '6px', color: '#0288d1', fontWeight: '700', border: '1px solid #b3e5fc' }}>
                                Rasa: {v.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                            {item.selectedOptions.map((opt, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', background: 'var(--surface)', padding: '2px 6px', borderRadius: '6px', color: 'var(--primary)', fontWeight: '700', border: '1px solid var(--border)' }}>
                                + {opt.name}
                              </span>
                            ))}
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
                      <CheckCircle size={18} /> {t.verifyPayment}
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
            <Clock color="var(--primary)" size={20} /> {t.activeOrders}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeOrders.length === 0 ? (
               <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '2rem' }}>{language === 'en' ? 'No orders in progress.' : 'Tidak ada pesanan dalam antrean.'}</p>
            ) : (
              activeOrders.map(order => (
                <div key={order.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                      {order.tableId}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700' }}>{t.table} {order.tableId}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: order.status === 'verified' ? 'orange' : 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: order.status === 'verified' ? 'orange' : 'var(--primary)', fontWeight: '700' }}>{order.status === 'processing' ? t.prosesMasak : order.status}</span>
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
                        title={t.printKitchenSlip}
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
                {item.selectedVariants && item.selectedVariants.length > 0 && (
                  <div style={{ marginLeft: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                    Rasa: {item.selectedVariants.map(v => v.name).join(', ')}
                  </div>
                )}
                {item.selectedOptions && item.selectedOptions.length > 0 && (
                  <div style={{ marginLeft: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                    Extras: {item.selectedOptions.map(o => o.name).join(', ')}
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

      {/* New Order Alert Popup */}
      {newOrderPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(44, 24, 16, 0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="animate-fade-in" style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '450px', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.3)', border: '2px solid var(--accent)', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#fff9e6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '2px solid var(--accent)' }}>
              <BellRing color="var(--accent)" size={40} className="animate-pulse" />
            </div>
            
            <h2 style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{t.newOrder}</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', marginBottom: '2rem' }}>
              {t.newOrderDesc.replace('{table}', newOrderPopup.tableId).replace('{name}', newOrderPopup.customerName)}
            </p>
            
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: '600' }}>{t.totalTransaction}</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--secondary)' }}>Rp {newOrderPopup.total.toLocaleString()}</span>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setNewOrderPopup(null)}
                style={{ flex: 1, background: 'var(--bg)', color: 'var(--text-light)', padding: '1.2rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
              >
                {t.later}
              </button>
              <button 
                onClick={() => handleVerify(newOrderPopup.id)}
                style={{ flex: 2, background: 'var(--accent)', color: 'white', padding: '1.2rem', borderRadius: 'var(--radius)', fontSize: '1.1rem', fontWeight: '800', boxShadow: '0 10px 20px rgba(212, 163, 115, 0.3)' }}
              >
                {t.viewVerify}
              </button>
            </div>

            <button onClick={() => setNewOrderPopup(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-light)', background: 'none' }}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* System Activation Overlay */}
      {!isSystemStarted && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="card animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '100%', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', border: '2px solid var(--accent)' }}>
              <BellRing color="var(--accent)" size={50} />
            </div>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--secondary)', marginBottom: '1rem' }}>{t.cashierDashboard}</h1>
            <p style={{ color: 'var(--text-light)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>{t.activateNotif}</p>
            <button 
              onClick={() => {
                setIsSystemStarted(true);
                if (audioRef.current) {
                  audioRef.current.play().then(() => {
                    audioRef.current?.pause();
                    audioRef.current!.currentTime = 0;
                  }).catch(() => {});
                }
              }}
              style={{ width: '100%', background: 'var(--accent)', color: 'white', padding: '1.5rem', fontSize: '1.2rem', fontWeight: '800' }}
            >
              {t.startSystem}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .proof-img:hover { transform: scale(1.05); }
        .proof-overlay:hover { opacity: 1 !important; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .7; transform: scale(1.1); } }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; visibility: visible !important; }
    }
  `}</style>
    </div>
  );
}
