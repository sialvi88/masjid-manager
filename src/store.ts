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
  category?: string;
}

export interface AppSettings {
  masjidName: string;
  madrisaName: string;
  logoUrl: string | null;
  currency: string;
  dateFormat: string;
  defaultPercentage: number;
  donorCategories?: string[];
  expenseCategories?: string[];
  news?: string[];
  ticker?: {
    speed: number;
    fontSize: number;
    bgColor: string;
    textColor: string;
  };
}

export interface Patient {
  id: string;
  mrd: string; // Medical Record Number
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  address: string;
  emergencyContact: string;
  height: number;
  dryWeight: number; // Target post-dialysis weight
  diagnosis: string;
  comorbidities: string[]; // e.g., DM, HTN
  vascularAccessType: 'Fistula' | 'Graft' | 'Catheter';
  registrationDate: string;
  status: 'Active' | 'Inactive' | 'Transferred' | 'Deceased';
  history: string;
  documents?: { name: string; url: string; date: string; }[];
}

export interface Vitals {
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  weight: number;
  temp: number;
  spo2: number;
}

export interface DialysisSession {
  id: string;
  patientId: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled' | 'No-Show';
  machineId: string;
  nurseId: string;
  doctorId: string;
  
  preVitals: Vitals;
  intraVitals: {
    timestamp: string;
    bloodFlowRate: number;
    dialysateFlow: number;
    heparinDose: number;
    ufGoal: number;
    actualUfRemoved: number;
    vitals: Partial<Vitals>;
  }[];
  postVitals?: Vitals;
  
  clinicalNotes: string;
  complications?: string[];
  ktV?: number;
  urr?: number;
  
  consumablesUsed: { itemId: string; quantity: number; }[];
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  medication: string;
  dose: string;
  frequency: string;
  route: string;
  status: 'Active' | 'Discontinued';
}

export interface Shift {
  id: string;
  name: string; // Morning, Evening, Night
  startTime: string;
  endTime: string;
}

export interface ScheduleEntry {
  id: string;
  patientId: string;
  shiftId: string;
  dayOfWeek: number; // 0-6
  machineId: string;
  chairNumber: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  expiryDate?: string;
  batchNumber?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  date: string;
  items: { description: string; amount: number; }[];
  totalAmount: number;
  discount: number;
  netAmount: number;
  status: 'Unpaid' | 'Paid' | 'Partial';
  insuranceClaimId?: string;
}

export interface InsuranceClaim {
  id: string;
  invoiceId: string;
  tpaName: string;
  policyNumber: string;
  status: 'Submitted' | 'Approved' | 'Rejected' | 'Paid';
  amountClaimed: number;
  amountApproved?: number;
}

export interface Machine {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  purchaseDate: string;
  status: 'Available' | 'In Use' | 'Maintenance' | 'Broken';
  lastServiceDate: string;
  nextServiceDate: string;
  runtimeHours: number;
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  date: string;
  technicianName: string;
  description: string;
  type: 'Preventive' | 'Repair';
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  availability?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: 'Dialysis' | 'WaterFilter' | 'General';
}

export interface PaymentMethod {
  id: string;
  name: string;
  accountName: string;
  accountNumber: string;
  bankName?: string;
  raastId?: string;
  color: string;
  qrUrl?: string;
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
  
  // Dialysis State
  patients: Patient[];
  doctors: Doctor[];
  machines: Machine[];
  dialysisStaff: Staff[];
  ledger: LedgerEntry[];
  paymentMethods: PaymentMethod[];
  sessions: DialysisSession[];
  prescriptions: Prescription[];
  shifts: Shift[];
  schedule: ScheduleEntry[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  insuranceClaims: InsuranceClaim[];
  maintenanceLogs: MaintenanceLog[];

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
  loadAllDonations: () => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  undoDeleteExpense: () => Promise<void>;
  bulkDeleteExpenses: (ids: string[]) => Promise<void>;
  bulkUpdateExpenses: (ids: string[], updates: Partial<Expense>) => Promise<void>;
  loadAllExpenses: () => void;

  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => Promise<void>;
  importData: (data: Partial<AppState>, merge: boolean) => Promise<void>;
  clearAuditLogs: () => Promise<void>;

  // Dialysis/Water Actions
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  addMachine: (machine: Omit<Machine, 'id'>) => Promise<void>;
  updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;

  addStaff: (staff: Omit<Staff, 'id'>) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;

  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => Promise<void>;

  addSession: (session: Omit<DialysisSession, 'id'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<DialysisSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  addPrescription: (prescription: Omit<Prescription, 'id'>) => Promise<void>;
  updatePrescription: (id: string, updates: Partial<Prescription>) => Promise<void>;
  deletePrescription: (id: string) => Promise<void>;

  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addInsuranceClaim: (claim: Omit<InsuranceClaim, 'id'>) => Promise<void>;
  updateInsuranceClaim: (id: string, updates: Partial<InsuranceClaim>) => Promise<void>;

  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id'>) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
  updateShift: (id: string, updates: Partial<Shift>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;

  addScheduleEntry: (entry: Omit<ScheduleEntry, 'id'>) => Promise<void>;
  updateScheduleEntry: (id: string, updates: Partial<ScheduleEntry>) => Promise<void>;
  deleteScheduleEntry: (id: string) => Promise<void>;
  
  cleanupDuplicates: () => Promise<{ donationsRemoved: number, expensesRemoved: number }>;
  wipeAllData: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

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
      patients: [],
      doctors: [],
      machines: [],
      dialysisStaff: [],
      ledger: [],
      paymentMethods: [],
      sessions: [],
      prescriptions: [],
      shifts: [],
      schedule: [],
      inventory: [],
      invoices: [],
      insuranceClaims: [],
      maintenanceLogs: [],
      settings: {
        masjidName: 'جامع مسجد',
        madrisaName: 'مدرسہ اسلامیہ',
        logoUrl: defaultLogoUrl,
        currency: 'Rs',
        dateFormat: 'DD-MM-YYYY',
        defaultPercentage: 10,
        donorCategories: [],
        expenseCategories: [],
        news: [
          "جمعہ کی نماز دوپہر 2:00 بجے ادا کی جائے گی۔",
          "مسجد کے لیے سولر سسٹم کی تنصیب کے لیے 16 لاکھ روپے درکار ہیں۔ براہ کرم تعاون کریں۔",
          "آپ کا 1 روپیہ بھی کسی کی زندگی بدل سکتا ہے۔ آج ہی عطیہ دیں۔",
          "صدقہ بلاؤں کو ٹالتا ہے۔ صرف 5 روپے دے کر صدقہ جاریہ میں حصہ لیں۔"
        ],
        ticker: {
          speed: 30,
          fontSize: 18,
          bgColor: "#b91c1c",
          textColor: "#ffffff"
        }
      },

      setLanguage: (lang) => set({ language: lang }),

      fetchDataFromFirebase: () => {
        set({ loading: true });
        
        console.log("Setting up Firestore listeners...");

        // Listen for donations
        onSnapshot(query(collection(db, 'donations'), orderBy('date', 'desc'), limit(100)), (snapshot) => {
          const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
          set({ donations });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'donations');
        });

        // Listen for expenses
        onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(100)), (snapshot) => {
          const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
          set({ expenses });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'expenses');
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
          
          // CRITICAL FIX: Sync currentUser with updated user data
          const currentLoggedInUser = get().currentUser;
          if (currentLoggedInUser) {
            const updatedUser = users.find(u => u.id === currentLoggedInUser.id);
            if (updatedUser) {
              set({ currentUser: updatedUser });
            }
          }
          
          set({ users });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
        });

        // Listen for settings
        onSnapshot(doc(db, 'config', 'settings'), (snapshot) => {
          if (snapshot.exists()) {
            const fetchedSettings = snapshot.data() as AppSettings;
            const defaultSettings = get().settings;
            // Merge defaults for new fields that might not exist in old Firebase documents
            set({ 
              settings: {
                ...defaultSettings,
                ...fetchedSettings,
                ticker: {
                  ...defaultSettings.ticker,
                  ...(fetchedSettings.ticker || {})
                }
              } 
            });
          } else {
            // Bootstrap settings
            setDoc(doc(db, 'config', 'settings'), get().settings);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'config/settings');
        });

        // Listen for audit logs
        onSnapshot(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(1000)), (snapshot) => {
          const auditLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
          set({ auditLogs });
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'auditLogs');
        });

        // Listen for Dialysis/Water data
        onSnapshot(collection(db, 'patients'), (s) => set({ patients: s.docs.map(d => ({ id: d.id, ...d.data() } as Patient)) }), (e) => handleFirestoreError(e, OperationType.GET, 'patients'));
        onSnapshot(collection(db, 'doctors'), (s) => set({ doctors: s.docs.map(d => ({ id: d.id, ...d.data() } as Doctor)) }), (e) => handleFirestoreError(e, OperationType.GET, 'doctors'));
        onSnapshot(collection(db, 'machines'), (s) => set({ machines: s.docs.map(d => ({ id: d.id, ...d.data() } as Machine)) }), (e) => handleFirestoreError(e, OperationType.GET, 'machines'));
        onSnapshot(collection(db, 'staff'), (s) => set({ dialysisStaff: s.docs.map(d => ({ id: d.id, ...d.data() } as Staff)) }), (e) => handleFirestoreError(e, OperationType.GET, 'staff'));
        onSnapshot(collection(db, 'ledger'), (s) => set({ ledger: s.docs.map(d => ({ id: d.id, ...d.data() } as LedgerEntry)) }), (e) => handleFirestoreError(e, OperationType.GET, 'ledger'));
        onSnapshot(collection(db, 'paymentMethods'), (s) => set({ paymentMethods: s.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethod)) }), (e) => handleFirestoreError(e, OperationType.GET, 'paymentMethods'));
        onSnapshot(collection(db, 'sessions'), (s) => set({ sessions: s.docs.map(d => ({ id: d.id, ...d.data() } as DialysisSession)) }), (e) => handleFirestoreError(e, OperationType.GET, 'sessions'));
        onSnapshot(collection(db, 'prescriptions'), (s) => set({ prescriptions: s.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)) }), (e) => handleFirestoreError(e, OperationType.GET, 'prescriptions'));
        onSnapshot(collection(db, 'shifts'), (s) => set({ shifts: s.docs.map(d => ({ id: d.id, ...d.data() } as Shift)) }), (e) => handleFirestoreError(e, OperationType.GET, 'shifts'));
        onSnapshot(collection(db, 'schedule'), (s) => set({ schedule: s.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry)) }), (e) => handleFirestoreError(e, OperationType.GET, 'schedule'));
        onSnapshot(collection(db, 'inventory'), (s) => set({ inventory: s.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)) }), (e) => handleFirestoreError(e, OperationType.GET, 'inventory'));
        onSnapshot(collection(db, 'invoices'), (s) => set({ invoices: s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)) }), (e) => handleFirestoreError(e, OperationType.GET, 'invoices'));
        onSnapshot(collection(db, 'insuranceClaims'), (s) => set({ insuranceClaims: s.docs.map(d => ({ id: d.id, ...d.data() } as InsuranceClaim)) }), (e) => handleFirestoreError(e, OperationType.GET, 'insuranceClaims'));
        onSnapshot(collection(db, 'maintenanceLogs'), (s) => set({ maintenanceLogs: s.docs.map(d => ({ id: d.id, ...d.data() } as MaintenanceLog)) }), (e) => handleFirestoreError(e, OperationType.GET, 'maintenanceLogs'));

        set({ loading: false });
      },
      loadAllDonations: () => {
        onSnapshot(query(collection(db, 'donations'), orderBy('date', 'desc')), (snapshot) => {
          const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
          set({ donations });
        }, (e) => handleFirestoreError(e, OperationType.GET, 'donations'));
      },
      loadAllExpenses: () => {
        onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snapshot) => {
          const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
          set({ expenses });
        }, (e) => handleFirestoreError(e, OperationType.GET, 'expenses'));
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
          try {
            await updateDoc(doc(db, 'users', state.currentUser.id), { pin: newPassword });
            set({ adminPassword: newPassword });
          } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, `users/${state.currentUser.id}`);
          }
        }
        get().addAuditLog({ action: 'UPDATE', entity: 'SYSTEM', details: 'Admin password changed', user: get().currentUser?.username || 'Admin' });
      },
      updateSettings: async (newSettings) => {
        const updatedSettings = { ...get().settings, ...newSettings };
        try {
          await setDoc(doc(db, 'config', 'settings'), updatedSettings);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'config/settings');
        }
        get().addAuditLog({ action: 'UPDATE', entity: 'SETTINGS', details: 'Application settings updated', user: get().currentUser?.username || 'Admin' });
      },

      addUser: async (userData) => {
        const id = generateId();
        const newUser: User = { ...userData, id };
        try {
          await setDoc(doc(db, 'users', id), newUser);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${id}`);
        }
        get().addAuditLog({ action: 'ADD', entity: 'USER', details: `Created user ${userData.username} (${userData.role})`, user: get().currentUser?.username || 'Admin' });
      },
      
      updateUser: async (id, updates) => {
        try {
          await updateDoc(doc(db, 'users', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `users/${id}`);
        }
        get().addAuditLog({ action: 'EDIT', entity: 'USER', details: `Updated user ${updates.username || id}`, user: get().currentUser?.username || 'Admin' });
      },
      
      deleteUser: async (id) => {
        const userToDelete = get().users.find(u => u.id === id);
        try {
          await deleteDoc(doc(db, 'users', id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
        }
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
        try {
          await addDoc(collection(db, 'donations'), newDonation);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'donations');
        }
        get().addAuditLog({ action: 'ADD', entity: 'DONATION', details: `Added donation for ${donationData.donorName} (${donationData.amount})`, user: get().currentUser?.username || 'Unknown' });
      },

      updateDonation: async (id, updates, adminName = 'Admin') => {
        const d = get().donations.find(don => don.id === id);
        if (!d) return;

        const updatedAmount = updates.amount ?? d.amount;
        const updatedPercentage = updates.percentage ?? d.percentage;
        const collectorShare = (updatedAmount * updatedPercentage) / 100;
        
        const changes = Object.keys(updates).map(k => `${k} changed`).join(', ');

        try {
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
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `donations/${id}`);
        }
        get().addAuditLog({ action: 'EDIT', entity: 'DONATION', details: `Updated donation ${id}`, user: get().currentUser?.username || 'Unknown' });
      },

      deleteDonation: async (id) => {
        const donation = get().donations.find(d => d.id === id);
        try {
          await deleteDoc(doc(db, 'donations', id));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `donations/${id}`);
        }
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
        try {
          await addDoc(collection(db, 'expenses'), expenseData);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'expenses');
        }
        get().addAuditLog({ action: 'ADD', entity: 'EXPENSE', details: `Added expense: ${expenseData.description} (${expenseData.amount})`, user: get().currentUser?.username || 'Unknown' });
      },

      updateExpense: async (id, updates) => {
        try {
          await updateDoc(doc(db, 'expenses', id), updates);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `expenses/${id}`);
        }
        get().addAuditLog({ action: 'EDIT', entity: 'EXPENSE', details: `Updated expense ${id}`, user: get().currentUser?.username || 'Unknown' });
      },

      deleteExpense: async (id) => {
        const expense = get().expenses.find(e => e.id === id);
        if (!expense) return;
        
        try {
          await deleteDoc(doc(db, 'expenses', id));
          set((state) => ({ deletedExpenses: [...state.deletedExpenses, expense] }));
        } catch (e) {
          handleFirestoreError(e, OperationType.DELETE, `expenses/${id}`);
        }
        get().addAuditLog({ action: 'DELETE', entity: 'EXPENSE', details: `Deleted expense ${id} (${expense?.description})`, user: get().currentUser?.username || 'Unknown' });
      },

      undoDeleteExpense: async () => {
        const state = get();
        if (state.deletedExpenses.length === 0) return;
        const lastDeleted = state.deletedExpenses[state.deletedExpenses.length - 1];
        const { id: _, ...data } = lastDeleted;
        try {
          await addDoc(collection(db, 'expenses'), data);
          set({ deletedExpenses: state.deletedExpenses.slice(0, -1) });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'expenses');
        }
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
        try {
          await addDoc(collection(db, 'auditLogs'), newLog);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'auditLogs');
        }
      },

      importData: async (data, merge) => {
        // High-level batch function to stay under the 500 limit
        const commitBatch = async (items: any[], type: string, action: 'set' | 'delete') => {
          let count = 0;
          while (count < items.length) {
            const batch = writeBatch(db);
            const chunk = items.slice(count, count + 400);
            chunk.forEach(item => {
              if (action === 'delete') {
                batch.delete(doc(db, type, item.id));
              } else {
                const { id: _, ...rest } = item;
                // If the item had an ID in the backup, we can choose to keep it or let Firebase generate one
                // For a full system restore, keeping IDs might be useful for relationships, but current logic uses doc(collection(db, type))
                // Let's stick to generating new IDs for reliability unless it's patients/doctors etc where IDs might be linked
                batch.set(doc(collection(db, type)), rest);
              }
            });
            await batch.commit();
            count += chunk.length;
          }
        };

        if (!merge) {
          // Clear everything
          const collections = ['donations', 'expenses', 'auditLogs', 'patients', 'doctors', 'machines', 'staff', 'ledger', 'sessions', 'prescriptions', 'shifts', 'schedule', 'inventory', 'invoices', 'users', 'insuranceClaims', 'maintenanceLogs', 'paymentMethods'];
          for (const collName of collections) {
            try {
              const snapshot = await getDocs(collection(db, collName));
              await commitBatch(snapshot.docs.map(d => ({ id: d.id })), collName, 'delete');
            } catch (e) {
              console.error(`Error clearing ${collName}:`, e);
            }
          }
        }

        if (data.donations) await commitBatch(data.donations, 'donations', 'set');
        if (data.expenses) await commitBatch(data.expenses, 'expenses', 'set');
        if (data.users) await commitBatch(data.users, 'users', 'set');
        if (data.patients) await commitBatch(data.patients, 'patients', 'set');
        if (data.doctors) await commitBatch(data.doctors, 'doctors', 'set');
        if (data.machines) await commitBatch(data.machines, 'machines', 'set');
        if (data.dialysisStaff) await commitBatch(data.dialysisStaff, 'staff', 'set');
        if (data.ledger) await commitBatch(data.ledger, 'ledger', 'set');
        if (data.sessions) await commitBatch(data.sessions, 'sessions', 'set');
        if (data.prescriptions) await commitBatch(data.prescriptions, 'prescriptions', 'set');
        if (data.shifts) await commitBatch(data.shifts, 'shifts', 'set');
        if (data.schedule) await commitBatch(data.schedule, 'schedule', 'set');
        if (data.inventory) await commitBatch(data.inventory, 'inventory', 'set');
        if (data.invoices) await commitBatch(data.invoices, 'invoices', 'set');
        if (data.insuranceClaims) await commitBatch(data.insuranceClaims, 'insuranceClaims', 'set');
        if (data.maintenanceLogs) await commitBatch(data.maintenanceLogs, 'maintenanceLogs', 'set');
        if (data.paymentMethods) await commitBatch(data.paymentMethods, 'paymentMethods', 'set');
        if (data.auditLogs) await commitBatch(data.auditLogs, 'auditLogs', 'set');
        
        if (data.settings) {
          try {
            await setDoc(doc(db, 'config', 'settings'), data.settings);
          } catch (e) {
            console.error('Error importing settings:', e);
          }
        }

        if (typeof data.globalPercentage === 'number') {
           set({ globalPercentage: data.globalPercentage });
        }

        get().addAuditLog({ action: 'IMPORT', entity: 'SYSTEM', details: `Imported full data (Merge: ${merge})`, user: get().currentUser?.username || 'Unknown' });
      },

      clearAuditLogs: async () => {
        const batch = writeBatch(db);
        const logs = await getDocs(collection(db, 'auditLogs'));
        logs.forEach(l => batch.delete(doc(db, 'auditLogs', l.id)));
        await batch.commit();
        get().addAuditLog({ action: 'DELETE', entity: 'SYSTEM', details: 'Cleared audit logs', user: get().currentUser?.username || 'Unknown' });
      },

      addPatient: async (data) => { 
        try { await addDoc(collection(db, 'patients'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'patients'); }
      },
      updatePatient: async (id, data) => { 
        try { await updateDoc(doc(db, 'patients', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `patients/${id}`); }
      },
      deletePatient: async (id) => { 
        try { await deleteDoc(doc(db, 'patients', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `patients/${id}`); }
      },

      addDoctor: async (data) => { 
        try { await addDoc(collection(db, 'doctors'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'doctors'); }
      },
      updateDoctor: async (id, data) => { 
        try { await updateDoc(doc(db, 'doctors', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `doctors/${id}`); }
      },
      deleteDoctor: async (id) => { 
        try { await deleteDoc(doc(db, 'doctors', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `doctors/${id}`); }
      },

      addMachine: async (data) => { 
        try { await addDoc(collection(db, 'machines'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'machines'); }
      },
      updateMachine: async (id, data) => { 
        try { await updateDoc(doc(db, 'machines', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `machines/${id}`); }
      },
      deleteMachine: async (id) => { 
        try { await deleteDoc(doc(db, 'machines', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `machines/${id}`); }
      },

      addStaff: async (data) => { 
        try { await addDoc(collection(db, 'staff'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'staff'); }
      },
      updateStaff: async (id, data) => { 
        try { await updateDoc(doc(db, 'staff', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `staff/${id}`); }
      },
      deleteStaff: async (id) => { 
        try { await deleteDoc(doc(db, 'staff', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `staff/${id}`); }
      },

      addLedgerEntry: async (data) => { 
        try { await addDoc(collection(db, 'ledger'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'ledger'); }
      },

      updatePaymentMethod: async (id, updates) => {
        try {
          await setDoc(doc(db, 'paymentMethods', id), updates, { merge: true });
          get().addAuditLog({ action: 'UPDATE', entity: 'PAYMENT_METHOD', details: `Updated payment method ${id}`, user: get().currentUser?.username || 'Admin' });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `paymentMethods/${id}`);
        }
      },
      addSession: async (data) => { 
        try { await addDoc(collection(db, 'sessions'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'sessions'); }
      },
      updateSession: async (id, data) => { 
        try { await updateDoc(doc(db, 'sessions', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `sessions/${id}`); }
      },
      deleteSession: async (id) => { 
        try { await deleteDoc(doc(db, 'sessions', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `sessions/${id}`); }
      },
      addPrescription: async (data) => { 
        try { await addDoc(collection(db, 'prescriptions'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'prescriptions'); }
      },
      updatePrescription: async (id, data) => { 
        try { await updateDoc(doc(db, 'prescriptions', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `prescriptions/${id}`); }
      },
      deletePrescription: async (id) => { 
        try { await deleteDoc(doc(db, 'prescriptions', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `prescriptions/${id}`); }
      },
      addInventoryItem: async (data) => { 
        try { await addDoc(collection(db, 'inventory'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'inventory'); }
      },
      updateInventoryItem: async (id, data) => { 
        try { await updateDoc(doc(db, 'inventory', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `inventory/${id}`); }
      },
      deleteInventoryItem: async (id) => { 
        try { await deleteDoc(doc(db, 'inventory', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `inventory/${id}`); }
      },
      addInvoice: async (data) => { 
        try { await addDoc(collection(db, 'invoices'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'invoices'); }
      },
      updateInvoice: async (id, data) => { 
        try { await updateDoc(doc(db, 'invoices', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `invoices/${id}`); }
      },
      deleteInvoice: async (id) => { 
        try { await deleteDoc(doc(db, 'invoices', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `invoices/${id}`); }
      },
      addInsuranceClaim: async (data) => { 
        try { await addDoc(collection(db, 'insuranceClaims'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'insuranceClaims'); }
      },
      updateInsuranceClaim: async (id, data) => { 
        try { await updateDoc(doc(db, 'insuranceClaims', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `insuranceClaims/${id}`); }
      },
      addMaintenanceLog: async (data) => { 
        try { await addDoc(collection(db, 'maintenanceLogs'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'maintenanceLogs'); }
      },
      addShift: async (data) => { 
        try { await addDoc(collection(db, 'shifts'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'shifts'); }
      },
      updateShift: async (id, data) => { 
        try { await updateDoc(doc(db, 'shifts', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `shifts/${id}`); }
      },
      deleteShift: async (id) => { 
        try { await deleteDoc(doc(db, 'shifts', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `shifts/${id}`); }
      },
      addScheduleEntry: async (data) => { 
        try { await addDoc(collection(db, 'schedule'), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, 'schedule'); }
      },
      updateScheduleEntry: async (id, data) => { 
        try { await updateDoc(doc(db, 'schedule', id), data); }
        catch (e) { handleFirestoreError(e, OperationType.WRITE, `schedule/${id}`); }
      },
      deleteScheduleEntry: async (id) => { 
        try { await deleteDoc(doc(db, 'schedule', id)); }
        catch (e) { handleFirestoreError(e, OperationType.DELETE, `schedule/${id}`); }
      },

      cleanupDuplicates: async () => {
        const { donations, expenses } = get();
        
        // Helper to normalize text (especially for Urdu variants)
        const normalizeText = (text: string) => {
          if (!text) return '';
          return text.trim()
            .toLowerCase()
            .replace(/[\u064A\u06CC]/g, 'ی') // Replace Arabic Ya and Farsi/Urdu Ya with standard Ya
            .replace(/[\u0643\u06A9]/g, 'ک') // Replace Arabic Kaf and Urdu Kaf with standard Kaf
            .replace(/\s+/g, ' '); // Replace multiple spaces with single space
        };

        const donationDuplicates: string[] = [];
        const seenDonations = new Set();
        
        donations.forEach(d => {
          const key = `${d.date}_${normalizeText(d.donorName)}_${d.amount}`;
          if (seenDonations.has(key)) {
            donationDuplicates.push(d.id);
          } else {
            seenDonations.add(key);
          }
        });

        const expenseDuplicates: string[] = [];
        const seenExpenses = new Set();
        
        expenses.forEach(e => {
          const key = `${e.date}_${normalizeText(e.description)}_${e.amount}`;
          if (seenExpenses.has(key)) {
            expenseDuplicates.push(e.id);
          } else {
            seenExpenses.add(key);
          }
        });

        // Batch delete function to handle 500 limit
        const performBatchDelete = async (ids: string[], collectionName: string) => {
          let count = 0;
          while (count < ids.length) {
            const batch = writeBatch(db);
            const chunk = ids.slice(count, count + 400); // chunk size slightly below 500 for safety
            chunk.forEach(id => {
              batch.delete(doc(db, collectionName, id));
            });
            await batch.commit();
            count += chunk.length;
          }
        };

        if (donationDuplicates.length > 0) {
          await performBatchDelete(donationDuplicates, 'donations');
        }
        
        if (expenseDuplicates.length > 0) {
          await performBatchDelete(expenseDuplicates, 'expenses');
        }

        if (donationDuplicates.length > 0 || expenseDuplicates.length > 0) {
          get().addAuditLog({ 
            action: 'DELETE', 
            entity: 'SYSTEM', 
            details: `Cleaned up duplicates: ${donationDuplicates.length} donations, ${expenseDuplicates.length} expenses`, 
            user: get().currentUser?.username || 'Admin' 
          });
        }

        return { 
          donationsRemoved: donationDuplicates.length, 
          expensesRemoved: expenseDuplicates.length 
        };
      },

      wipeAllData: async () => {
        const batch = writeBatch(db);
        const donations = await getDocs(collection(db, 'donations'));
        donations.forEach(d => batch.delete(doc(db, 'donations', d.id)));
        
        const expenses = await getDocs(collection(db, 'expenses'));
        expenses.forEach(e => batch.delete(doc(db, 'expenses', e.id)));

        // Also clear dialysis/water filter data if requested (optional, but keep it for a true wipe)
        const collectionsToClear = [
          'patients', 'doctors', 'machines', 'staff', 'ledger', 'sessions', 
          'prescriptions', 'shifts', 'schedule', 'inventory', 'invoices'
        ];

        for (const collName of collectionsToClear) {
          const snapshot = await getDocs(collection(db, collName));
          snapshot.forEach(d => batch.delete(doc(db, collName, d.id)));
        }

        await batch.commit();

        get().addAuditLog({ 
          action: 'DELETE', 
          entity: 'SYSTEM', 
          details: 'Full system data wipe (Factory Reset)', 
          user: get().currentUser?.username || 'Admin' 
        });
      },
    }),
    {
      name: 'donation-app-storage',
      partialize: (state) => ({ 
        language: state.language,
        role: state.role,
        currentUser: state.currentUser
      }),
    }
  )
);
