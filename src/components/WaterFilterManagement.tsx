import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Droplets, Settings, FileText, Plus, 
  Search, Edit2, Trash2, Activity, 
  AlertCircle, CheckCircle2, Wrench, 
  Users, DollarSign, Filter
} from 'lucide-react';
import { useStore, LedgerEntry, Staff } from '../store';
import { translations } from '../translations';

export default function WaterFilterManagement() {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'staff' | 'ledger' | 'distribution'>('maintenance');
  const { ledger, dialysisStaff, language } = useStore();
  const t = translations[language];
  const isRtl = language === 'ur';

  const tabs = [
    { id: 'maintenance', label: t.maintenanceRecord, icon: Wrench },
    { id: 'staff', label: t.staff, icon: Users },
    { id: 'ledger', label: t.accountLedger, icon: FileText },
    { id: 'distribution', label: t.waterDistribution, icon: Droplets },
  ];

  const renderMaintenance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.filterPlantMaintenance}</h2>
        <button className="bg-cyan-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
          <Plus className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          {t.addNewRecord}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600">
                <Filter className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">{t.completed}</span>
            </div>
            <h3 className="font-bold text-lg">{t.filterChange} (Filter Change)</h3>
            <p className="text-sm text-gray-500">{t.date}: 12-03-2026</p>
            <p className="text-sm text-gray-600">تمام کاربن فلٹرز اور میمبرین تبدیل کر دی گئی ہیں۔</p>
            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400">{t.nextDate}: 12-06-2026</span>
              <button className="text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLedger = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100">
          <p className="text-cyan-600 font-bold text-sm">{t.totalIncomeDonations}</p>
          <p className="text-3xl font-extrabold text-cyan-700">Rs. {ledger.filter(l => l.category === 'WaterFilter' && l.type === 'Income').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <p className="text-red-600 font-bold text-sm">{t.totalExpensesMaintenance}</p>
          <p className="text-3xl font-extrabold text-red-700">Rs. {ledger.filter(l => l.category === 'WaterFilter' && l.type === 'Expense').reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-blue-600 font-bold text-sm">{t.netBalance}</p>
          <p className="text-3xl font-extrabold text-blue-700">Rs. {(ledger.filter(l => l.category === 'WaterFilter' && l.type === 'Income').reduce((a, b) => a + b.amount, 0) - ledger.filter(l => l.category === 'WaterFilter' && l.type === 'Expense').reduce((a, b) => a + b.amount, 0)).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className={`w-full ${isRtl ? 'text-right' : 'text-left'}`}>
          <thead className="bg-gray-50 text-gray-600 text-sm font-bold">
            <tr>
              <th className="px-6 py-4">{t.date}</th>
              <th className="px-6 py-4">{t.details}</th>
              <th className="px-6 py-4">{t.type}</th>
              <th className="px-6 py-4">{t.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ledger.filter(l => l.category === 'WaterFilter').map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-600">{entry.date}</td>
                <td className="px-6 py-4 font-medium">{entry.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${entry.type === 'Income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {entry.type === 'Income' ? t.income : t.expense}
                  </span>
                </td>
                <td className={`px-6 py-4 font-bold ${entry.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                  Rs. {entry.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className={`p-6 space-y-8 pb-32 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{t.waterFilterManagement}</h1>
          <p className="text-gray-500">{t.plantPerformanceRecord}</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {activeTab === 'maintenance' && renderMaintenance()}
        {activeTab === 'ledger' && renderLedger()}
        {(activeTab === 'staff' || activeTab === 'distribution') && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-dashed border-gray-200">
            <Settings className="w-12 h-12 text-gray-300 mx-auto animate-spin-slow" />
            <p className="text-gray-500">{t.sectionComingSoon}</p>
          </div>
        )}
      </div>
    </div>
  );
}
