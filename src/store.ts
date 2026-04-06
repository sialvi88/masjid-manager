import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Language } from './translations';
import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs,
  setDoc,
  getDoc,
  where,
  limit,
  writeBatch
} from 'firebase/firestore';

const defaultLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#064e3b" /><stop offset="100%" stop-color="#022c22" /></linearGradient><linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#FDE047" /><stop offset="50%" stop-color="#EAB308" /><stop offset="100%" stop-color="#A16207" /></linearGradient></defs><circle cx="256" cy="256" r="240" fill="url(#bg-grad)" stroke="url(#gold)" stroke-width="12"/><circle cx="256" cy="256" r="215" fill="none" stroke="url(#gold)" stroke-width="3" stroke-dasharray="12 8" opacity="0.7"/><path d="M 156 320 C 156 180, 256 120, 256 90 C 256 120, 356 180, 356 320 Z" fill="url(#gold)"/><path d="M 176 320 C 176 200, 256 150, 256 120 C 256 150, 336 200, 336 320 Z" fill="#064e3b" opacity="0.5"/><rect x="96" y="180" width="24" height="140" fill="#ffffff"/><path d="M 86 180 L 130 180 L 108 110 Z" fill="url(#gold)"/><rect x="86" y="220" width="44" height="12" fill="url(#gold)"/><rect x="86" y="280" width="44" height="12" fill="url(#gold)"/><rect x="392" y="180" width="24" height="140" fill="#ffffff"/><path d="M 382 180 L 426 180 L 404 110 Z" fill="url(#gold)"/><rect x="382" y="220" width="44" height="12" fill="url(#gold)"/><rect x="382" y="280" width="44" height="12" fill="url(#gold)"/><path d="M 60 360 L 452 360 L 432 400 L 80 400 Z" fill="url(#gold)"/><rect x="136" y="320" width="240" height="40" fill="#ffffff"/><path d="M 226 360 L 226 330 C 226 310, 286 310, 286 330 L 286 360 Z" fill="#022c22"/><path d="M 166 360 L 166 340 C 166 325, 206 325, 206 340 L 206 360 Z" fill="#022c22"/><path d="M 306 360 L 306 340 C 306 325, 346 325, 346 340 L 346 360 Z" fill="#022c22"/><path d="M 256 40 A 24 24 0 1 0 276 80 A 28 28 0 1 1 256 40 Z" fill="url(#gold)"/><circle cx="256" cy="65" r="6" fill="url(#gold)"/></svg>`;
export const defaultLogoUrl = `data:image/svg+xml;base64,${btoa(defaultLogoSvg)}`;

export type Permission = 
  | 'manage_donations' 
  | 'manage_expenses' 
  | 'view_reports' 
  | 'manage_settings' 
  | 'manage_users';

export interface User {
  id: string;
  username: string;
  pin: string;
  role: string; // e.g., 'Admin', 'Manager', 'Cashier'
  permissions: Permission[];
}

export type UserRole = 'admin' | 'guest' | null;

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  details: string;
  user: string;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  date: string;
  percentage: number;
  collectorShare: number;
  netAmount: number;
  history: { timestamp: string; action: string; details: string; }[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface AppSettings {
  masjidName: string;
  madrisaName: string;
  logoUrl: string | null;
  currency: string;
  dateFormat: string;
  defaultPercentage: number;
}

interface AppState {
  language: Language;
  role: UserRole;
  adminPassword: string;
  globalPercentage: number;
  donations: Donation[];
  expenses: Expense[];
  deletedExpenses: Expense[]; // For undo functionality
  auditLogs: AuditLog[];
  settings: AppSettings;
  users: User[];
  currentUser: User | null;
  loading: boolean;
  
  // Actions
  setLanguage: (lang: Language) => void;
  fetchDataFromFirebase: () => void;
  login: (username: string, pin: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  setGlobalPercentage: (percentage: number, applyToOld: boolean) => Promise<void>;
  
  addDonation: (donation: Omit<Donation, 'id' | 'collectorShare' | 'netAmount' | 'history'>) => Promise<void>;
  updateDonation: (id: string, updates: Partial<Donation>, adminName?: string) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  duplicateDonation: (id: string) => Promise<void>;
  bulkDeleteDonations: (ids: string[]) => Promise<void>;
  bulkUpdateDonations: (ids: string[], updates: Partial<Donation>) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  undoDeleteExpense: () => Promise<void>;
  bulkDeleteExpenses: (ids: string[]) => Promise<void>;
  bulkUpdateExpenses: (ids: string[], updates: Partial<Expense>) => Promise<void>;

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  importData: (data: Partial<AppState>, merge: boolean) => Promise<void>;
  clearAuditLogs: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      role: null,
      adminPassword: 'admin123', // Default password
      globalPercentage: 10,
      donations: [],
      expenses: [],
      deletedExpenses: [],
      auditLogs: [],
      users: [],
      currentUser: null,
      loading: false,
      settings: {
        masjidName: 'جامع مسجد',
        madrisaName: 'مدرسہ اسلامیہ',
        logoUrl: defaultLogoUrl,
        currency: 'Rs',
        dateFormat: 'DD-MM-YYYY',
        defaultPercentage: 10,
      },

      setLanguage: (lang) => set({ language: lang }),

      fetchDataFromFirebase: () => {
        set({ loading: true });
        
        console.log("Setting up Firestore listeners...");

        // Listen for donations
        onSnapshot(query(collection(db, 'donations'), orderBy('date', 'desc')), (snapshot) => {
          const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
          set({ donations });
        }, (error) => {
          console.error("Donations snapshot error:", error);
        });

        // Listen for expenses
        onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snapshot) => {
          const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
          set({ expenses });
        }, (error) => {
          console.error("Expenses snapshot error:", error);
        });

        // Listen for users
        onSnapshot(collection(db, 'users'), (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
          if (users.length === 0) {
            // Bootstrap admin user if none exists
            const adminUser: User = {
              id: '1',
              username: 'admin',
              pin: 'admin123',
              role: 'Admin',
              permissions: ['manage_donations', 'manage_expenses', 'view_reports', 'manage_settings', 'manage_users']
            };
            setDoc(doc(db, 'users', '1'), adminUser);
          }
          set({ users });
        }, (error) => {
          console.error("Users snapshot error:", error);
        });

        // Listen for settings
        onSnapshot(doc(db, 'config', 'settings'), (snapshot) => {
          if (snapshot.exists()) {
            set({ settings: snapshot.data() as AppSettings });
          } else {
            // Bootstrap settings
            setDoc(doc(db, 'config', 'settings'), get().settings);
          }
        }, (error) => {
          console.error("Settings snapshot error:", error);
        });

        // Listen for audit logs
        onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(1000)), (snapshot) => {
          const auditLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
          set({ auditLogs });
        }, (error) => {
          console.error("AuditLogs snapshot error:", error);
        });

        set({ loading: false });
      },

      login: (username, pin) => {
        const state = get();
        const users = state.users;
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        
        if (user) {
          set({ currentUser: user, role: 'admin' });
          get().addAuditLog({ action: 'LOGIN', entity: 'SYSTEM', details: `${user.username} logged in`, user: user.username });
          return true;
        }
        return false;
      },
      loginAsGuest: () => {
        set({ role: 'guest', currentUser: null });
        get().addAuditLog({ action: 'LOGIN', entity: 'SYSTEM', details: 'Guest logged in', user: 'Guest' });
      },
      logout: () => {
        get().addAuditLog({ action: 'LOGOUT', entity: 'SYSTEM', details: 'User logged out', user: get().currentUser?.username || get().role || 'Unknown' });
        set({ role: null, currentUser: null });
      },
      changePassword: async (newPassword) => {
        const state = get();
        if (state.currentUser && state.currentUser.username === 'admin') {
          await updateDoc(doc(db, 'users', state.currentUser.id), { pin: newPassword });
          set({ adminPassword: newPassword });
        }
        get().addAuditLog({ action: 'UPDATE', entity: 'SYSTEM', details: 'Admin password changed', user: get().currentUser?.username || 'Admin' });
      },
      updateSettings: async (newSettings) => {
        const updatedSettings = { ...get().settings, ...newSettings };
        await setDoc(doc(db, 'config', 'settings'), updatedSettings);
        get().addAuditLog({ action: 'UPDATE', entity: 'SETTINGS', details: 'Application settings updated', user: get().currentUser?.username || 'Admin' });
      },

      addUser: async (userData) => {
        const id = generateId();
        const newUser: User = { ...userData, id };
        await setDoc(doc(db, 'users', id), newUser);
        get().addAuditLog({ action: 'ADD', entity: 'USER', details: `Created user ${userData.username} (${userData.role})`, user: get().currentUser?.username || 'Admin' });
      },
      
      updateUser: async (id, updates) => {
        await updateDoc(doc(db, 'users', id), updates);
        get().addAuditLog({ action: 'EDIT', entity: 'USER', details: `Updated user ${updates.username || id}`, user: get().currentUser?.username || 'Admin' });
      },
      
      deleteUser: async (id) => {
        const userToDelete = get().users.find(u => u.id === id);
        await deleteDoc(doc(db, 'users', id));
        get().addAuditLog({ action: 'DELETE', entity: 'USER', details: `Deleted user ${userToDelete?.username || id}`, user: get().currentUser?.username || 'Admin' });
      },

      setGlobalPercentage: async (percentage, applyToOld) => {
        const batch = writeBatch(db);
        
        if (applyToOld) {
          const donations = get().donations;
          donations.forEach(d => {
            const collectorShare = (d.amount * percentage) / 100;
            batch.update(doc(db, 'donations', d.id), {
              percentage,
              collectorShare,
              netAmount: d.amount - collectorShare,
              history: [
                ...d.history,
                {
                  timestamp: new Date().toISOString(),
                  action: 'Bulk Percentage Update',
                  details: `Percentage changed to ${percentage}%`
                }
              ]
            });
          });
        }
        
        await batch.commit();
        set({ globalPercentage: percentage });
        get().addAuditLog({ action: 'UPDATE', entity: 'SYSTEM', details: `Global percentage set to ${percentage}% (Applied to old: ${applyToOld})`, user: 'Admin' });
      },

      addDonation: async (donationData) => {
        const collectorShare = (donationData.amount * donationData.percentage) / 100;
        const newDonation = {
          ...donationData,
          collectorShare,
          netAmount: donationData.amount - collectorShare,
          history: [{
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Donation record created.'
          }]
        };
        await addDoc(collection(db, 'donations'), newDonation);
        get().addAuditLog({ action: 'ADD', entity: 'DONATION', details: `Added donation for ${donationData.donorName} (${donationData.amount})`, user: get().currentUser?.username || 'Unknown' });
      },

      updateDonation: async (id, updates, adminName = 'Admin') => {
        const d = get().donations.find(don => don.id === id);
        if (!d) return;

        const updatedAmount = updates.amount ?? d.amount;
        const updatedPercentage = updates.percentage ?? d.percentage;
        const collectorShare = (updatedAmount * updatedPercentage) / 100;
        
        const changes = Object.keys(updates).map(k => `${k} changed`).join(', ');

        await updateDoc(doc(db, 'donations', id), {
          ...updates,
          collectorShare,
          netAmount: updatedAmount - collectorShare,
          history: [
            ...d.history,
            {
              timestamp: new Date().toISOString(),
              action: 'Updated',
              details: `Updated by ${adminName}: ${changes}`
            }
          ]
        });
        get().addAuditLog({ action: 'EDIT', entity: 'DONATION', details: `Updated donation ${id}`, user: get().currentUser?.username || 'Unknown' });
      },

      deleteDonation: async (id) => {
        const donation = get().donations.find(d => d.id === id);
        await deleteDoc(doc(db, 'donations', id));
        get().addAuditLog({ action: 'DELETE', entity: 'DONATION', details: `Deleted donation ${id} (${donation?.donorName})`, user: get().currentUser?.username || 'Unknown' });
      },

      duplicateDonation: async (id) => {
        const donationToDuplicate = get().donations.find(d => d.id === id);
        if (donationToDuplicate) {
          const { id: _, ...data } = donationToDuplicate;
          const newDonation = {
            ...data,
            date: format(new Date(), 'yyyy-MM-dd'),
            history: [{
              timestamp: new Date().toISOString(),
              action: 'Duplicated',
              details: `Duplicated from record ${id}`
            }]
          };
          await addDoc(collection(db, 'donations'), newDonation);
          get().addAuditLog({ action: 'ADD', entity: 'DONATION', details: `Duplicated donation ${id}`, user: get().currentUser?.username || 'Unknown' });
        }
      },

      bulkDeleteDonations: async (ids) => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, 'donations', id)));
        await batch.commit();
        get().addAuditLog({ action: 'DELETE', entity: 'DONATION', details: `Bulk deleted ${ids.length} donations`, user: get().currentUser?.username || 'Unknown' });
      },

      bulkUpdateDonations: async (ids, updates) => {
        const batch = writeBatch(db);
        const donations = get().donations;
        
        ids.forEach(id => {
          const d = donations.find(don => don.id === id);
          if (d) {
            const updatedAmount = updates.amount ?? d.amount;
            const updatedPercentage = updates.percentage ?? d.percentage;
            const collectorShare = (updatedAmount * updatedPercentage) / 100;
            
            batch.update(doc(db, 'donations', id), {
              ...updates,
              collectorShare,
              netAmount: updatedAmount - collectorShare,
              history: [
                ...d.history,
                {
                  timestamp: new Date().toISOString(),
                  action: 'Bulk Updated',
                  details: 'Updated via bulk action'
                }
              ]
            });
          }
        });
        
        await batch.commit();
        get().addAuditLog({ action: 'EDIT', entity: 'DONATION', details: `Bulk updated ${ids.length} donations`, user: get().currentUser?.username || 'Unknown' });
      },

      addExpense: async (expenseData) => {
        await addDoc(collection(db, 'expenses'), expenseData);
        get().addAuditLog({ action: 'ADD', entity: 'EXPENSE', details: `Added expense: ${expenseData.description} (${expenseData.amount})`, user: get().currentUser?.username || 'Unknown' });
      },

      updateExpense: async (id, updates) => {
        await updateDoc(doc(db, 'expenses', id), updates);
        get().addAuditLog({ action: 'EDIT', entity: 'EXPENSE', details: `Updated expense ${id}`, user: get().currentUser?.username || 'Unknown' });
      },

      deleteExpense: async (id) => {
        const expense = get().expenses.find(e => e.id === id);
        if (!expense) return;
        
        await deleteDoc(doc(db, 'expenses', id));
        set((state) => ({ deletedExpenses: [...state.deletedExpenses, expense] }));
        get().addAuditLog({ action: 'DELETE', entity: 'EXPENSE', details: `Deleted expense ${id} (${expense?.description})`, user: get().currentUser?.username || 'Unknown' });
      },

      undoDeleteExpense: async () => {
        const state = get();
        if (state.deletedExpenses.length === 0) return;
        const lastDeleted = state.deletedExpenses[state.deletedExpenses.length - 1];
        const { id: _, ...data } = lastDeleted;
        await addDoc(collection(db, 'expenses'), data);
        set({ deletedExpenses: state.deletedExpenses.slice(0, -1) });
        get().addAuditLog({ action: 'RESTORE', entity: 'EXPENSE', details: `Restored expense (${lastDeleted.description})`, user: get().currentUser?.username || 'Unknown' });
      },

      bulkDeleteExpenses: async (ids) => {
        const batch = writeBatch(db);
        const expensesToDelete = get().expenses.filter(e => ids.includes(e.id));
        ids.forEach(id => batch.delete(doc(db, 'expenses', id)));
        await batch.commit();
        set((state) => ({ deletedExpenses: [...state.deletedExpenses, ...expensesToDelete] }));
        get().addAuditLog({ action: 'DELETE', entity: 'EXPENSE', details: `Bulk deleted ${ids.length} expenses`, user: get().currentUser?.username || 'Unknown' });
      },

      bulkUpdateExpenses: async (ids, updates) => {
        const batch = writeBatch(db);
        ids.forEach(id => batch.update(doc(db, 'expenses', id), updates));
        await batch.commit();
        get().addAuditLog({ action: 'EDIT', entity: 'EXPENSE', details: `Bulk updated ${ids.length} expenses`, user: get().currentUser?.username || 'Unknown' });
      },

      addAuditLog: async (log) => {
        const newLog = {
          ...log,
          timestamp: new Date().toISOString()
        };
        await addDoc(collection(db, 'auditLogs'), newLog);
      },

      importData: async (data, merge) => {
        const batch = writeBatch(db);
        
        if (!merge) {
          // Clear existing
          const donations = await getDocs(collection(db, 'donations'));
          donations.forEach(d => batch.delete(doc(db, 'donations', d.id)));
          const expenses = await getDocs(collection(db, 'expenses'));
          expenses.forEach(e => batch.delete(doc(db, 'expenses', e.id)));
        }

        if (data.donations) {
          data.donations.forEach(d => {
            const { id: _, ...rest } = d;
            batch.set(doc(collection(db, 'donations')), rest);
          });
        }

        if (data.expenses) {
          data.expenses.forEach(e => {
            const { id: _, ...rest } = e;
            batch.set(doc(collection(db, 'expenses')), rest);
          });
        }

        await batch.commit();
        get().addAuditLog({ action: 'IMPORT', entity: 'SYSTEM', details: `Imported data (Merge: ${merge})`, user: get().currentUser?.username || 'Unknown' });
      },

      clearAuditLogs: async () => {
        const batch = writeBatch(db);
        const logs = await getDocs(collection(db, 'auditLogs'));
        logs.forEach(l => batch.delete(doc(db, 'auditLogs', l.id)));
        await batch.commit();
        get().addAuditLog({ action: 'DELETE', entity: 'SYSTEM', details: 'Cleared audit logs', user: get().currentUser?.username || 'Unknown' });
      }
    }),
    {
      name: 'donation-app-storage',
      partialize: (state) => ({ language: state.language }), // Only persist language locally
    }
  )
);
