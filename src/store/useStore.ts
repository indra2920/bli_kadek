import { create } from 'zustand';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export type OrderStatus = 'pending' | 'verified' | 'processing' | 'ready' | 'completed';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  tableId: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: 'cash' | 'qris';
  createdAt: number;
  paymentProof?: string;
}

interface AppState {
  menu: MenuItem[];
  orders: Order[];
  tables: string[];
  qrisImage: string;
  isLoading: boolean;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (item: MenuItem) => Promise<void>;
  deleteMenuItem: (itemId: string) => Promise<void>;
  addTable: (tableId: string) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  setQrisImage: (image: string) => Promise<void>;
  updateOrderProof: (orderId: string, proof: string) => Promise<void>;
  uploadImage: (path: string, base64: string) => Promise<string>;
  seedData: () => Promise<void>;
  refreshData: () => Promise<void>;
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  initialize: () => void;
}

export const useStore = create<AppState>((set, get) => {
  return {
    menu: [],
    orders: [],
    tables: ['1', '2', '3', '4', '5'],
    qrisImage: '',
    isLoading: true,
    language: 'id',
    setLanguage: (lang: 'id' | 'en') => set({ language: lang }),

    // NEW: Initialization function to be called once
    initialize: () => {
      console.log("Initializing Hade Panjingan Store Listeners...");
      
      onSnapshot(collection(db, 'menu'), 
        (snapshot) => {
          const menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
          console.log(`[Store] Menu Sync: ${menu.length} items.`);
          set({ menu, isLoading: false });
        },
        (error) => {
          console.error('[Store] Menu Error:', error);
          set({ isLoading: false });
        }
      );

      onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), 
        (snapshot) => {
          const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
          set({ orders });
        }
      );

      onSnapshot(collection(db, 'settings'), 
        (snapshot) => {
          const settings: any = {};
          snapshot.docs.forEach(doc => {
            settings[doc.id] = doc.data();
          });
          if (settings.tables) set({ tables: settings.tables.list });
          if (settings.qris) set({ qrisImage: settings.qris.image });
        }
      );
    },

    // Backup Manual Fetch
    refreshData: async () => {
      set({ isLoading: true });
      try {
        const menuSnap = await getDocs(collection(db, 'menu'));
        const menu = menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
        set({ menu, isLoading: false });
      } catch (e) {
        console.error('[Store] Refresh Error:', e);
        set({ isLoading: false });
      }
    },

    addOrder: async (order) => {
      console.log("[Store] Processing order sync...");
      let finalProof = order.paymentProof;

      // Kompresi gambar bukti transfer agar ringan dan GRATIS (tidak butuh Firebase Storage)
      if (order.paymentProof && order.paymentProof.startsWith('data:image')) {
        console.log("[Store] Optimizing payment proof...");
        // Kita simpan langsung sebagai Base64 yang sudah dikompresi
        finalProof = order.paymentProof; 
      }

      console.log("[Store] Creating Firestore document...");
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        paymentProof: finalProof,
        status: 'pending',
        createdAt: Date.now()
      });
      console.log("[Store] Order created successfully with ID:", docRef.id);
    },

    updateOrderStatus: async (orderId, status) => {
      console.log(`[Store] Updating order ${orderId} to ${status}`);
      await updateDoc(doc(db, 'orders', orderId), { status });
    },

    addMenuItem: async (item) => {
      console.log("[Store] Adding menu item to Firestore...", item.name);
      try {
        const docRef = await addDoc(collection(db, 'menu'), item);
        console.log("[Store] Menu item added with ID:", docRef.id);
      } catch (err: any) {
        console.error("[Store] ADD MENU ERROR:", err);
        alert("GAGAL MENAMBAH MENU: " + err.message);
      }
    },

    updateMenuItem: async (item) => {
      const { id, ...data } = item;
      console.log(`[Store] Updating menu item ${id} (${item.name})`);
      try {
        if (!id) throw new Error("ID Menu tidak ditemukan!");
        await setDoc(doc(db, 'menu', id), data, { merge: true });
      } catch (err: any) {
        console.error("UPDATE ERROR:", err);
        alert("GAGAL UPDATE MENU: " + err.message);
      }
    },

    deleteMenuItem: async (itemId) => {
      console.log(`[Store] Deleting menu item ${itemId}`);
      await deleteDoc(doc(db, 'menu', itemId));
    },

    addTable: async (tableId) => {
      const currentTables = get().tables;
      const newList = [...currentTables, tableId].sort((a, b) => parseInt(a) - parseInt(b));
      await setDoc(doc(db, 'settings', 'tables'), { list: newList });
    },

    deleteTable: async (tableId) => {
      const currentTables = get().tables;
      const newList = currentTables.filter(t => t !== tableId);
      await setDoc(doc(db, 'settings', 'tables'), { list: newList });
    },

    setQrisImage: async (image) => {
      await setDoc(doc(db, 'settings', 'qris'), { image });
    },

    updateOrderProof: async (orderId, proof) => {
      let finalProof = proof;
      if (proof.startsWith('data:image')) {
        finalProof = await get().uploadImage(`proofs/${orderId}`, proof);
      }
      await updateDoc(doc(db, 'orders', orderId), { paymentProof: finalProof });
    },

    uploadImage: async (path, base64) => {
      const storageRef = ref(storage, path);
      await uploadString(storageRef, base64, 'data_url');
      return await getDownloadURL(storageRef);
    },

    seedData: async () => {
      const initialMenu = [
        { name: 'Nasi Goreng Spesial Hade', description: 'Nasi goreng bumbu rempah Bali dengan sate lilit dan telor mata sapi', price: 45000, category: 'Main Course', image: 'https://images.unsplash.com/photo-1512058560366-cd2427ff5961?auto=format&fit=crop&q=80&w=600' },
        { name: 'Ayam Betutu Gilimanuk', description: 'Ayam kukus bumbu rempah khas Bali yang meresap sempurna', price: 85000, category: 'Main Course', image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=600' },
        { name: 'Sate Lilit Ikan', description: 'Sate ikan cincang dengan parutan kelapa dan batang sereh', price: 35000, category: 'Appetizer', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600' },
        { name: 'Es Daluman', description: 'Minuman tradisional cincau hijau dengan santan dan gula aren', price: 15000, category: 'Drinks', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=600' },
        { name: 'Kopi Bali Boutique', description: 'Kopi hitam khas Bali dengan aroma yang kuat dan nikmat', price: 20000, category: 'Drinks', image: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&q=80&w=600' },
      ];

      for (const item of initialMenu) {
        await addDoc(collection(db, 'menu'), item);
      }

      await setDoc(doc(db, 'settings', 'tables'), { list: ['1', '2', '3', '4', '5'] });
      alert('Database initialized with default data!');
    }
  };
});


