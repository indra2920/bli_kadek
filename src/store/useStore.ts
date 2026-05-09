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
  items: OrderItem[];
  total: number;
  status: OrderStatus;
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
}

export const useStore = create<AppState>((set, get) => {
  // Initialize Real-time Listeners
  onSnapshot(collection(db, 'menu'), (snapshot) => {
    const menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    set({ menu });
  });

  onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    set({ orders });
  });

  onSnapshot(collection(db, 'settings'), (snapshot) => {
    const settings: any = {};
    snapshot.docs.forEach(doc => {
      settings[doc.id] = doc.data();
    });
    if (settings.tables) set({ tables: settings.tables.list });
    if (settings.qris) set({ qrisImage: settings.qris.image });
  });

  return {
    menu: [],
    orders: [],
    tables: ['1', '2', '3', '4', '5'],
    qrisImage: '',
    isLoading: false,

    addOrder: async (order) => {
      let finalProof = order.paymentProof;
      const tempId = Math.random().toString(36).substr(2, 9);
      
      if (order.paymentProof && order.paymentProof.startsWith('data:image')) {
        finalProof = await get().uploadImage(`proofs/${tempId}`, order.paymentProof);
      }

      await addDoc(collection(db, 'orders'), {
        ...order,
        paymentProof: finalProof,
        createdAt: Date.now()
      });
    },

    updateOrderStatus: async (orderId, status) => {
      await updateDoc(doc(db, 'orders', orderId), { status });
    },

    addMenuItem: async (item) => {
      await addDoc(collection(db, 'menu'), item);
    },

    updateMenuItem: async (item) => {
      const { id, ...data } = item;
      await updateDoc(doc(db, 'menu', id), data);
    },

    deleteMenuItem: async (itemId) => {
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
      // If it's a base64 string, upload it first
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
        { name: 'Nasi Goreng Bali', description: 'Authentic Balinese fried rice with sate lilit', price: 55000, category: 'Main Course', image: 'https://images.unsplash.com/photo-1601050638917-3f943569473b?auto=format&fit=crop&q=80&w=400' },
        { name: 'Bebek Betutu', description: 'Slow-cooked duck with rich Balinese spices', price: 125000, category: 'Main Course', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400' },
        { name: 'Sate Lilit', description: 'Minced fish sate on lemongrass sticks', price: 45000, category: 'Appetizer', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400' },
        { name: 'Lawar Ayam', description: 'Traditional Balinese vegetable and chicken mix', price: 35000, category: 'Side Dish', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400' },
        { name: 'Es Kelapa Muda', description: 'Fresh young coconut water', price: 25000, category: 'Drinks', image: 'https://images.unsplash.com/photo-1553177595-4de2bb0842b9?auto=format&fit=crop&q=80&w=400' },
      ];

      for (const item of initialMenu) {
        await addDoc(collection(db, 'menu'), item);
      }

      await setDoc(doc(db, 'settings', 'tables'), { list: ['1', '2', '3', '4', '5'] });
      alert('Database initialized with default data!');
    }
  };
});

