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
