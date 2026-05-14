import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore, Order, OrderItem, MenuItem } from '../store/useStore';
import { ShoppingCart, CheckCircle2, Loader2, X, Camera, ChevronLeft, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { compressImage } from '../utils/compression';
import { translations } from '../utils/translations';
import { generateDynamicQRIS } from '../utils/qris';
import { QRCodeCanvas } from 'qrcode.react';

export default function CustomerView() {
  const { tableId } = useParams();
  const { menu, addOrder, orders, qrisImage, qrisData, refreshData, isLoading, language, setLanguage } = useStore();
  const t = translations[language];
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [catIndex, setCatIndex] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [checkoutStep, setCheckoutStep] = useState<'browsing' | 'payment' | 'tracking'>('browsing');
  const [tempOrderId, setTempOrderId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('qris');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState<MenuItem | null>(null);
  const [tempSelectedOptions, setTempSelectedOptions] = useState<any[]>([]);
  const [tempSelectedVariants, setTempSelectedVariants] = useState<any[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const activeOrder = orders.filter(o => o.tableId === tableId).reverse()[0];

  const categories = useMemo(() => {
    return ['All', ...new Set(menu.map(item => item.category))];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const currentCat = categories[catIndex];
    if (currentCat === 'All') return menu;
    return menu.filter(item => item.category === currentCat);
  }, [menu, categories, catIndex]);

  const addToCart = (item: MenuItem, selectedOptions: any[] = [], selectedVariants: any[] = []) => {
    setCart(prev => {
      // Find exact same item with same options and variants
      const existingIndex = prev.findIndex(i => 
        i.id === item.id && 
        JSON.stringify(i.selectedOptions || []) === JSON.stringify(selectedOptions) &&
        JSON.stringify(i.selectedVariants || []) === JSON.stringify(selectedVariants)
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { ...item, quantity: 1, note: '', selectedOptions, selectedVariants }];
    });
    setSelectedItemForOptions(null);
    setTempSelectedOptions([]);
    setTempSelectedVariants([]);
  };

  const handleAddItemClick = (item: MenuItem) => {
    if ((item.options && item.options.length > 0) || (item.variants && item.variants.length > 0)) {
      setSelectedItemForOptions(item);
      setTempSelectedOptions([]);
      setTempSelectedVariants([]);
    } else {
      addToCart(item);
    }
  };

  const toggleTempOption = (option: any) => {
    setTempSelectedOptions(prev => {
      const exists = prev.find(o => o.name === option.name);
      if (exists) return prev.filter(o => o.name !== option.name);
      return [...prev, option];
    });
  };

  const toggleTempVariant = (variant: any) => {
    setTempSelectedVariants(prev => {
      const exists = prev.find(v => v.name === variant.name);
      if (exists) return prev.filter(v => v.name !== variant.name);
      return [...prev, variant];
    });
  };

  const updateCartItemNote = (itemId: string, note: string) => {
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce((sum, item) => {
    const optionsTotal = (item.selectedOptions || []).reduce((s, o) => s + o.price, 0);
    const variantsTotal = (item.selectedVariants || []).reduce((s, v) => s + v.price, 0);
    return sum + ((item.price + optionsTotal + variantsTotal) * item.quantity);
  }, 0);

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
  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      alert('Silakan isi nama Anda terlebih dahulu');
      return;
    }
    if (paymentMethod === 'qris' && !paymentProof) {
      alert('Silakan unggah bukti pembayaran QRIS');
      return;
    }
    
    setIsSubmittingOrder(true);
    try {
      const newOrder: any = {
        tableId: tableId || '?',
        customerName: customerName,
        items: cart,
        total,
        status: paymentMethod === 'cash' ? 'verified' : 'pending',
        paymentMethod: paymentMethod,
        createdAt: Date.now(),
        paymentProof: paymentMethod === 'qris' ? paymentProof : null
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
    <div className="animate-fade-in" style={{ paddingBottom: '100px', overflowX: 'hidden', minHeight: '100vh' }}>
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
            <p style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1px' }}>{t.foodcourt}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-light)', fontSize: '0.75rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#27ae60' }} />
              {t.table} {tableId}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border)' }}>
             <button onClick={() => setLanguage('id')} style={{ padding: '4px 10px', borderRadius: '18px', fontSize: '0.7rem', fontWeight: '800', background: language === 'id' ? 'var(--primary)' : 'transparent', color: language === 'id' ? 'white' : 'var(--text-light)' }}>ID</button>
             <button onClick={() => setLanguage('en')} style={{ padding: '4px 10px', borderRadius: '18px', fontSize: '0.7rem', fontWeight: '800', background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-light)' }}>EN</button>
          </div>
          <button onClick={() => setIsCartOpen(true)} style={{ background: 'var(--secondary)', color: 'white', padding: '0.7rem 1rem', borderRadius: '40px', gap: '0.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center' }}>
            <ShoppingCart size={18} /> <span style={{ fontWeight: '800' }}>{cart.length}</span>
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
            <h2 style={{ fontSize: '1.4rem', color: 'var(--secondary)' }}>{catIndex === 0 && language === 'en' ? 'All' : categories[catIndex]}</h2>
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
          {isLoading ? (
             <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)' }}>
                <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1.5rem', color: 'var(--primary)' }} />
                <p>{t.loading}</p>
             </div>
          ) : filteredMenu.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍃</div>
              <p style={{ marginBottom: '1.5rem' }}>{t.emptyMenu}</p>
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
                {t.reloadMenu}
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
                      onClick={() => handleAddItemClick(item)}
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
                      + {t.add}
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
                <h2 style={{ fontSize: '1.5rem' }}>{t.yourSelection}</h2>
                <button onClick={() => setIsCartOpen(false)} style={{ background: 'var(--bg)', padding: '0.5rem' }}><X size={20} /></button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                     <ShoppingCart size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
                     <p style={{ color: 'var(--text-light)' }}>{t.cartEmpty}</p>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const itemOptionsTotal = (item.selectedOptions || []).reduce((s, o) => s + o.price, 0);
                    const itemVariantsTotal = (item.selectedVariants || []).reduce((s, v) => s + v.price, 0);
                    return (
                      <div key={index} className="card" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                             <img src={item.image} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                             <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{item.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>x{item.quantity}</p>
                             </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontWeight: '800', color: 'var(--secondary)' }}>Rp {((item.price + itemOptionsTotal + itemVariantsTotal) * item.quantity).toLocaleString()}</p>
                            <button onClick={() => removeFromCart(index)} style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: '600', background: 'none', padding: 0 }}>{t.delete}</button>
                          </div>
                        </div>
                        
                        {/* Variants List */}
                        {item.selectedVariants && item.selectedVariants.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            {item.selectedVariants.map((v, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', background: '#f0f9ff', padding: '2px 8px', borderRadius: '10px', color: '#0369a1', fontWeight: '700', border: '1px solid #bae6fd' }}>
                                Rasa: {v.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Options List */}
                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.8rem' }}>
                            {item.selectedOptions.map((opt, i) => (
                              <span key={i} style={{ fontSize: '0.65rem', background: 'var(--surface)', padding: '2px 8px', borderRadius: '10px', color: 'var(--primary)', fontWeight: '700', border: '1px solid var(--border)' }}>
                                + {opt.name}
                              </span>
                            ))}
                          </div>
                        )}
                      
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
                  );
                })
              )}
              </div>

              {cart.length > 0 && (
                <div className="glass" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{t.totalAmount}</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--secondary)' }}>Rp {total.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    style={{ width: '100%', background: 'var(--secondary)', color: 'white', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                  >
                    {t.proceedToPayment}
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
              <h2 className="brand gradient-text" style={{ fontSize: '1.8rem' }}>{t.payment}</h2>
              <button onClick={() => setCheckoutStep('browsing')} style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '50%' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
              <div style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--secondary)' }}>{t.customerName}</label>
                <input 
                  type="text" 
                  placeholder={t.customerNamePlaceholder}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px solid var(--border)', background: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--secondary)' }}>{t.paymentMethod}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <button 
                    onClick={() => setPaymentMethod('qris')}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      border: paymentMethod === 'qris' ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: paymentMethod === 'qris' ? 'var(--surface)' : 'white',
                      fontWeight: '700',
                      color: paymentMethod === 'qris' ? 'var(--primary-dark)' : 'var(--text-light)'
                    }}
                  >
                    {t.qrisAuto}
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '2px solid var(--border)',
                      background: paymentMethod === 'cash' ? 'var(--surface)' : 'white',
                      fontWeight: '700',
                      color: paymentMethod === 'cash' ? 'var(--primary-dark)' : 'var(--text-light)'
                    }}
                  >
                    {t.cashAtCashier}
                  </button>
                </div>
              </div>

              {paymentMethod === 'qris' ? (
                <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', maxWidth: '320px', margin: '0 auto 1.5rem', textAlign: 'center' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/QRIS_logo.png" alt="QRIS" style={{ width: '120px', marginBottom: '1.5rem' }} />
                  <div style={{ background: 'white', padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                    {qrisData ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        <QRCodeCanvas 
                          value={generateDynamicQRIS(qrisData, total)}
                          size={256}
                          level="H"
                          includeMargin={true}
                          style={{ width: '100%', height: 'auto', maxWidth: '256px', margin: '0 auto' }}
                        />
                        <div style={{ background: 'var(--surface)', padding: '0.8rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600', border: '1px solid #ffe8cc' }}>
                          ✨ {t.qrisAutoDesc}
                        </div>
                      </div>
                    ) : qrisImage ? (
                      <img src={qrisImage} alt="Store QRIS" style={{ width: '100%', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ padding: '3rem 1rem', color: 'var(--text-light)', fontSize: '0.8rem', background: '#fcfcfc' }}>
                        QRIS QR Code will appear here.
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1.5rem', fontWeight: '800', fontSize: '1.4rem', color: 'var(--secondary)' }}>Rp {total.toLocaleString()}</div>
                </div>
              ) : (
                <div className="card" style={{ padding: '2.5rem 1.5rem', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem', textAlign: 'center', background: 'var(--surface)', border: '2px dashed var(--primary)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💵</div>
                  <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>{language === 'en' ? 'Cash Payment' : 'Pembayaran Tunai'}</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: 1.5 }}>{t.cashDesc.replace('{total}', `Rp ${total.toLocaleString()}`)}</p>
                </div>
              )}

              <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                {paymentMethod === 'qris' && (
                  <>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>{t.transferConfirmation}</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t.transferDesc}</p>
                    
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
                          <span style={{ marginTop: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>{t.selectScreenshot}</span>
                        </>
                      )}
                    </div>
                  </>
                )}
                
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      const compressed = await compressImage(base64, 600, 0.5);
                      setPaymentProof(compressed);
                    };
                    reader.readAsDataURL(file);
                  }
                }} accept="image/*" style={{ display: 'none' }} />
                
                <button 
                  disabled={isSubmittingOrder}
                  onClick={handleSubmitOrder}
                  style={{ 
                    marginTop: '2rem', 
                    width: '100%', 
                    background: isSubmittingOrder ? 'var(--border)' : 'var(--accent)', 
                    color: 'white', 
                    padding: '1.2rem', 
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.8rem',
                    borderRadius: '16px'
                  }}
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {t.processingUpload}
                    </>
                  ) : t.confirmOrder}
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
              <h2 className="brand gradient-text" style={{ fontSize: '2rem' }}>{t.orderStatus}</h2>
              <button onClick={() => setCheckoutStep('browsing')} style={{ background: 'var(--surface)', padding: '0.5rem', borderRadius: '50%' }}><X size={24} /></button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
              {[
                { status: 'pending', label: t.statusVerifying, desc: t.statusVerifyingDesc },
                { status: 'verified', label: t.statusConfirmed, desc: t.statusConfirmedDesc },
                { status: 'processing', label: t.statusCooking, desc: t.statusCookingDesc },
                { status: 'ready', label: t.statusReady, desc: t.statusReadyDesc },
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
              {t.backToMenu}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Selection Modal */}
      <AnimatePresence>
        {selectedItemForOptions && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            onClick={() => setSelectedItemForOptions(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ position: 'relative', height: '180px' }}>
                <img src={selectedItemForOptions.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => setSelectedItemForOptions(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '8px', borderRadius: '50%' }}><X size={18} /></button>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '1.5rem', color: 'white' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>{selectedItemForOptions.name}</h3>
                  <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>Rp {selectedItemForOptions.price.toLocaleString()}</p>
                </div>
              </div>

              <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }} className="hide-scrollbar">
                {/* Variants Section */}
                {selectedItemForOptions.variants && selectedItemForOptions.variants.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.2rem', color: 'var(--secondary)' }}>{t.selectVariants}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {selectedItemForOptions.variants.map((v, i) => {
                        const isSelected = tempSelectedVariants.some(o => o.name === v.name);
                        return (
                          <button 
                            key={i}
                            onClick={() => toggleTempVariant(v)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '1rem', 
                              borderRadius: '16px', 
                              border: isSelected ? '2px solid #0ea5e9' : '1px solid var(--border)',
                              background: isSelected ? '#f0f9ff' : 'white',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0ea5e9' }} />}
                              </div>
                              <span style={{ fontWeight: '700', color: isSelected ? '#0369a1' : 'var(--secondary)' }}>{v.name}</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>+ Rp {v.price.toLocaleString()}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Options Section */}
                {selectedItemForOptions.options && selectedItemForOptions.options.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.2rem', color: 'var(--secondary)' }}>{t.selectOptions}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {selectedItemForOptions.options.map((opt, i) => {
                        const isSelected = tempSelectedOptions.some(o => o.name === opt.name);
                        return (
                          <button 
                            key={i}
                            onClick={() => toggleTempOption(opt)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '1rem', 
                              borderRadius: '16px', 
                              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                              background: isSelected ? 'var(--surface)' : 'white',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {isSelected && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }} />}
                              </div>
                              <span style={{ fontWeight: '700', color: isSelected ? 'var(--primary-dark)' : 'var(--secondary)' }}>{opt.name}</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-light)' }}>+ Rp {opt.price.toLocaleString()}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => addToCart(selectedItemForOptions, tempSelectedOptions, tempSelectedVariants)}
                  style={{ width: '100%', background: 'var(--accent)', color: 'white', padding: '1.2rem', borderRadius: '16px', marginTop: '2rem', fontSize: '1.1rem', fontWeight: '800', boxShadow: '0 10px 20px rgba(212, 163, 115, 0.3)' }}
                >
                  {t.addToCart} • Rp {(selectedItemForOptions.price + tempSelectedOptions.reduce((s,o) => s + o.price, 0) + tempSelectedVariants.reduce((s,v) => s + v.price, 0)).toLocaleString()}
                </button>
              </div>
            </motion.div>
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
