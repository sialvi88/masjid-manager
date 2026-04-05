import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { Language } from './translations';

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
  
  // Actions
  setLanguage: (lang: Language) => void;
  login: (username: string, pin: string) => boolean;
  loginAsGuest: () => void;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  setGlobalPercentage: (percentage: number, applyToOld: boolean) => void;
  
  addDonation: (donation: Omit<Donation, 'id' | 'collectorShare' | 'netAmount' | 'history'>) => void;
  updateDonation: (id: string, updates: Partial<Donation>, adminName?: string) => void;
  deleteDonation: (id: string) => void;
  duplicateDonation: (id: string) => void;
  bulkDeleteDonations: (ids: string[]) => void;
  bulkUpdateDonations: (ids: string[], updates: Partial<Donation>) => void;
  
  addExpense: (expense: Omit<Expense, 'id'>) => void;
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
      adminPassword: 'admin123', // Default password
      globalPercentage: 10,
      donations: [],
      expenses: [],
      deletedExpenses: [],
      auditLogs: [],
      users: [
        {
          id: '1',
          username: 'admin',
          pin: 'admin123',
          role: 'Admin',
          permissions: ['manage_donations', 'manage_expenses', 'view_reports', 'manage_settings', 'manage_users']
        }
      ],
      currentUser: null,
      settings: {
        masjidName: 'جامع مسجد',
        madrisaName: 'مدرسہ اسلامیہ',
        logoUrl: defaultLogoUrl,
        currency: 'Rs',
        dateFormat: 'DD-MM-YYYY',
        defaultPercentage: 10,
      },

      setLanguage: (lang) => set({ language: lang }),

      login: (username, pin) => {
        const state = get();
        // Fallback for older versions where users array might not exist or be empty
        const users = state.users?.length > 0 ? state.users : [
          {
            id: '1',
            username: 'admin',
            pin: state.adminPassword || 'admin123',
            role: 'Admin',
            permissions: ['manage_donations', 'manage_expenses', 'view_reports', 'manage_settings', 'manage_users'] as Permission[]
          }
        ];

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        
        if (user) {
          // Keep role='admin' for backward compatibility where it's checked
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
      changePassword: (newPassword) => {
        set((state) => {
          // Update adminPassword for backward compatibility
          const updates: any = { adminPassword: newPassword };
          // Also update the pin for the current user if they are admin
          if (state.currentUser && state.currentUser.username === 'admin') {
            updates.users = state.users.map(u => u.id === state.currentUser!.id ? { ...u, pin: newPassword } : u);
            updates.currentUser = { ...state.currentUser, pin: newPassword };
          }
          return updates;
        });
        get().addAuditLog({ action: 'UPDATE', entity: 'SYSTEM', details: 'Admin password changed', user: get().currentUser?.username || 'Admin' });
      },
      updateSettings: (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        get().addAuditLog({ action: 'UPDATE', entity: 'SETTINGS', details: 'Application settings updated', user: get().currentUser?.username || 'Admin' });
      },

      addUser: (userData) => {
        const newUser: User = { ...userData, id: generateId() };
        set((state) => ({ users: [...(state.users || []), newUser] }));
        get().addAuditLog({ action: 'ADD', entity: 'USER', details: `Created user ${userData.username} (${userData.role})`, user: get().currentUser?.username || 'Admin' });
      },
      
      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
        }));
        get().addAuditLog({ action: 'EDIT', entity: 'USER', details: `Updated user ${updates.username || id}`, user: get().currentUser?.username || 'Admin' });
      },
      
      deleteUser: (id) => {
        const userToDelete = get().users.find(u => u.id === id);
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));
        get().addAuditLog({ action: 'DELETE', entity: 'USER', details: `Deleted user ${userToDelete?.username || id}`, user: get().currentUser?.username || 'Admin' });
      },

      setGlobalPercentage: (percentage, applyToOld) => {
        set((state) => {
          const updates: Partial<AppState> = { globalPercentage: percentage };
          if (applyToOld) {
            updates.donations = state.donations.map(d => {
              const collectorShare = (d.amount * percentage) / 100;
              return {
                ...d,
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
              };
            });
          }
          return updates;
        });
        get().addAuditLog({ action: 'UPDATE', entity: 'SYSTEM', details: `Global percentage set to ${percentage}% (Applied to old: ${applyToOld})`, user: 'Admin' });
      },

      addDonation: (donationData) => {
        const collectorShare = (donationData.amount * donationData.percentage) / 100;
        const newDonation: Donation = {
          ...donationData,
          id: generateId(),
          collectorShare,
          netAmount: donationData.amount - collectorShare,
          history: [{
            timestamp: new Date().toISOString(),
            action: 'Created',
            details: 'Donation record created.'
          }]
        };
        set((state) => ({ donations: [...state.donations, newDonation] }));
        get().addAuditLog({ action: 'ADD', entity: 'DONATION', details: `Added donation for ${donationData.donorName} (${donationData.amount})`, user: get().role || 'Unknown' });
      },

      updateDonation: (id, updates, adminName = 'Admin') => {
        set((state) => ({
          donations: state.donations.map(d => {
            if (d.id === id) {
              const updatedAmount = updates.amount ?? d.amount;
              const updatedPercentage = updates.percentage ?? d.percentage;
              const collectorShare = (updatedAmount * updatedPercentage) / 100;
              
              const changes = Object.keys(updates).map(k => `${k} changed`).join(', ');

              return {
                ...d,
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
              };
            }
            return d;
          })
        }));
        get().addAuditLog({ action: 'EDIT', entity: 'DONATION', details: `Updated donation ${id}`, user: get().role || 'Unknown' });
      },

      deleteDonation: (id) => {
        const donation = get().donations.find(d => d.id === id);
        set((state) => ({
          donations: state.donations.filter(d => d.id !== id)
        }));
        get().addAuditLog({ action: 'DELETE', entity: 'DONATION', details: `Deleted donation ${id} (${donation?.donorName})`, user: get().role || 'Unknown' });
      },

      duplicateDonation: (id) => {
        const state = get();
        const donationToDuplicate = state.donations.find(d => d.id === id);
        if (donationToDuplicate) {
          const newDonation = {
            ...donationToDuplicate,
            id: generateId(),
            date: format(new Date(), 'yyyy-MM-dd'),
            history: [{
              timestamp: new Date().toISOString(),
              action: 'Duplicated',
              details: `Duplicated from record ${id}`
            }]
          };
          set({ donations: [...state.donations, newDonation] });
          get().addAuditLog({ action: 'ADD', entity: 'DONATION', details: `Duplicated donation ${id}`, user: get().role || 'Unknown' });
        }
      },

      bulkDeleteDonations: (ids) => {
        set((state) => ({
          donations: state.donations.filter(d => !ids.includes(d.id))
        }));
        get().addAuditLog({ action: 'DELETE', entity: 'DONATION', details: `Bulk deleted ${ids.length} donations`, user: get().role || 'Unknown' });
      },

      bulkUpdateDonations: (ids, updates) => {
        set((state) => ({
          donations: state.donations.map(d => {
            if (ids.includes(d.id)) {
              const updatedAmount = updates.amount ?? d.amount;
              const updatedPercentage = updates.percentage ?? d.percentage;
              const collectorShare = (updatedAmount * updatedPercentage) / 100;
              
              return {
                ...d,
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
              };
            }
            return d;
          })
        }));
        get().addAuditLog({ action: 'EDIT', entity: 'DONATION', details: `Bulk updated ${ids.length} donations`, user: get().role || 'Unknown' });
      },

      addExpense: (expenseData) => {
        const newExpense: Expense = {
          ...expenseData,
          id: generateId()
        };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
        get().addAuditLog({ action: 'ADD', entity: 'EXPENSE', details: `Added expense: ${expenseData.description} (${expenseData.amount})`, user: get().role || 'Unknown' });
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
        }));
        get().addAuditLog({ action: 'EDIT', entity: 'EXPENSE', details: `Updated expense ${id}`, user: get().role || 'Unknown' });
      },

      deleteExpense: (id) => {
        const expense = get().expenses.find(e => e.id === id);
        set((state) => {
          const expenseToDelete = state.expenses.find(e => e.id === id);
          if (!expenseToDelete) return state;
          
          return {
            expenses: state.expenses.filter(e => e.id !== id),
            deletedExpenses: [...state.deletedExpenses, expenseToDelete]
          };
        });
        get().addAuditLog({ action: 'DELETE', entity: 'EXPENSE', details: `Deleted expense ${id} (${expense?.description})`, user: get().role || 'Unknown' });
      },

      undoDeleteExpense: () => {
        let restored: Expense | undefined;
        set((state) => {
          if (state.deletedExpenses.length === 0) return state;
          const lastDeleted = state.deletedExpenses[state.deletedExpenses.length - 1];
          restored = lastDeleted;
          return {
            expenses: [...state.expenses, lastDeleted],
            deletedExpenses: state.deletedExpenses.slice(0, -1)
          };
        });
        if (restored) {
          get().addAuditLog({ action: 'RESTORE', entity: 'EXPENSE', details: `Restored expense ${restored.id} (${restored.description})`, user: get().role || 'Unknown' });
        }
      },

      bulkDeleteExpenses: (ids) => {
        set((state) => {
          const expensesToDelete = state.expenses.filter(e => ids.includes(e.id));
          return {
            expenses: state.expenses.filter(e => !ids.includes(e.id)),
            deletedExpenses: [...state.deletedExpenses, ...expensesToDelete]
          };
        });
        get().addAuditLog({ action: 'DELETE', entity: 'EXPENSE', details: `Bulk deleted ${ids.length} expenses`, user: get().role || 'Unknown' });
      },

      bulkUpdateExpenses: (ids, updates) => {
        set((state) => ({
          expenses: state.expenses.map(e => {
            if (ids.includes(e.id)) {
              return { ...e, ...updates };
            }
            return e;
          })
        }));
        get().addAuditLog({ action: 'EDIT', entity: 'EXPENSE', details: `Bulk updated ${ids.length} expenses`, user: get().role || 'Unknown' });
      },

      addAuditLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: generateId(),
          timestamp: new Date().toISOString()
        };
        set((state) => ({ auditLogs: [newLog, ...(state.auditLogs || [])].slice(0, 1000) })); // Keep last 1000 logs
      },

      importData: (data, merge) => {
        set((state) => {
          const newDonations = merge ? [...state.donations, ...(data.donations || [])] : (data.donations || []);
          const newExpenses = merge ? [...state.expenses, ...(data.expenses || [])] : (data.expenses || []);
          return {
            donations: newDonations,
            expenses: newExpenses,
            globalPercentage: data.globalPercentage ?? state.globalPercentage
          };
        });
        get().addAuditLog({ action: 'IMPORT', entity: 'SYSTEM', details: `Imported data (Merge: ${merge})`, user: get().role || 'Unknown' });
      },

      clearAuditLogs: () => {
        set({ auditLogs: [] });
        get().addAuditLog({ action: 'DELETE', entity: 'SYSTEM', details: 'Cleared audit logs', user: get().role || 'Unknown' });
      }
    }),
    {
      name: 'donation-app-storage',
    }
  )
);
