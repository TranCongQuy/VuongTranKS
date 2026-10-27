'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import { Role, User } from '@/lib/types';
import {
  UserPlus,
  ShieldCheck,
  HardHat,
  Eye,
  Lock,
  Unlock,
  Edit2,
  Mail,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const users = useConstructionStore((s) => s.users);
  const updateUserStatus = useConstructionStore((s) => s.updateUserStatus);
  const updateUser = useConstructionStore((s) => s.updateUser);
  const addUser = useConstructionStore((s) => s.addUser);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '09',
    role: 'assignee' as Role,
    title: 'Kỹ sư Giám sát Xây dựng',
    department: 'Ban Quản lý Dự án PXU',
    isActive: true,
    twoFactorEnabled: false,
  });

  if (currentUser.role !== 'admin') {
    return (
      <AppShell>
        <div className="py-20 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Không có quyền truy cập
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ Quản trị viên (Thầy Trần Quốc Vương) mới có quyền quản lý tài khoản và phân quyền người dùng.
          </p>
        </div>
      </AppShell>
    );
  }

  const handleToggleLock = (user: User) => {
    if (user.id === currentUser.id) {
      toast.error('Bạn không thể tự khóa tài khoản quản trị viên hiện tại!');
      return;
    }
    const nextStatus = !user.isActive;
    updateUserStatus(user.id, nextStatus);
    toast.success(
      nextStatus ? `Đã mở khóa tài khoản ${user.name}` : `Đã khóa tài khoản ${user.name}`,
      {
        description: nextStatus
          ? 'Tài khoản này có thể đăng nhập bình thường.'
          : 'Tài khoản này sẽ bị chặn khi đăng nhập demo.',
      }
    );
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Vui lòng điền họ tên và email hợp lệ.');
      return;
    }

    addUser(formData);
    toast.success(`Đã thêm thành viên mới: ${formData.name}`);
    setShowAddModal(false);
    setFormData({
      name: '',
      email: '',
      phone: '09',
      role: 'assignee',
      title: 'Kỹ sư Giám sát Xây dựng',
      department: 'Ban Quản lý Dự án PXU',
      isActive: true,
      twoFactorEnabled: false,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, editingUser);
    toast.success('Đã cập nhật thông tin người dùng.');
    setEditingUser(null);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Quản trị hệ thống
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Quản lý Người dùng & Phân quyền
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Danh sách nhân sự, chức danh, phân vai trò và kiểm soát trạng thái khóa/mở tài khoản
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            Thêm người dùng mới
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Họ và tên / Tài khoản</th>
                  <th className="py-3.5 px-4">Vai trò hệ thống</th>
                  <th className="py-3.5 px-4">Đơn vị công tác</th>
                  <th className="py-3.5 px-4">Số điện thoại</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                              u.isActive
                                ? 'bg-amber-500/20 text-amber-500'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {u.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.id === currentUser.id && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 font-bold">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit ${
                            u.role === 'admin'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : u.role === 'assignee'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          }`}
                        >
                          {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                          {u.role === 'assignee' && <HardHat className="w-3 h-3" />}
                          {u.role === 'leader' && <Eye className="w-3 h-3" />}
                          <span>
                            {u.role === 'admin'
                              ? 'Quản trị viên'
                              : u.role === 'assignee'
                              ? 'Kỹ sư hiện trường'
                              : 'Lãnh đạo (Xem)'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {u.title}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.department}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                        {u.phone}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            u.isActive
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleLock(u)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Thêm người dùng */}
        {showAddModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Thêm người dùng mới"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500" />
                  Thêm tài khoản người dùng
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ví dụ: KS. Nguyễn Văn An"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email đăng nhập *
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vanan@pxu.edu.vn"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0912.xxx.xxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vai trò hệ thống *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="assignee">Kỹ sư hiện trường (Thực hiện)</option>
                      <option value="leader">Lãnh đạo (Chỉ xem)</option>
                      <option value="admin">Quản trị viên (Chỉ huy trưởng)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chức danh chuyên môn
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                  >
                    Thêm tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Sửa người dùng */}
        {editingUser && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Cập nhật tài khoản"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          >
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-500" />
                  Cập nhật thông tin: {editingUser.name}
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vai trò
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value as Role })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="admin">Quản trị viên (Chỉ huy trưởng)</option>
                      <option value="assignee">Kỹ sư hiện trường</option>
                      <option value="leader">Lãnh đạo (Chỉ xem)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chức danh
                    </label>
                    <input
                      type="text"
                      value={editingUser.title}
                      onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

