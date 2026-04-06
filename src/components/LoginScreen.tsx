import React, { useState } from 'react';
import { useStore } from '../store';
import { Lock, User, Eye, EyeOff, Globe } from 'lucide-react';
import { translations } from '../translations';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const login = useStore(state => state.login);
  const loginAsGuest = useStore(state => state.loginAsGuest);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  
  const t = translations[language];
  const isRtl = language === 'ur';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError(isRtl ? 'براہ کرم یوزر نیم اور پاس ورڈ درج کریں' : 'Please enter username and password');
      return;
    }
    const success = login(username.trim(), password);
    if (!success) {
      setError(t.incorrectPassword);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 flex items-center justify-center p-4 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
        <Globe className="w-4 h-4 text-gray-500" />
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
          className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="en">English</option>
          <option value="ur">اردو</option>
        </select>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{t.adminLogin}</h1>
          <p className="text-gray-500 mt-2">{t.loginSubtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.username}</label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className={`block w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                placeholder={isRtl ? 'یوزر نیم درج کریں' : 'Enter username'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.password}</label>
            <div className="relative">
              <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className={`block w-full ${isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                placeholder={t.enterPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-gray-400 hover:text-gray-600`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {t.loginBtn}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t.or}</span>
            </div>
          </div>

          <button
            onClick={loginAsGuest}
            className="mt-6 w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {t.guestView}
          </button>
        </div>
      </div>
    </div>
  );
}
