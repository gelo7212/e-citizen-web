'use client';

import { useState } from 'react';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { Card } from '@/components/shared/Card';

interface AdminAccount {
  id: string;
  email: string;
  role: string;
  cityCode: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'city_admin',
    cityCode: '',
  });

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Call API to add new admin account
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create admin account');
      }

      const data = await response.json();
      setAccounts([...accounts, data.data]);
      setFormData({ email: '', role: 'city_admin', cityCode: '' });
      setShowAddForm(false);

      // Show success message
      alert('Admin account created successfully');
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create admin account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this admin account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/accounts/${accountId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete admin account');
      }

      setAccounts(accounts.filter(acc => acc.id !== accountId));
      alert('Admin account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete admin account');
    }
  };

  return (
    <RoleGuard requiredRoles={['app_admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Accounts</h1>
            <p className="mt-2 text-gray-600">
              Manage administrator accounts for the system
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            {showAddForm ? 'Cancel' : 'Add Admin Account'}
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Create New Admin Account</h2>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="city_admin">City Admin</option>
                  <option value="sos_admin">SOS Admin</option>
                  <option value="sk_admin">Youth Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City Code
                </label>
                <input
                  type="text"
                  value={formData.cityCode}
                  onChange={(e) => setFormData({ ...formData, cityCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., MNL"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Accounts Table */}
        <Card>
          {accounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No admin accounts created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      City
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{account.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {account.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{account.cityCode}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 text-sm rounded-full ${
                            account.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </RoleGuard>
  );
}
