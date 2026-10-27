'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useConstructionStore } from '@/lib/store';
import { Search } from 'lucide-react';
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
        <div className="py-20 text-center max-w-md mx-auto">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Không có quyền truy cập
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Chỉ Quản trị viên (Thầy Trần Quốc Vương) mới có quyền kiểm tra nhật ký hoạt động hệ thống.
          </p>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Kiểm soát tuân thủ & An toàn
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Nhật ký Hoạt động Công trình
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Bản ghi bất biến ghi nhận mọi thao tác giao việc, nghiệm thu, chỉnh sửa và cấp quyền
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 font-mono font-bold border border-slate-700">
              {auditLogs.length} bản ghi
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo người thực hiện, mục tiêu, chi tiết..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* User filter */}
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              aria-label="Lọc theo người thao tác"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả người thực hiện</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Action filter */}
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              aria-label="Lọc theo loại hành động"
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả hành động</option>
              {allActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4">Hành động</th>
                  <th className="py-3.5 px-4">Đối tượng tác động</th>
                  <th className="py-3.5 px-4">Chi tiết ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                        {formatDateTimeVN(log.timestamp)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-500 font-bold text-[10px] flex items-center justify-center">
                            {log.userName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(-2)
                              .join('')}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.userName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px] border border-slate-200 dark:border-slate-700">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {log.target}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

