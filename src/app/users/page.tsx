'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { RowMenu } from '@/components/ui/RowMenu';
import { Switch } from '@/components/ui/Switch';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, EmptyState } from '@/components/ui/cards';
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
  Phone,
  ShieldAlert,
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
        <div className="card max-w-md mx-auto">
          <EmptyState
            icon={<ShieldAlert className="w-6 h-6" />}
            title="Không có quyền truy cập"
            description="Chỉ Quản trị viên (Thầy Trần Quốc Vương) mới có quyền quản lý tài khoản và phân quyền người dùng."
          />
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
      <div>
        <PageHeader
          eyebrow="Quản trị hệ thống"
          title="Quản lý Người dùng & Phân quyền"
          description="Danh sách nhân sự, chức danh, phân vai trò và kiểm soát trạng thái khóa/mở tài khoản"
        >
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            Thêm thành viên
          </button>
        </PageHeader>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò hệ thống</th>
                  <th>Đơn vị công tác</th>
                  <th>Liên hệ</th>
                  <th>Trạng thái</th>
                  <th className="!text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className={u.isActive ? '' : 'opacity-45'}>
                            <Avatar text={u.avatar} tone="navy" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-ink dark:text-slate-100 flex items-center gap-1.5">
                              <span className="truncate">{u.name}</span>
                              {u.id === currentUser.id && (
                                <StatusBadge tone="gold">Bạn</StatusBadge>
                              )}
                            </div>
                            <div className="text-[11px] text-ink-soft truncate">{u.title}</div>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        <StatusBadge
                          tone={u.role === 'admin' ? 'gold' : u.role === 'assignee' ? 'sky' : 'pine'}
                          dot
                        >
                          {u.role === 'admin' && <ShieldCheck className="w-3 h-3" />}
                          {u.role === 'assignee' && <HardHat className="w-3 h-3" />}
                          {u.role === 'leader' && <Eye className="w-3 h-3" />}
                          {u.role === 'admin'
                            ? 'Quản trị viên'
                            : u.role === 'assignee'
                            ? 'Kỹ sư hiện trường'
                            : 'Lãnh đạo (Xem)'}
                        </StatusBadge>
                      </td>

                      <td>
                        <div className="font-medium text-ink dark:text-slate-200">{u.department}</div>
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-ink-soft">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-ink-soft mt-1 font-mono text-xs">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={u.isActive}
                            onChange={() => handleToggleLock(u)}
                            label={u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          />
                          <span
                            className={`text-xs font-semibold ${
                              u.isActive ? 'text-pine-700 dark:text-pine-500' : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                          </span>
                        </div>
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <RowMenu
                          label={`Thao tác với ${u.name}`}
                          items={[
                            {
                              label: 'Sửa thông tin',
                              icon: <Edit2 className="w-4 h-4" />,
                              onClick: () => setEditingUser(u),
                            },
                            {
                              label: u.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
                              icon: u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />,
                              danger: u.isActive,
                              onClick: () => handleToggleLock(u),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Thêm người dùng */}
        <form onSubmit={handleAddUser}>
          <Modal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Thêm tài khoản người dùng"
            subtitle="Thành viên mới sẽ đăng nhập theo vai trò được cấp"
            size="md"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  Thêm tài khoản
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="lbl">Họ và tên *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ví dụ: KS. Nguyễn Văn An"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Email đăng nhập *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vanan@pxu.edu.vn"
                    className="input"
                  />
                </div>

                <div>
                  <label className="lbl">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912.xxx.xxx"
                    className="input font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="lbl">Vai trò hệ thống *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="input"
                  >
                    <option value="assignee">Kỹ sư hiện trường (Thực hiện)</option>
                    <option value="leader">Lãnh đạo (Chỉ xem)</option>
                    <option value="admin">Quản trị viên (Chỉ huy trưởng)</option>
                  </select>
                </div>

                <div>
                  <label className="lbl">Chức danh chuyên môn</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </Modal>
        </form>

        {/* Modal Sửa người dùng */}
        {editingUser && (
          <form onSubmit={handleSaveEdit}>
            <Modal
              open={!!editingUser}
              onClose={() => setEditingUser(null)}
              title={`Cập nhật thông tin: ${editingUser.name}`}
              size="md"
              footer={
                <>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="btn-ghost"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Lưu thay đổi
                  </button>
                </>
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="lbl">Họ và tên</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="input font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="lbl">Vai trò</label>
                    <select
                      value={editingUser.role}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value as Role })
                      }
                      className="input"
                    >
                      <option value="admin">Quản trị viên (Chỉ huy trưởng)</option>
                      <option value="assignee">Kỹ sư hiện trường</option>
                      <option value="leader">Lãnh đạo (Chỉ xem)</option>
                    </select>
                  </div>

                  <div>
                    <label className="lbl">Chức danh</label>
                    <input
                      type="text"
                      value={editingUser.title}
                      onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </Modal>
          </form>
        )}
      </div>
    </AppShell>
  );
}
