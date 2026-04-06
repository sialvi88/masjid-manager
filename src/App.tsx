/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useStore } from './store';
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Donations from './components/Donations';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import AdminTools from './components/AdminTools';

export default function App() {
  const role = useStore((state) => state.role);
  const fetchDataFromFirebase = useStore((state) => state.fetchDataFromFirebase);
  const [currentTab, setCurrentTab] = useState('dashboard');

  useEffect(() => {
    fetchDataFromFirebase();
  }, [fetchDataFromFirebase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            if (currentTab !== 'donations') setCurrentTab('donations');
            break;
          case 'p':
            e.preventDefault();
            if (currentTab === 'reports') {
              window.print();
            } else {
              setCurrentTab('reports');
            }
            break;
          case 'z':
            e.preventDefault();
            useStore.getState().undoDeleteExpense();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab]);

  if (!role) {
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'donations': return <Donations />;
      case 'expenses': return <Expenses />;
      case 'reports': return <Reports />;
      case 'admin-tools': return <AdminTools />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

