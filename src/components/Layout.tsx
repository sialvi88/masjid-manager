import { ReactNode } from 'react';
import { useStore } from '../store';
import { LayoutDashboard, Users, Receipt, FileText, LogOut, Settings, Globe } from 'lucide-react';
import { translations } from '../translations';

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function Layout({ children, currentTab, setCurrentTab }: LayoutProps) {
  const role = useStore(state => state.role);
  const currentUser = useStore(state => state.currentUser);
  const logout = useStore(state => state.logout);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const settings = useStore(state => state.settings);

  const t = translations[language];
  const isRtl = language === 'ur';

  const hasPermission = (permission: string) => {
    if (role === 'admin') return true;
    if (role === 'guest') return true; // Guests can view everything (read-only)
    if (!currentUser) return false;
    return currentUser.permissions.includes(permission as any);
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, show: true },
    { id: 'donations', label: t.donations, icon: Users, show: hasPermission('manage_donations') },
    { id: 'expenses', label: t.expenses, icon: Receipt, show: hasPermission('manage_expenses') },
    { id: 'reports', label: t.reports, icon: FileText, show: hasPermission('view_reports') },
  ].filter(item => item.show);

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col md:flex-row ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white shadow-md flex flex-col print:hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded" />
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">{settings.masjidName}</h2>
            <p className="text-xs text-gray-500 mt-1">{settings.madrisaName}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 px-4 py-2 text-gray-600">
            <Globe className="w-5 h-5 text-gray-400" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
              className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </div>
          
          {hasPermission('manage_settings') || hasPermission('manage_users') ? (
            <button 
              onClick={() => setCurrentTab('admin-tools')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                currentTab === 'admin-tools'
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className={`w-5 h-5 flex-shrink-0 ${currentTab === 'admin-tools' ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{t.settings || 'Admin Tools'}</span>
            </button>
          ) : null}
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        <header className="bg-white shadow-sm z-10 p-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find(i => i.id === currentTab)?.label}
          </h1>
          {role === 'guest' && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-300">
              {t.readOnlyMode}
            </span>
          )}
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 print:overflow-visible print:p-0 print:bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
