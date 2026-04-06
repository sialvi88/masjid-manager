import React, { useState } from 'react';
import { useStore, User, Permission } from '../store';
import { Users, UserPlus, Edit2, Trash2, Shield, Key, User as UserIcon } from 'lucide-react';

const availablePermissions: { id: Permission; label: string; labelUr: string }[] = [
  { id: 'manage_donations', label: 'Manage Donations', labelUr: 'عطیات کا انتظام' },
  { id: 'manage_expenses', label: 'Manage Expenses', labelUr: 'اخراجات کا انتظام' },
  { id: 'view_reports', label: 'View Reports', labelUr: 'رپورٹس دیکھیں' },
  { id: 'manage_settings', label: 'Manage Settings', labelUr: 'سیٹنگز کا انتظام' },
  { id: 'manage_users', label: 'Manage Users', labelUr: 'صارفین کا انتظام' },
];

export default function UserManagement() {
  const store = useStore();
  const { users, addUser, updateUser, deleteUser, language, currentUser } = store;
  const isRtl = language === 'ur';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    pin: '',
    role: 'Manager',
    permissions: [] as Permission[]
  });

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        pin: user.pin,
        role: user.role,
        permissions: [...user.permissions]
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        pin: '',
        role: 'Manager',
        permissions: ['manage_donations', 'manage_expenses', 'view_reports']
      });
    }
    setIsModalOpen(true);
  };

  const handleTogglePermission = (permission: Permission) => {
    setFormData(prev => {
      const hasPerm = prev.permissions.includes(permission);
      if (hasPerm) {
        return { ...prev, permissions: prev.permissions.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...prev.permissions, permission] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.pin) {
      alert('Username and PIN are required');
      return;
    }

    if (editingUser) {
      await updateUser(editingUser.id, formData);
    } else {
      // Check if username already exists
      if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
        alert('Username already exists');
        return;
      }
      await addUser(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">User Management (صارفین کا انتظام)</h2>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y divide-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Username</th>
              <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Role</th>
              <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Permissions</th>
              <th className={`px-6 py-3 ${isRtl ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase`}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-700 font-bold text-sm">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className={`${isRtl ? 'mr-3' : 'ml-3'}`}>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions.map(p => (
                      <span key={p} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                        {availablePermissions.find(ap => ap.id === p)?.label || p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    {(user.username !== 'admin' || currentUser?.username === 'admin') && (
                      <button
                        onClick={() => openModal(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {user.id !== currentUser?.id && user.username !== 'admin' && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? (isRtl ? 'صارف میں ترمیم کریں' : 'Edit User') : (isRtl ? 'نیا صارف شامل کریں' : 'Add New User')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (یوزر نیم)</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className={`block w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN / Password (پاس ورڈ)</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({...formData, pin: e.target.value})}
                    className={`block w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Title (عہدہ)</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    placeholder="e.g., Manager, Cashier"
                    className={`block w-full ${isRtl ? 'pr-10 pl-3' : 'pl-10 pr-3'} py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-900 mb-3">Permissions (اختیارات)</label>
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                      <input
                        type="checkbox"
                        disabled={currentUser?.role !== 'Admin'}
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{perm.label}</span>
                        <span className="text-xs text-gray-500">{perm.labelUr}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
