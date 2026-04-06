import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Language } from './translations';
import { db } from './firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

// ... (آپ کے انٹرفیسز User, Donation, Expense وغیرہ یہاں موجود رہیں گے) ...

interface AppState {
  language: Language;
  role: UserRole;
  adminPassword: string;
  globalPercentage: number;
  donations: Donation[];
  expenses: Expense[];
  deletedExpenses: Expense[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  users: User[];
  currentUser: User | null;
  
  // Actions
  setLanguage: (lang: Language) => void;
  fetchDataFromFirebase: () => Promise<void>;
  login: (username: string, pin: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  setGlobalPercentage: (percentage: number, applyToOld: boolean) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'collectorShare' | 'netAmount' | 'history'>) => Promise<void>;
  updateDonation: (id: string, updates: Partial<Donation>, adminName?: string) => void;
  deleteDonation: (id: string) => void;
  duplicateDonation: (id: string) => void;
  bulkDeleteDonations: (ids: string[]) => void;
  bulkUpdateDonations: (ids: string[], updates: Partial<Donation>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  undoDeleteExpense: () => void;
  bulkDeleteExpenses: (ids: string[]) => void;
  bulkUpdateExpenses: (ids: string[], updates: Partial<Expense>) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  importData: (data: Partial<AppState>, merge: boolean) => void;
  clearAuditLogs: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'en',
      role: null,
      adminPassword: 'admin123',
      globalPercentage: 10,
      donations: [],
      expenses: [],
      deletedExpenses: [],
      auditLogs: [],
      users: [{ id: '1', username: 'admin', pin: 'admin123', role: 'Admin', permissions: ['manage_donations', 'manage_expenses', 'view_reports', 'manage_settings', 'manage_users'] }],
      currentUser: null,
      settings: { masjidName: 'جامع مسجد', madrisaName: 'مدرسہ اسلامیہ', logoUrl: null, currency: 'Rs', dateFormat: 'DD-MM-YYYY', defaultPercentage: 10 },

      fetchDataFromFirebase: async () => {
        const donationsSnapshot = await getDocs(collection(db, 'donations'));
        const donations = donationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
        const expensesSnapshot = await getDocs(collection(db, 'expenses'));
        const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
        set({ donations, expenses });
      },

      setLanguage: (lang) => set({ language: lang }),
      login: (username, pin) => { /* ... آپ کا پرانا لاگ ان کوڈ ... */ return true; },
      loginAsGuest: () => { /* ... */ },
      logout: () => { /* ... */ },
      changePassword: (newPassword) => { /* ... */ },
      updateSettings: (newSettings) => { /* ... */ },
      addUser: (userData) => { /* ... */ },
      updateUser: (id, updates) => { /* ... */ },
      deleteUser: (id) => { /* ... */ },
      setGlobalPercentage: (percentage, applyToOld) => { /* ... */ },

      addDonation: async (donationData) => {
        const collectorShare = (donationData.amount * donationData.percentage) / 100;
        const newDonation = { ...donationData, collectorShare, netAmount: donationData.amount - collectorShare, history: [] };
        await addDoc(collection(db, 'donations'), newDonation);
        get().fetchDataFromFirebase();
      },

      updateDonation: (id, updates, adminName = 'Admin') => { /* ... */ },
      deleteDonation: (id) => { /* ... */ },
      duplicateDonation: (id) => { /* ... */ },
      bulkDeleteDonations: (ids) => { /* ... */ },
      bulkUpdateDonations: (ids, updates) => { /* ... */ },

      addExpense: async (expenseData) => {
        await addDoc(collection(db, 'expenses'), expenseData);
        get().fetchDataFromFirebase();
      },

      updateExpense: (id, updates) => { /* ... */ },
      deleteExpense: (id) => { /* ... */ },
      undoDeleteExpense: () => { /* ... */ },
      bulkDeleteExpenses: (ids) => { /* ... */ },
      bulkUpdateExpenses: (ids, updates) => { /* ... */ },
      addAuditLog: (log) => { /* ... */ },
      importData: (data, merge) => { /* ... */ },
      clearAuditLogs: () => { /* ... */ }
    }),
    { name: 'donation-app-storage' }
  )
);
