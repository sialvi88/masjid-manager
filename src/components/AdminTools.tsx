import React, { useState, useRef } from 'react';
import { useStore, defaultLogoUrl, Permission } from '../store';
import { format } from 'date-fns';
import { Download, Upload, Database, History, FileSpreadsheet, FileText, Trash2, Settings, Save, Image as ImageIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { translations } from '../translations';
import UserManagement from './UserManagement';

export default function AdminTools() {
  const store = useStore();
  const { language, auditLogs, clearAuditLogs, importData, settings, updateSettings } = store;
  const t = translations[language];
  const isRtl = language === 'ur';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // Settings State
  const [localSettings, setLocalSettings] = useState(settings);
  const [newCategory, setNewCategory] = useState('');

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveSettings = async () => {
    await updateSettings(localSettings);
    store.addAuditLog({ action: 'UPDATE', entity: 'SETTINGS', details: 'Settings saved', user: 'Admin' });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !localSettings.donorCategories?.includes(newCategory.trim())) {
      setLocalSettings({
        ...localSettings,
        donorCategories: [...(localSettings.donorCategories || []), newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setLocalSettings({
      ...localSettings,
      donorCategories: (localSettings.donorCategories || []).filter(cat => cat !== catToRemove)
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const setDefaultLogo = () => {
    setLocalSettings({ ...localSettings, logoUrl: defaultLogoUrl });
  };

  const handleBackup = () => {
    const data = {
      donations: store.donations,
      expenses: store.expenses,
      globalPercentage: store.globalPercentage,
      version: '1.0',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    store.addAuditLog({ action: 'BACKUP', entity: 'SYSTEM', details: 'Downloaded full JSON backup', user: 'Admin' });
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.donations || data.expenses) {
          await importData(data, importMode === 'merge');
          alert('Data restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (error) {
        alert('Error reading backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Date', 'Donor Name', 'Amount', 'Percentage', 'Collector Share', 'Net Amount'],
      ...store.donations.map(d => [
        d.id, d.date, d.donorName, d.amount, d.percentage, d.collectorShare, d.netAmount
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    store.addAuditLog({ action: 'EXPORT', entity: 'DONATION', details: 'Exported donations to CSV', user: 'Admin' });
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const importedDonations = json.map((row: any) => {
          const amount = Number(row['Amount'] || row['رقم'] || 0);
          const percentage = Number(row['Percentage'] || row['فیصد'] || store.globalPercentage);
          const collectorShare = (amount * percentage) / 100;
          return {
            id: Math.random().toString(36).substring(2, 9),
            date: row['Date'] || row['تاریخ'] || format(new Date(), 'yyyy-MM-dd'),
            donorName: row['Donor Name'] || row['ڈونر کا نام'] || 'Unknown',
            amount,
            percentage,
            collectorShare,
            netAmount: amount - collectorShare,
            history: [{
              timestamp: new Date().toISOString(),
              action: 'Imported',
              details: 'Imported from Excel'
            }]
          };
        });

        await importData({ donations: importedDonations }, importMode === 'merge');
        alert(`Successfully imported ${importedDonations.length} records!`);
      } catch (error) {
        alert('Error reading Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isAdmin = store.currentUser?.role === 'Admin';
  const hasPermission = (permission: Permission) => {
    if (isAdmin) return true;
    return store.currentUser?.permissions.includes(permission) || false;
  };

  return (
    <div className="space-y-6">
      {/* User Management */}
      {hasPermission('manage_users') && (
        <UserManagement />
      )}

      {/* Admin Settings */}
      {hasPermission('manage_settings') && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Settings className={`w-5 h-5 md:w-6 md:h-6 text-gray-700 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{t.adminSettings}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.centerName}</label>
              <input 
                type="text" 
                value={localSettings.masjidName}
                onChange={(e) => setLocalSettings({...localSettings, masjidName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.branchName}</label>
              <input 
                type="text" 
                value={localSettings.madrisaName}
                onChange={(e) => setLocalSettings({...localSettings, madrisaName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.currency}</label>
              <select 
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({...localSettings, currency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Rs">Rs (Rupees)</option>
                <option value="$">$ (USD)</option>
                <option value="£">£ (GBP)</option>
              </select>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.donorCategories}</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t.newCategory + "..."}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button 
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  {t.add}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md border border-gray-100">
                {(localSettings.donorCategories || []).length === 0 ? (
                   <span className="text-sm text-gray-500 italic">{t.noCategoriesFound}</span>
                ) : (
                  (localSettings.donorCategories || []).map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-md text-sm shadow-sm">
                      <span className="text-gray-700">{cat}</span>
                      <button 
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateFormat}</label>
              <select 
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({...localSettings, dateFormat: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.defaultPercentage}</label>
              <input 
                type="number" 
                value={localSettings.defaultPercentage}
                onChange={(e) => setLocalSettings({...localSettings, defaultPercentage: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.logo}</label>
              <div className="flex flex-wrap items-center gap-3">
                {localSettings.logoUrl && (
                  <img src={localSettings.logoUrl} alt="Logo" className="h-12 w-12 object-contain border rounded bg-white shadow-sm" />
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label 
                  htmlFor="logo-upload"
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer text-sm font-medium border border-gray-200"
                >
                  {t.uploadImage}
                </label>
                <button 
                  onClick={setDefaultLogo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 cursor-pointer text-sm font-medium border border-emerald-200"
                >
                  <ImageIcon className="w-4 h-4" />
                  {t.defaultLogo}
                </button>
                {localSettings.logoUrl && (
                  <button 
                    onClick={() => setLocalSettings({...localSettings, logoUrl: null})}
                    className="text-red-600 text-sm hover:underline font-medium ml-2"
                  >
                    {t.remove}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm md:text-base font-semibold transition-all shadow-md active:scale-95"
          >
            <Save className={`w-4 h-4 md:w-5 md:h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t.saveSettings}
          </button>
        </div>
      </div>
      )}

      {hasPermission('manage_settings') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backup & Restore */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className={`w-6 h-6 text-blue-600 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <h2 className="text-xl font-bold text-gray-900">{t.backupRestore}</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.backupAllData}
            </button>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.restoreImportMode}</label>
              <select 
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              >
                <option value="merge">{t.mergeExisting}</option>
                <option value="replace">{t.replaceExisting}</option>
              </select>

              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleRestore}
                className="hidden"
                id="restore-file"
              />
              <label
                htmlFor="restore-file"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                <Upload className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.restoreData}
              </label>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              {t.autoBackupNote}
            </p>
          </div>
        </div>

        {/* Import & Export */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className={`w-6 h-6 text-green-600 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <h2 className="text-xl font-bold text-gray-900">{t.exportImport}</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t.exportCSV}
            </button>

            <div className="pt-4 border-t border-gray-100">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={importFromExcel}
                className="hidden"
                id="import-excel"
              />
              <label
                htmlFor="import-excel"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                <Upload className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.importExcel}
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <History className={`w-5 h-5 md:w-6 md:h-6 text-purple-600 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">{t.auditLog}</h2>
          </div>
          <div className="flex gap-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 font-medium">{t.areYouSure}</span>
                <button
                  onClick={async () => {
                    await clearAuditLogs();
                    setShowClearConfirm(false);
                  }}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t.yesClear}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  {t.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <Trash2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.clearLogs}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t.time}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t.user}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t.action}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t.entity}</th>
                <th className={`px-4 md:px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider`}>{t.details}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                    {t.noAuditLogs}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-[11px] md:text-xs text-gray-500">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm font-semibold text-gray-900">{log.user}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] md:text-xs leading-5 font-bold rounded-full 
                        ${log.action === 'ADD' ? 'bg-green-100 text-green-800' : 
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 
                          log.action === 'EDIT' || log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs text-gray-500">{log.entity}</td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-700">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
