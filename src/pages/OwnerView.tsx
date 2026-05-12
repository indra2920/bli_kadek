import { useStore, MenuItem } from '../store/useStore';
import { QRCodeCanvas } from 'qrcode.react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart3, TrendingUp, UtensilsCrossed, ArrowLeft, DollarSign, ShoppingBag, Plus, Edit2, Trash2, X, Upload, Activity } from 'lucide-react';
import { compressImage } from '../utils/compression';
import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { translations } from '../utils/translations';

export default function OwnerView() {
  const { orders, menu, addMenuItem, updateMenuItem, deleteMenuItem, qrisImage, setQrisImage, tables, addTable, deleteTable, refreshData, isLoading, language, setLanguage } = useStore();
  const t = translations[language];

  useEffect(() => {
    refreshData();
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingTable, setPrintingTable] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'Main Course',
    description: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
  });

  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalSales = completedOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesTrend = [45, 60, 55, 80, 95, 75, 90]; 

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        price: 0,
        category: 'Main Course',
        description: '',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400'
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Ultra-fast dimensions
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // High compression (0.5) for instant upload
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
        setFormData({ ...formData, image: compressedBase64 });
        
        // Clean up memory
        URL.revokeObjectURL(img.src);
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparation
    const menuData = {
      name: formData.name,
      price: Number(formData.price),
      category: formData.category,
      description: formData.description,
      image: formData.image
    };

    const isEdit = !!editingItem;
    const itemId = editingItem?.id;

    // 1. CLOSE MODAL IMMEDIATELY for "Super Fast" feel
    setIsModalOpen(false);
    setEditingItem(null);

    // 2. Perform the update in the background (Optimistic UI)
    try {
      if (isEdit && itemId) {
        await updateMenuItem({ id: itemId, ...menuData } as MenuItem);
      } else {
        await addMenuItem(menuData as any);
      }
    } catch (error) {
      console.error('Save failed in background:', error);
      alert('Maaf, perubahan terakhir gagal disimpan. Silakan cek koneksi internet Anda.');
    }
  };

  const handlePrintQR = (tableId: string) => {
    setPrintingTable(tableId);
    setTimeout(() => {
      window.print();
      setPrintingTable(null);
    }, 500);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <Link to="/" style={{ color: 'var(--secondary)', background: 'var(--surface)', padding: '0.8rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            <ArrowLeft size={22} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '65px', height: '65px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: 'var(--shadow-sm)' }} />
            <div>
              <h1 className="brand" style={{ fontSize: '1.8rem', color: 'var(--secondary)', lineHeight: 1 }}>Hade Panjingan</h1>
              <p style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{t.foodcourt}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: '700', marginTop: '2px' }}>{t.ownerDashboard}</p>
              <Link to="/debug" style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', textDecoration: 'none' }}>
                <Activity size={10} /> {language === 'en' ? 'CHECK CONNECTION' : 'CEK KONEKSI SERVER'}
              </Link>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: '20px', padding: '2px', border: '1px solid var(--border)', width: 'fit-content' }}>
           <button onClick={() => setLanguage('id')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'id' ? 'var(--primary)' : 'transparent', color: language === 'id' ? 'white' : 'var(--text-light)' }}>ID</button>
           <button onClick={() => setLanguage('en')} style={{ padding: '4px 12px', borderRadius: '18px', fontSize: '0.75rem', fontWeight: '800', background: language === 'en' ? 'var(--primary)' : 'transparent', color: language === 'en' ? 'white' : 'var(--text-light)' }}>EN</button>
        </div>
      </header>

      {/* Analytics Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        <StatCard 
          icon={<DollarSign size={24} color="#27ae60" />} 
          label={t.revenue} 
          value={`Rp ${totalSales.toLocaleString()}`}
          trend="+12.5% from last week"
        />
        <StatCard 
          icon={<ShoppingBag size={24} color="#3498db" />} 
          label={t.totalOrders} 
          value={totalOrders.toString()}
          trend={`${orders.filter(o => o.status === 'pending').length} pending orders`}
        />
        <StatCard 
          icon={<TrendingUp size={24} color="#e67e22" />} 
          label={t.avgOrderValue} 
          value={`Rp ${avgOrderValue.toLocaleString()}`}
          trend="Steady growth"
        />
      </div>

      <div className="grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Sales Performance */}
        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
            <BarChart3 size={20} color="var(--primary)" /> {t.salesPerformance}
          </h2>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 10px' }}>
            {salesTrend.map((val, i) => (
              <div key={i} style={{ flex: 1, position: 'relative' }}>
                <div 
                  style={{ 
                    height: `${val}%`, 
                    background: i === salesTrend.length - 1 ? 'var(--primary)' : 'var(--border)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 1s ease-out'
                  }} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', fontWeight: 600 }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                </span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '3.5rem', fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center' }}>
            Daily revenue trend for the last 7 days
          </p>
        </section>

        {/* Menu Management */}
        <section className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
              <UtensilsCrossed size={20} color="var(--primary)" /> {t.menus}
            </h2>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button 
                onClick={async () => {
                  try {
                    const items = menu;
                    if (items.length === 0) {
                      alert('Tidak ada menu untuk disinkronkan. Tambahkan menu dulu!');
                      return;
                    }
                    for(const item of items) {
                      await updateMenuItem(item);
                    }
                    alert('Sinkronisasi Berhasil ke Proyek: bli-kadek-resto! ☁️');
                  } catch (err: any) {
                    console.error(err);
                    alert('GAGAL SINKRON: ' + err.message);
                  }
                }}
                style={{ padding: '0.6rem 1rem', background: '#27ae60', color: 'white', fontSize: '0.8rem' }}
              >
                {t.syncCloud}
              </button>
              <button 
                onClick={() => handleOpenModal()}
                style={{ padding: '0.6rem 1.2rem', background: 'var(--primary)', color: 'white', fontSize: '0.85rem', gap: '0.4rem' }}
              >
                <Plus size={16} /> {t.addItem}
              </button>
            </div>
          </div>
          <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Menghubungkan ke Cloud...</p>
              </div>
            ) : menu.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>Menu is empty.</p>
                <button 
                  onClick={() => useStore.getState().seedData()}
                  style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.6rem 1rem' }}
                >
                  Load Default Menu
                </button>
              </div>
            ) : (
              menu.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100';
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Rp {item.price.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenModal(item)} style={{ padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                      <Edit2 size={14} color="var(--text-light)" />
                    </button>
                    <button onClick={() => deleteMenuItem(item.id)} style={{ padding: '0.5rem', background: '#fff5f5', borderRadius: '8px' }}>
                      <Trash2 size={14} color="#e74c3c" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginTop: '2.5rem' }}>
        {/* Table Management */}
        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{t.tableManagement}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
            {tables.map(table => (
              <div key={table} style={{ position: 'relative', textAlign: 'center', padding: '1.2rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg)' }}>
                <button 
                  onClick={() => deleteTable(table)}
                  style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', background: '#fff5f5', padding: '4px', borderRadius: '50%' }}
                >
                  <Trash2 size={12} color="#e74c3c" />
                </button>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>{t.table} {table}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>{t.activeQR}</div>
                <button 
                  onClick={() => handlePrintQR(table)}
                  style={{ marginTop: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', width: '100%', borderRadius: '6px' }}
                >
                  {t.printQR}
                </button>
              </div>
            ))}
            <button 
              onClick={() => {
                const nextTable = (Math.max(...tables.map(Number)) + 1).toString();
                addTable(nextTable);
              }}
              style={{ padding: '1.2rem', border: '2px dashed var(--border)', background: 'none', flexDirection: 'column', color: 'var(--text-light)' }}
            >
              <Plus size={20} />
              <span style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>{t.addTable}</span>
            </button>
          </div>
        </section>

        {/* QRIS Configuration */}
        <section className="card" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{t.paymentQRIS}</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t.qrisUpdateDesc}</p>
          <div 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = async (e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const base64 = reader.result as string;
                    // Simpan langsung ke database sebagai Base64 agar GRATIS (tidak butuh Firebase Storage)
                    await setQrisImage(base64);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            style={{ 
              width: '100%', 
              height: '200px', 
              border: '2px dashed var(--border)', 
              borderRadius: 'var(--radius)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              background: 'var(--bg)'
            }}
          >
            {qrisImage ? (
              <img src={qrisImage} alt="QRIS" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem' }} />
            ) : (
              <>
                <Upload size={40} color="var(--text-light)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.8rem' }}>{t.clickToUpload}</span>
              </>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '6px', textAlign: 'center' }}>
              {t.changeQRIS}
            </div>
          </div>
        </section>
      </div>

      {/* Recent Orders */}
      <section className="card" style={{ marginTop: '2.5rem', padding: '2rem', overflowX: 'auto' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{t.recentActivity}</h2>
        <div style={{ minWidth: '600px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem' }}>{t.orderId}</th>
                <th style={{ padding: '1rem' }}>{t.tableManagement.split(' ')[0].toUpperCase()}</th>
                <th style={{ padding: '1rem' }}>{t.status}</th>
                <th style={{ padding: '1rem' }}>{t.total.toUpperCase()}</th>
                <th style={{ padding: '1rem' }}>{t.time}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Memuat data transaksi...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-light)' }}>No transactions recorded yet.</td></tr>
              ) : (
                orders.slice().reverse().slice(0, 8).map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-light)' }}>#{order.id.toUpperCase().slice(0, 6)}</td>
                    <td style={{ padding: '1rem' }}>Table {order.tableId}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: order.status === 'completed' ? '#eafaf1' : '#fff9e6',
                        color: order.status === 'completed' ? '#27ae60' : '#f39c12'
                      }}>
                        {order.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '700' }}>Rp {order.total.toLocaleString()}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', padding: '2.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', position: 'relative', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }} className="animate-fade-in">
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'var(--bg)', padding: '0.5rem', borderRadius: '50%' }}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{editingItem ? 'Edit Item' : 'New Item'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)' }}>NAME</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: '12px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)' }}>PRICE (RP)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })} style={{ width: '100%', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)' }}>CATEGORY</label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'white' }}>
                    <option>Main Course</option><option>Appetizer</option><option>Side Dish</option><option>Drinks</option><option>Dessert</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)' }}>DESCRIPTION</label>
                <textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.9rem', border: '1px solid var(--border)', borderRadius: '12px', resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-light)' }}>IMAGE</label>
                <div onClick={() => fileInputRef.current?.click()} style={{ width: '100%', height: '120px', border: '2px dashed var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                  <img src={formData.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  width: '100%', 
                  padding: '1.1rem', 
                  background: isSubmitting ? 'var(--border)' : 'var(--secondary)', 
                  color: 'white', 
                  fontSize: '1.1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.8rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    Menyimpan...
                  </>
                ) : (
                  editingItem ? 'Save Changes' : 'Create Item'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Print Template for Table QR */}
      {printingTable && (
        <div className="print-only" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ marginBottom: '20px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <h1 style={{ fontSize: '24px', margin: '10px 0' }}>Hade Panjingan</h1>
            <p style={{ fontSize: '14px', color: '#666' }}>Foodcourt & Homestay</p>
          </div>
          
          <div style={{ display: 'inline-block', padding: '20px', border: '2px solid #333', borderRadius: '20px', background: 'white' }}>
            <QRCodeCanvas 
              value={`${window.location.origin}/table/${printingTable}`}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <h2 style={{ fontSize: '48px', marginTop: '30px', fontWeight: '800' }}>MEJA {printingTable}</h2>
          <p style={{ fontSize: '16px', marginTop: '10px', color: '#333' }}>Silakan Scan untuk Memesan</p>
          
          <div style={{ marginTop: '40px', fontSize: '12px', color: '#999' }}>
            Powered by Bli Kadek Smart Menu
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; visibility: visible !important; }
          body { background: white !important; }
          .container { padding: 0 !important; max-width: none !important; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon, label, value, trend }: { icon: any, label: string, value: string, trend: string }) {
  return (
    <div className="card card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ padding: '0.6rem', background: 'var(--bg)', borderRadius: '12px' }}>{icon}</div>
        <span style={{ color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: '600', background: '#eafaf1', padding: '4px 10px', borderRadius: '20px', width: 'fit-content' }}>{trend}</div>
    </div>
  );
}
