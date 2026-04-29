import React, { useState, useEffect } from 'react';
import { useStore, Expense, ExpenseItem } from '../store';
import { format } from 'date-fns';
import { Pencil, Trash2, Plus, Search, Undo2, CheckSquare, Square, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { translations } from '../translations';

const CategorySelector = ({ value, onChange, categories, t, isRtl }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredCategories = (categories || []).filter((cat: string) => 
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleCategory = (cat: string) => {
    const currentValues = value ? value.split(',').map((v: string) => v.trim()).filter(Boolean) : [];
    let nextValues;
    if (currentValues.includes(cat)) {
      nextValues = currentValues.filter((v: string) => v !== cat);
    } else {
      nextValues = [...currentValues, cat];
    }
    onChange(nextValues.join(', '));
    
    // Return focus to input for continuous experience
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-1">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            required
            placeholder={t.category}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
          title={t.selectCategory}
        >
          <Plus className={`w-4 h-4 text-blue-600 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-[60] mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col ${isRtl ? 'right-0' : 'left-0'}`}>
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className={`absolute ${isRtl ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400`} />
                <input
                  type="text"
                  placeholder={t.search + "..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full ${isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                  autoFocus
                />
              </div>
            </div>
            <div className="overflow-y-auto py-1">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat: string, idx: number) => {
                  const currentValues = value ? value.split(',').map((v: string) => v.trim()) : [];
                  const isSelected = currentValues.includes(cat);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm transition-colors flex items-center justify-between group ${isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-blue-50'}`}
                    >
                      <span>{cat}</span>
                      {isSelected && <CheckSquare className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-sm text-gray-500 text-center italic">
                  {t.noCategoriesFound}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function Expenses() {
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const isAdmin = currentUser?.role === 'Admin';
  const canAdd = !!currentUser && (isAdmin || (Array.isArray(currentUser.permissions) && currentUser.permissions.includes('manage_expenses')));
  const canModify = isAdmin;
  const expenses = useStore(state => state.expenses);
  const deletedExpenses = useStore(state => state.deletedExpenses);
  const addExpense = useStore(state => state.addExpense);
  const loadAllExpenses = useStore(state => state.loadAllExpenses);
  const updateExpense = useStore(state => state.updateExpense);
  const deleteExpense = useStore(state => state.deleteExpense);
  const undoDeleteExpense = useStore(state => state.undoDeleteExpense);
  const language = useStore(state => state.language);
  const settings = useStore(state => state.settings);
  const t = translations[language];
  const isRtl = language === 'ur';
  const { currency, dateFormat } = settings;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return format(date, dateFormat.replace('DD', 'dd').replace('YYYY', 'yyyy'));
    } catch {
      return dateStr;
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  // Form state
  const [currentExpense, setCurrentExpense] = useState<Partial<Expense>>({});
  const [bulkEditData, setBulkEditData] = useState<{ date?: string, description?: string, category?: string }>({});

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.amount.toString().includes(searchTerm) ||
    (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const handleBulkDelete = async () => {
    if (window.confirm(t.areYouSureBulkDelete)) {
      await useStore.getState().bulkDeleteExpenses(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Expense> = {};
    if (bulkEditData.date) updates.date = bulkEditData.date;
    if (bulkEditData.description) updates.description = bulkEditData.description;
    if (bulkEditData.category) updates.category = bulkEditData.category;
    
    if (Object.keys(updates).length > 0) {
      await useStore.getState().bulkUpdateExpenses(selectedIds, updates);
      setIsBulkEditModalOpen(false);
      setSelectedIds([]);
      setBulkEditData({});
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentExpense.description && currentExpense.amount && currentExpense.date) {
      const category = currentExpense.category || currentExpense.description;
      
      // Auto-add new category to settings
      if (category && !settings.expenseCategories.includes(category)) {
        await useStore.getState().updateSettings({
          expenseCategories: [...settings.expenseCategories, category]
        });
      }

      await addExpense({
        description: currentExpense.description,
        amount: Number(currentExpense.amount),
        date: currentExpense.date,
        category: category,
      });
      setIsAddModalOpen(false);
      setCurrentExpense({});
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentExpense.id) {
      const category = currentExpense.category || currentExpense.description || '';

      // Auto-add new category to settings
      if (category && !settings.expenseCategories.includes(category)) {
        await useStore.getState().updateSettings({
          expenseCategories: [...settings.expenseCategories, category]
        });
      }

      await updateExpense(currentExpense.id, {
        description: currentExpense.description || '',
        amount: Number(currentExpense.amount),
        date: currentExpense.date || '',
        category: category,
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
    <div className="space-y-4 md:space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-64">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`block w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {canAdd && (
              <button
                onClick={() => {
                  setCurrentExpense({
                    date: format(new Date(), 'yyyy-MM-dd'),
                  });
                  setIsAddModalOpen(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.newExpense}
              </button>
            )}
            <button
               onClick={loadAllExpenses}
               className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              {t.loadAll}
            </button>
          </div>
        </div>

        {canModify && (
          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                >
                  <Pencil className={`w-3.5 h-3.5 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t.bulkEdit} ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-md hover:bg-red-100 transition-colors text-xs font-medium"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t.deleteSelected} ({selectedIds.length})
                </button>
              </>
            )}
            {deletedExpenses.length > 0 && (
              <button
                onClick={undoDeleteExpense}
                className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors text-xs font-medium"
                title={t.undoDelete}
              >
                <Undo2 className={`w-3.5 h-3.5 ${isRtl ? 'ml-1.5' : 'mr-1.5'}`} />
                {t.undoDelete}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50">
              <tr>
                {canModify && (
                  <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider w-10 md:w-12`}>
                    <button onClick={handleSelectAll} className="flex items-center">
                      {selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0 
                        ? <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /> 
                        : <Square className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </th>
                )}
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider`}>{t.date}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider`}>{t.description}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider`}>{t.amount}</th>
                {canModify && (
                  <th className="px-4 md:px-6 py-3 text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">{t.actions}</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={canModify ? 5 : 4} className="px-6 py-12 text-center text-gray-400 text-sm italic">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className={`${selectedIds.includes(expense.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50 transition-colors'}`}>
                    {canModify && (
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <button onClick={() => handleSelect(expense.id)} className="flex items-center">
                          {selectedIds.includes(expense.id) 
                            ? <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-600" /> 
                            : <Square className="w-4 h-4 md:w-5 md:h-5 text-gray-300" />}
                        </button>
                      </td>
                    )}
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">{formatDate(expense.date)}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm">
                      <div className="font-semibold text-gray-800">{expense.description}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-red-600 font-bold tabular-nums text-right">{currency} {expense.amount.toLocaleString()}</td>
                    {canModify && (
                      <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center gap-2 md:gap-3">
                          <button onClick={() => openEditModal(expense)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title={t.edit}>
                            <Pencil className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if(window.confirm(t.areYouSureDelete)) await deleteExpense(expense.id);
                            }} 
                            className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors" title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog.Root open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }
      }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl p-6 shadow-xl w-full max-w-md z-50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {isEditModalOpen ? t.editExpense : t.addExpense}
            </Dialog.Title>
            
            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                <CategorySelector
                  value={currentExpense.description || ''}
                  onChange={(val: string) => setCurrentExpense({...currentExpense, description: val, category: val})}
                  categories={settings.expenseCategories}
                  t={t}
                  isRtl={isRtl}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.totalAmount}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={currentExpense.amount || ''}
                  onChange={(e) => setCurrentExpense({...currentExpense, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                <input
                  type="date"
                  required
                  value={currentExpense.date || ''}
                  onChange={(e) => setCurrentExpense({...currentExpense, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Bulk Edit Modal */}
      <Dialog.Root open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl p-6 shadow-xl w-full max-w-md z-50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {t.bulkEdit} ({selectedIds.length} {t.selected})
            </Dialog.Title>
            
            <form onSubmit={handleBulkEditSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  {t.bulkEditHelp}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                  <input
                    type="text"
                    value={bulkEditData.description || ''}
                    onChange={(e) => setBulkEditData({...bulkEditData, description: e.target.value, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t.leaveEmptyToKeepCurrent}
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                <input
                  type="date"
                  value={bulkEditData.date || ''}
                  onChange={(e) => setBulkEditData({...bulkEditData, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {t.apply}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
