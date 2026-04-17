import { ReactNode, useState } from 'react';
import { useStore } from '../store';
import { 
  LayoutDashboard, Users, Receipt, FileText, LogOut, Settings, Globe, Rocket, HeartHandshake,
  Activity, Droplets, Menu as MenuIcon, X as CloseIcon
} from 'lucide-react';
import { translations } from '../translations';
import NewsTicker from './NewsTicker';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const t = translations[language];
  const isRtl = language === 'ur';

  const hasPermission = (permission: string) => {
    if (role === 'guest') return true; 
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    return currentUser.permissions.includes(permission as any);
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, show: true },
    { id: 'donations', label: t.donations, icon: Users, show: hasPermission('manage_donations') },
    { id: 'expenses', label: t.expenses, icon: Receipt, show: hasPermission('manage_expenses') },
    { id: 'reports', label: t.reports, icon: FileText, show: hasPermission('view_reports') },
    { id: 'future-projects', label: t.futureProjects, icon: Rocket, show: true },
    { id: 'donation-methods', label: t.donationMethods, icon: HeartHandshake, show: true },
  ].filter(item => item.show);

  const handleTabChange = (id: string) => {
    setCurrentTab(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col md:flex-row ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center z-50 print:hidden">
        <div className="flex items-center gap-2">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded" />
          )}
          <h2 className="text-lg font-bold text-gray-800 leading-tight truncate max-w-[150px]">{settings.masjidName}</h2>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {isSidebarOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar / Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div className={`
        fixed md:static inset-y-0 ${isRtl ? 'right-0' : 'left-0'} z-50
        w-72 md:w-64 bg-white shadow-xl md:shadow-md flex flex-col h-screen transform transition-transform duration-300 ease-in-out print:hidden
        ${isSidebarOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full')} md:translate-x-0
      `}>
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          {settings.logoUrl && (
            <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain rounded" />
          )}
          <div>
            <h2 className="text-base md:text-xl font-bold text-gray-800 leading-tight">{settings.masjidName}</h2>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{settings.madrisaName}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-2 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-colors text-sm md:text-base ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-2 md:p-4 border-t border-gray-100 space-y-1 md:space-y-2 flex-shrink-0 mb-14 md:mb-0">
          <div className="flex items-center gap-2 px-3 py-1 md:px-4 md:py-2 text-gray-600">
            <Globe className="w-4 h-4 md:w-5 md:h-5 text-gray-400 shrink-0" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
              className="bg-transparent text-[11px] md:text-sm font-medium focus:outline-none cursor-pointer w-full"
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </div>
          
          {role !== 'guest' && (hasPermission('manage_settings') || hasPermission('manage_users')) ? (
            <div className="grid grid-cols-1 gap-1">
              {[
                { id: 'admin-tools', label: t.settings || 'Admin Tools', icon: Settings, perm: 'manage_settings' },
                { id: 'news-settings', label: t.newsSettings, icon: FileText, perm: 'manage_settings' },
                { id: 'dialysis-mgmt', label: t.dialysisManagement, icon: Activity, perm: 'manage_settings' },
                { id: 'water-filter-mgmt', label: t.waterFilterManagement, icon: Droplets, perm: 'manage_settings' }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors text-xs md:text-sm ${
                    currentTab === item.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${currentTab === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible h-screen md:h-auto">
        <header className="hidden md:flex bg-white shadow-sm z-10 p-4 justify-between items-center print:hidden">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find(i => i.id === currentTab)?.label}
          </h1>
          <div className="flex items-center gap-4">
            {role === 'guest' && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded border border-yellow-300">
                {t.readOnlyMode}
              </span>
            )}
            <button 
              onClick={logout}
              className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        </header>
        
        {/* Mobile Sub-Header for Tab Title & Logout */}
        <div className="md:hidden flex justify-between items-center px-4 py-2 bg-gray-100/80 backdrop-blur-sm border-b border-gray-200 shrink-0">
          <h3 className="text-sm font-semibold text-gray-600">
            {navItems.find(i => i.id === currentTab)?.label}
          </h3>
          <button 
            onClick={logout}
            className="flex items-center gap-1 text-red-500 text-[11px] font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3 h-3" />
            <span>{t.logout}</span>
          </button>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-3 md:p-6 pb-20 md:pb-24 print:overflow-visible print:p-0 print:bg-white">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      <NewsTicker />
    </div>
  );
}
