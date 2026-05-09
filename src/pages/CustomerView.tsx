import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore, Order, OrderItem, MenuItem } from '../store/useStore';
import { ShoppingCart, CheckCircle2, Loader2, X, Camera, ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from '../utils/compression';

export default function CustomerView() {
  const { tableId } = useParams();
  const { menu, addOrder, orders, qrisImage, refreshData } = useStore();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [checkoutStep, setCheckoutStep] = useState<'browsing' | 'payment' | 'tracking'>('browsing');
  const [tempOrderId, setTempOrderId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const activeOrder = orders.filter(o => o.tableId === tableId).reverse()[0];

  useEffect(() => {
    console.log("Starting database listener for project: bli-kadek-resto");
    
    // Direct listener for this tab with error alerting
    const unsubscribe = onSnapshot(collection(db, 'menu'), 
      (snapshot) => {
        const menuData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        console.log("Received menu data, count:", menuData.length);
        useStore.setState({ menu: menuData });
      },
      (error) => {
        console.error('DATABASE ERROR:', error);
        alert('MASALAH KONEKSI DATABASE: ' + error.message + '\n\nPastikan Security Rules di Firebase Console diatur ke "allow read, write: if true;"');
      }
    );
    
    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    return ['All', ...new Set(menu.map(item => item.category))];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const currentCat = categories[catIndex];
    if (currentCat === 'All') return menu;
    return menu.filter(item => item.category === currentCat);
  }, [menu, categories, catIndex]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const updateCartItemNote = (itemId: string, note: string) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const paginate = (newDirection: number) => {
    const nextIndex = catIndex + newDirection;
    if (nextIndex >= 0 && nextIndex < categories.length) {
      setDirection(newDirection);
      setCatIndex(nextIndex);
    }
  };

  const handleCheckout = () => {
    setTempOrderId(Math.random().toString(36).substr(2, 9));
    setCheckoutStep('payment');
  };

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const handleSubmitPayment = async () => {
    if (!tempOrderId || !paymentProof) return;
    setIsSubmittingOrder(true);
    try {
      const newOrder: any = {
        tableId: tableId || '?',
        items: cart,
        total,
        status: 'pending',
        createdAt: Date.now(),
        paymentProof: paymentProof
      };
      await addOrder(newOrder);
      setCart([]);
      setCheckoutStep('tracking');
      setIsCartOpen(false);
    } catch (err: any) {
      alert('Gagal mengirim pesanan: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
      transformPerspective: 1000,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      zIndex: 1,
      transformPerspective: 1000,
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? 90 : -90,
      opacity: 0,
      zIndex: 0,
      transformPerspective: 1000,
    }),
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '100px', overflowX: 'hidden', background: '#faf9f6', minHeight: '100vh' }}>
      {/* Header */}
      <div className="glass" style={{ 
        padding: '1.2rem 1.5rem', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        boxShadow: 'var(--shadow)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(253, 250, 245, 0.9)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '55px', height: '55px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
          <div>
            <h1 className="brand" style={{ fontSize: '1.3rem', color: 'var(--secondary)', lineHeight: 1.1 }}>Hade Panjingan</h1>
            <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1px' }}>Foodcourt & Homestay</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-light)', fontSize: '0.75rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27ae60' }} />
              Table {tableId}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {activeOrder && (
            <button onClick={() => setCheckoutStep('tracking')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.6rem 1.1rem', borderRadius: '40px', color: 'var(--primary-dark)' }}>
              <Loader2 size={18} className={activeOrder.status !== 'completed' ? "animate-spin" : ""} />
            </button>
          )}
          <button onClick={() => setIsCartOpen(true)} style={{ background: 'var(--secondary)', color: 'white', padding: '0.8rem 1.4rem', borderRadius: '40px', gap: '0.8rem', boxShadow: 'var(--shadow-sm)' }}>
            <ShoppingCart size={20} /> <span style={{ fontWeight: '800' }}>{cart.length}</span>
          </button>
        </div>
      </div>

      {/* Book Container */}
      <div className="container" style={{ marginTop: '2rem', perspective: '2000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button 
            disabled={catIndex === 0} 
            onClick={() => paginate(-1)}
            style={{ background: 'var(--surface)', padding: '0.8rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', opacity: catIndex === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)' }}>{categories[catIndex]}</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', letterSpacing: '0.1em' }}>PAGE {catIndex + 1} OF {categories.length}</p>
          </div>
          <button 
            disabled={catIndex === categories.length - 1} 
            onClick={() => paginate(1)}
            style={{ background: 'var(--surface)', padding: '0.8rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', opacity: catIndex === categories.length - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={{ minHeight: '60vh' }}>
          {filteredMenu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
              <p style={{ marginBottom: '1.5rem' }}>Sedang memuat menu atau menu masih kosong...</p>
              <button 
                onClick={handleRefresh}
                style={{ 
                  background: 'var(--secondary)', 
                  color: 'white', 
                  padding: '0.8rem 1.5rem', 
                  borderRadius: '30px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  margin: '0 auto'
                }}
              >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                Cek Menu Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1.2rem', padding: '5px' }}>
              {filteredMenu.map(item => (
                <div key={item.id} className="card-hover" style={{ 
                  overflow: 'hidden', 
                  background: 'white', 
                  borderRadius: '24px', 
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ position: 'relative', height: '150px', overflow: 'hidden' }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300';
                      }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--secondary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800' }}>
                      Rp {(item.price/1000).toFixed(0)}k
                    </div>
                  </div>
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--secondary)', fontWeight: '700' }}>{item.name}</h3>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', height: '1.8rem', overflow: 'hidden', marginBottom: '1rem', lineHeight: 1.3 }}>{item.description}</p>
                    <button 
                      onClick={() => addToCart(item)}
                      style={{ 
                        marginTop: 'auto',
                        width: '100%', 
                        background: 'var(--bg)', 
                        color: 'var(--primary-dark)', 
                        padding: '0.5rem', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem',
                        border: '1px solid var(--border)',
                        fontWeight: '700'
                      }}
                    >
                      + Tambah
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}


      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              style={{ width: '100%', maxWidth: '400px', background: 'var(--bg)', height: '100%', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '1.5rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem' }}>Your Selection</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'var(--bg)', padding: '0.5rem' }}><X size={20} /></button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                     <ShoppingCart size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                     <p style={{ color: 'var(--text-light)' }}>Your cart is empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           <img src={item.image} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                           <div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{item.name}</h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>x{item.quantity}</p>
                           </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: '800', color: 'var(--secondary)' }}>Rp {(item.price * item.quantity).toLocaleString()}</p>
                          <button onClick={() => removeFromCart(item.id)} style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: '600', background: 'none', padding: 0 }}>Remove</button>
                        </div>
                      </div>
                      
                      {/* Special Request Note */}
                      <div style={{ background: 'var(--bg)', padding: '0.6rem', borderRadius: '8px', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                        <MessageSquare size={14} color="var(--primary)" />
                        <input 
                          type="text" 
                          placeholder="Special request (e.g. no spicy, extra egg)"
                          value={item.note || ''}
                          onChange={(e) => updateCartItemNote(item.id, e.target.value)}
                          style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', width: '100%', outline: 'none' }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="glass" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Amount</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--secondary)' }}>Rp {total.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    style={{ width: '100%', background: 'var(--secondary)', color: 'white', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    Proceed to Payment
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Step */}
      <AnimatePresence>
        {checkoutStep === 'payment' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 2000, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="brand gradient-text" style={{ fontSize: '1.8rem' }}>Payment</h2>
              <button onClick={() => setCheckoutStep('browsing')} style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '50%' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', textAlign: 'center' }}>
              <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem', maxWidth: '320px', margin: '0 auto 2.5rem' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/QRIS_logo.png" alt="QRIS" style={{ width: '120px', marginBottom: '1.5rem' }} />
                <div style={{ background: 'white', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  {qrisImage ? (
                     <img src={qrisImage} alt="Store QRIS" style={{ width: '100%', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ padding: '3rem 1rem', color: 'var(--text-light)', fontSize: '0.8rem', background: '#fcfcfc' }}>
                      QRIS QR Code will appear here.
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '1.5rem', fontWeight: '800', fontSize: '1.4rem', color: 'var(--secondary)' }}>Rp {total.toLocaleString()}</div>
              </div>

              <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Transfer Confirmation</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Scan the QRIS above, then upload the receipt.</p>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="card"
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    border: '2px dashed var(--primary)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'var(--surface)',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                >
                  {paymentProof ? (
                    <img src={paymentProof} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <Camera size={40} color="var(--primary)" />
                      <span style={{ marginTop: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>Select Screenshot</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      const compressed = await compressImage(base64);
                      setPaymentProof(compressed);
                    };
                    reader.readAsDataURL(file);
                  }
                }} accept="image/*" style={{ display: 'none' }} />
                
                <button 
                  disabled={!paymentProof || isSubmittingOrder}
                  onClick={handleSubmitPayment}
                  style={{ 
                    marginTop: '2rem', 
                    width: '100%', 
                    background: (paymentProof && !isSubmittingOrder) ? 'var(--accent)' : 'var(--border)', 
                    color: 'white', 
                    padding: '1.2rem', 
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem'
                  }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Sending Order...
                    </>
                  ) : 'Confirm Order'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Tracking */}
      <AnimatePresence>
        {checkoutStep === 'tracking' && activeOrder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 3000, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h2 className="brand gradient-text" style={{ fontSize: '2rem' }}>Order Status</h2>
              <button onClick={() => setCheckoutStep('browsing')} style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '50%' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              {[
                { status: 'pending', label: 'Verifying', desc: 'Checking your payment proof' },
                { status: 'verified', label: 'Confirmed', desc: 'Order sent to kitchen' },
                { status: 'processing', label: 'Cooking', desc: 'Chef is preparing your meal' },
                { status: 'ready', label: 'Ready!', desc: 'Coming to your table' },
              ].map((step, idx) => {
                const isCompleted = ['pending', 'verified', 'processing', 'ready', 'completed'].indexOf(activeOrder.status) > idx;
                const isCurrent = activeOrder.status === step.status;
                
                return (
                  <div key={step.status} style={{ display: 'flex', gap: '1.5rem', opacity: isCompleted || isCurrent ? 1 : 0.3 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '50%', 
                        background: isCompleted ? 'var(--accent)' : isCurrent ? 'var(--primary)' : 'var(--border)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isCompleted ? <CheckCircle2 size={22} /> : idx + 1}
                      </div>
                      {idx < 3 && <div style={{ width: '2px', flex: 1, background: isCompleted ? 'var(--accent)' : 'var(--border)', margin: '4px 0' }} />}
                    </div>
                    <div>
                      <h3 style={{ color: isCurrent ? 'var(--primary)' : 'inherit', fontSize: '1.1rem', fontWeight: '700' }}>{step.label}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={() => setCheckoutStep('browsing')} style={{ marginTop: '2rem', width: '100%', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '1.1rem', fontWeight: '700' }}>
              Back to Menu
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
      </div>
    </div>
  );
}
