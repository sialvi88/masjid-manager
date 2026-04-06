import React, { useState } from 'react';
import { useStore, Donation } from '../store';
import { format } from 'date-fns';
import { 
  Pencil, Trash2, Copy, Plus, Settings, 
  CheckSquare, Square, Search, AlertCircle, History
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Slider from '@radix-ui/react-slider';
import { translations } from '../translations';

export default function Donations() {
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const donations = useStore(state => state.donations);
  const isAdmin = currentUser?.role === 'Admin' || !!currentUser?.permissions.includes('manage_donations');
  const globalPercentage = useStore(state => state.globalPercentage);
  const setGlobalPercentage = useStore(state => state.setGlobalPercentage);
  const addDonation = useStore(state => state.addDonation);
  const updateDonation = useStore(state => state.updateDonation);
  const deleteDonation = useStore(state => state.deleteDonation);
  const duplicateDonation = useStore(state => state.duplicateDonation);
  const bulkDeleteDonations = useStore(state => state.bulkDeleteDonations);
  const bulkUpdateDonations = useStore(state => state.bulkUpdateDonations);
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
  const [isPercentageModalOpen, setIsPercentageModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  
  // Form state
  const [currentDonation, setCurrentDonation] = useState<Partial<Donation>>({});
  const [newPercentage, setNewPercentage] = useState(globalPercentage);
  const [applyToOld, setApplyToOld] = useState(false);
  const [viewHistoryDonation, setViewHistoryDonation] = useState<Donation | null>(null);
  const [bulkEditData, setBulkEditData] = useState<{ date?: string, percentage?: string, donorName?: string }>({});

  const filteredDonations = donations.filter(d => 
    d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.amount.toString().includes(searchTerm)
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredDonations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDonations.map(d => d.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDonation.donorName && currentDonation.amount && currentDonation.date) {
      await addDonation({
        donorName: currentDonation.donorName,
        amount: Number(currentDonation.amount),
        date: currentDonation.date,
        percentage: currentDonation.percentage ?? globalPercentage
      });
      setIsAddModalOpen(false);
      setCurrentDonation({});
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentDonation.id) {
      await updateDonation(currentDonation.id, {
        donorName: currentDonation.donorName,
        amount: Number(currentDonation.amount),
        date: currentDonation.date,
        percentage: Number(currentDonation.percentage)
      });
      setIsEditModalOpen(false);
      setCurrentDonation({});
    }
  };

  const handlePercentageSubmit = async () => {
    await setGlobalPercentage(newPercentage, applyToOld);
    setIsPercentageModalOpen(false);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(t.areYouSureBulkDelete)) {
      await bulkDeleteDonations(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<Donation> = {};
    if (bulkEditData.date) updates.date = bulkEditData.date;
    if (bulkEditData.percentage !== undefined && bulkEditData.percentage !== '') {
      updates.percentage = Number(bulkEditData.percentage);
    }
    if (bulkEditData.donorName) updates.donorName = bulkEditData.donorName;
    
    if (Object.keys(updates).length > 0) {
      await bulkUpdateDonations(selectedIds, updates);
      setIsBulkEditModalOpen(false);
      setSelectedIds([]);
      setBulkEditData({});
    }
  };

  const openEditModal = (donation: Donation) => {
    setCurrentDonation(donation);
    setIsEditModalOpen(true);
  };

  const openHistoryModal = (donation: Donation) => {
    setViewHistoryDonation(donation);
    setIsHistoryModalOpen(true);
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
            
            <button
              onClick={() => setIsPercentageModalOpen(true)}
              className="flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <Settings className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.changePercentage}
            </button>

            <button
              onClick={() => {
                setCurrentDonation({
                  date: format(new Date(), 'yyyy-MM-dd'),
                  percentage: globalPercentage
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.newDonation}
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
                      {selectedIds.length === filteredDonations.length && filteredDonations.length > 0 
                        ? <CheckSquare className="w-5 h-5" /> 
                        : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                )}
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.date}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.donorName}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.amount}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.percentage}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.collectorShare}</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>{t.netAmount}</th>
                {isAdmin && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                    {t.noRecords}
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className={selectedIds.includes(donation.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleSelect(donation.id)} className="text-gray-400 hover:text-blue-600">
                          {selectedIds.includes(donation.id) 
                            ? <CheckSquare className="w-5 h-5 text-blue-600" /> 
                            : <Square className="w-5 h-5" />}
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(donation.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{donation.donorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency} {donation.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{donation.percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{currency} {donation.collectorShare.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{currency} {donation.netAmount.toLocaleString()}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => openEditModal(donation)} className="text-blue-600 hover:text-blue-900" title={t.edit}>
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={async () => await duplicateDonation(donation.id)} className="text-green-600 hover:text-green-900" title={t.duplicate}>
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => openHistoryModal(donation)} className="text-gray-600 hover:text-gray-900" title={t.history}>
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if(window.confirm(t.areYouSureDelete)) await deleteDonation(donation.id);
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
              {isEditModalOpen ? t.editDonation : t.addDonation}
            </Dialog.Title>
            
            <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.donorName}</label>
                <input
                  type="text"
                  required
                  value={currentDonation.donorName || ''}
                  onChange={(e) => setCurrentDonation({...currentDonation, donorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.amount}</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={currentDonation.amount || ''}
                  onChange={(e) => setCurrentDonation({...currentDonation, amount: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
                <input
                  type="date"
                  required
                  value={currentDonation.date || ''}
                  onChange={(e) => setCurrentDonation({...currentDonation, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.percentage}</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={currentDonation.percentage || ''}
                  onChange={(e) => setCurrentDonation({...currentDonation, percentage: Number(e.target.value)})}
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

      {/* Global Percentage Modal */}
      <Dialog.Root open={isPercentageModalOpen} onOpenChange={setIsPercentageModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl p-6 shadow-xl w-full max-w-md z-50 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {t.changeGlobalPercentage}
            </Dialog.Title>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  {t.newPercentage} <span className="text-2xl font-bold text-blue-600 mx-2">{newPercentage}%</span>
                </label>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[newPercentage]}
                  onValueChange={(val) => setNewPercentage(val[0])}
                  max={100}
                  step={1}
                >
                  <Slider.Track className="bg-gray-200 relative grow rounded-full h-[3px]">
                    <Slider.Range className="absolute bg-blue-600 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-600 shadow-md rounded-[10px] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </Slider.Root>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <AlertCircle className={`w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 ${isRtl ? 'ml-3' : 'mr-3'}`} />
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyToOld}
                      onChange={(e) => setApplyToOld(e.target.checked)}
                      className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${isRtl ? 'ml-2' : 'mr-2'}`}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {t.applyToOld}
                    </span>
                  </label>
                  <p className={`text-xs text-gray-500 mt-1 ${isRtl ? 'mr-6' : 'ml-6'}`}>
                    {t.applyToOldDesc}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsPercentageModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handlePercentageSubmit}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {t.apply}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* History Modal */}
      <Dialog.Root open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className={`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-xl p-6 shadow-xl w-full max-w-lg z-50 max-h-[80vh] flex flex-col ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {t.auditLog} - {viewHistoryDonation?.donorName}
            </Dialog.Title>
            
            <div className={`overflow-y-auto flex-1 ${isRtl ? 'pr-2' : 'pl-2'}`}>
              <div className="space-y-4">
                {viewHistoryDonation?.history.slice().reverse().map((log, idx) => (
                  <div key={idx} className={`${isRtl ? 'border-r-2 pr-4' : 'border-l-2 pl-4'} border-blue-500 py-1`}>
                    <p className="text-xs text-gray-500">{format(new Date(log.timestamp), 'dd MMM yyyy, hh:mm a')}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{log.action}</p>
                    <p className="text-sm text-gray-600">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end pt-4 border-t">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                {t.close}
              </button>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.donorName}</label>
                <input
                  type="text"
                  value={bulkEditData.donorName || ''}
                  onChange={(e) => setBulkEditData({...bulkEditData, donorName: e.target.value})}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.percentage}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bulkEditData.percentage || ''}
                  onChange={(e) => setBulkEditData({...bulkEditData, percentage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty to keep current"
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
