import React, { useState } from 'react';
import { useStore, Expense } from '../store';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, Search, Undo2, CheckSquare, Square } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { translations } from '../translations';

export default function Expenses() {
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const isAdmin = role === 'admin' || !!currentUser?.permissions.includes('manage_expenses');
  const expenses = useStore(state => state.expenses);
  const deletedExpenses = useStore(state => state.deletedExpenses);
  const addExpense = useStore(state => state.addExpense);
  const updateExpense = useStore(state => state.updateExpense);
  const deleteExpense = useStore(state => state.deleteExpense);
  const undoDeleteExpense = useStore(state => state.undoDeleteExpense);
  const language = useStore(state => state.language);
  const settings = useStore(state => state.settings);
  const t = translations[language];
  const isRtl = language === 'ur';
  const { currency, dateFormat } = settings;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, dateFormat.replace('DD', 'dd').replace('YYYY', 'yyyy'));
    } catch {
      return dateStr;
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});
  const [bulkEditData, setBulkEditData] = useState<{ date?: string, description?: string }>({});

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.amount.toString().includes(searchTerm)
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExpenses.map(e => e.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(t.areYouSureBulkDelete)) {
      useStore.getState().bulkDeleteExpenses(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Expense> = {};
    if (bulkEditData.date) updates.date = bulkEditData.date;
    if (bulkEditData.description) updates.description = bulkEditData.description;
    
    if (Object.keys(updates).length > 0) {
      useStore.getState().bulkUpdateExpenses(selectedIds, updates);
      setIsBulkEditModalOpen(false);
      setSelectedIds([]);
      setBulkEditData({});
    }
  };

  // یہاں await شامل کیا گیا ہے
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentExpense.description && currentExpense.amount && currentExpense.date) {
      await addExpense({
        description: currentExpense.description,
        amount: Number(currentExpense.amount),
        date: currentExpense.date,
      });
      setIsAddModalOpen(false);
      setCurrentExpense({});
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentExpense.id) {
      updateExpense(currentExpense.id, {
        description: currentExpense.description,
        amount: Number(currentExpense.amount),
        date: currentExpense.date,
      });
      setIsEditModalOpen(false);
      setCurrentExpense({});
    }
  };

  const openEditModal = (expense: Expense) => {
    setCurrentExpense(expense);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ... (باقی UI کوڈ ویسے ہی رہے گا) ... */}
      {/* میں نے صرف handleAddSubmit کو ٹھیک کیا ہے، باقی کوڈ وہی ہے جو آپ نے دیا تھا */}
    </div>
  );
}
