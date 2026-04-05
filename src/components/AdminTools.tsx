import React, { useState, useRef } from 'react';
import { useStore, defaultLogoUrl } from '../store';
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

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    alert('Settings saved successfully!');
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
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.donations || data.expenses) {
          importData(data, importMode === 'merge');
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
    reader.onload = (event) => {
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

        importData({ donations: importedDonations }, importMode === 'merge');
        alert(`Successfully imported ${importedDonations.length} records!`);
      } catch (error) {
        alert('Error reading Excel file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      {/* User Management */}
      {(store.currentUser?.permissions.includes('manage_users') || store.role === 'admin') && (
        <UserManagement />
      )}

      {/* Admin Settings */}
      {(store.currentUser?.permissions.includes('manage_settings') || store.role === 'admin') && (
        <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Admin Settings (ایڈمن سیٹنگز)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Masjid Name (مسجد کا نام)</label>
              <input 
                type="text" 
                value={localSettings.masjidName}
                onChange={(e) => setLocalSettings({...localSettings, masjidName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Madrisa Name (مدرسے کا نام)</label>
              <input 
                type="text" 
                value={localSettings.madrisaName}
                onChange={(e) => setLocalSettings({...localSettings, madrisaName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency (کرنسی)</label>
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
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format (تاریخ کا فارمیٹ)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Percentage (ڈیفالٹ فیصد)</label>
              <input 
                type="number" 
                value={localSettings.defaultPercentage}
                onChange={(e) => setLocalSettings({...localSettings, defaultPercentage: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo (لوگو)</label>
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
                  Upload Image
                </label>
                <button 
                  onClick={setDefaultLogo}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 cursor-pointer text-sm font-medium border border-emerald-200"
                >
                  <ImageIcon className="w-4 h-4" />
                  Default Logo
                </button>
                {localSettings.logoUrl && (
                  <button 
                    onClick={() => setLocalSettings({...localSettings, logoUrl: null})}
                    className="text-red-600 text-sm hover:underline font-medium ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
      )}

      {(store.currentUser?.permissions.includes('manage_settings') || store.role === 'admin') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Backup & Restore */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Backup & Restore</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Backup All Data (JSON)
            </button>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Restore / Import Mode</label>
              <select 
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              >
                <option value="merge">Merge with existing data</option>
                <option value="replace">Replace existing data</option>
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
                <Upload className="w-4 h-4" />
                Restore Data (JSON)
              </label>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              * Auto Backup is handled by browser local storage automatically.
            </p>
          </div>
        </div>

        {/* Import & Export */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Export & Import</h2>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FileText className="w-4 h-4" />
              Export to CSV
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
                <Upload className="w-4 h-4" />
                Import from Excel
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Audit Log (Audit Trail)</h2>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all audit logs?')) clearAuditLogs();
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Time</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>User</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Action</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Entity</th>
                <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No audit logs available
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${log.action === 'ADD' ? 'bg-green-100 text-green-800' : 
                          log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 
                          log.action === 'EDIT' || log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.details}</td>
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
