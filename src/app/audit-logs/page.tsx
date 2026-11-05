'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, EmptyState } from '@/components/ui/cards';
import { useConstructionStore } from '@/lib/store';
import { History, Search, ShieldAlert } from 'lucide-react';
import { formatDateTimeVN } from '@/lib/utils';

export default function AuditLogsPage() {
  const currentUser = useConstructionStore((s) => s.currentUser);
  const auditLogs = useConstructionStore((s) => s.auditLogs);
  const users = useConstructionStore((s) => s.users);

  const [search, setSearch] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState('all');

  if (currentUser.role !== 'admin') {
    return (
      <AppShell>
        <div className="card max-w-md mx-auto">
          <EmptyState
            icon={<ShieldAlert className="w-6 h-6" />}
            title="Không có quyền truy cập"
            description="Chỉ Quản trị viên (Thầy Trần Quốc Vương) mới có quyền kiểm tra nhật ký hoạt động hệ thống."
          />
        </div>
      </AppShell>
    );
  }

  // Get distinct actions
  const allActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase());
    const matchesUser = selectedUserFilter === 'all' || log.userId === selectedUserFilter;
    const matchesAction = selectedActionFilter === 'all' || log.action === selectedActionFilter;
    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <AppShell>
      <div>
        <PageHeader
          eyebrow="Kiểm soát tuân thủ & An toàn"
          title="Nhật ký Hoạt động Công trình"
          description="Ghi nhận mọi thao tác giao việc, nghiệm thu, chỉnh sửa và cấp quyền (bản demo: lưu trong trình duyệt)"
        >
          <StatusBadge tone="navy">
            <History className="w-3.5 h-3.5" />
            {auditLogs.length} bản ghi
          </StatusBadge>
        </PageHeader>

        {/* Filter bar */}
        <div className="card p-4 mb-5 flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 min-w-52">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo người thực hiện, mục tiêu, chi tiết..."
              className="input !pl-10"
            />
          </div>

          <div className="w-full sm:w-60 shrink-0">
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              aria-label="Lọc theo người thao tác"
              className="input font-medium"
            >
              <option value="all">Tất cả người thực hiện</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto shrink-0">
            <SegmentedControl
              size="sm"
              value={selectedActionFilter}
              onChange={setSelectedActionFilter}
              options={[
                { value: 'all', label: 'Tất cả hành động' },
                ...allActions.map((action) => ({ value: action, label: action })),
              ]}
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Đối tượng tác động</th>
                  <th>Chi tiết ghi nhận</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap font-mono text-ink-soft text-xs">
                        {formatDateTimeVN(log.timestamp)}
                      </td>

                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size="sm"
                            tone="navy"
                            text={log.userName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(-2)
                              .join('')}
                          />
                          <span className="font-bold text-ink dark:text-slate-200">
                            {log.userName}
                          </span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap">
                        <StatusBadge tone="slate">{log.action}</StatusBadge>
                      </td>

                      <td className="font-semibold text-ink dark:text-slate-200 max-w-xs truncate">
                        {log.target}
                      </td>

                      <td className="text-ink-soft dark:text-slate-400 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <EmptyState
              icon={<History className="w-6 h-6" />}
              title="Không có bản ghi phù hợp"
              description="Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc đang chọn."
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
