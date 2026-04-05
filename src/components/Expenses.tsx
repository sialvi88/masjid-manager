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
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  // Form state
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentExpense.description && currentExpense.amount && currentExpense.date) {
      addExpense({
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
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-64">
          <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`block w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => setIsBulkEditModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Pencil className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  Bulk Edit ({selectedIds.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t.deleteSelected} ({selectedIds.length})
                </button>
              </>
            )}
            {deletedExpenses.length > 0 && (
              <button
                onClick={undoDeleteExpense}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title={t.undoDelete}
              >
                <Undo2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.undoDelete}
              </button>
            )}
            
            <button
              onClick={() => {
                setCurrentExpense({
                  date: format(new Date(), 'yyyy-MM-dd'),
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.newExpense}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50">
              <tr>
                {isAdmin && (
                  <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-12`}>
                    <button onClick={handleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.length === filteredExpenses.length && filteredExpenses.length > 0 
                        ? <CheckSquare className="w-5 h-5" /> 
                        : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                )}
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.date}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.description}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.amount}</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 3} className="px-6 py-8 text-center text-gray-500">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className={selectedIds.includes(expense.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleSelect(expense.id)} className="text-gray-400 hover:text-blue-600">
                          {selectedIds.includes(expense.id) 
                            ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                            : <Square className="w-5 h-5" />}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{currency} {expense.amount.toLocaleString()}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => openEditModal(expense)} className="text-blue-600 hover:text-blue-900" title={t.edit}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm(t.areYouSureDelete)) deleteExpense(expense.id);
                            }} 
                            className="text-red-600 hover:text-red-900" title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
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
                <input
                  type="text"
                  required
                  value={currentExpense.description || ''}
                  onChange={(e) => setCurrentExpense({...currentExpense, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.amount}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={currentExpense.amount || ''}
                  onChange={(e) => setCurrentExpense({...currentExpense, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
              Bulk Edit ({selectedIds.length} selected)
            </Dialog.Title>
            
            <form onSubmit={handleBulkEditSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Leave fields empty if you do not want to change them.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
                <input
                  type="text"
                  value={bulkEditData.description || ''}
                  onChange={(e) => setBulkEditData({...bulkEditData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current"
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
