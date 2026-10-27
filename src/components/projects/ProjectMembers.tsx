'use client';

import React from 'react';
import { Project } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import { ShieldCheck, Users, Eye, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectMembersProps {
  project: Project;
  isReadOnly?: boolean;
}

export function ProjectMembers({ project, isReadOnly = false }: ProjectMembersProps) {
  const users = useConstructionStore((s) => s.users);
  const toggleLeaderAccess = useConstructionStore((s) => s.toggleLeaderAccess);
  const currentUser = useConstructionStore((s) => s.currentUser);

  const leaders = users.filter((u) => u.role === 'leader');
  const assignees = users.filter((u) => u.role === 'assignee');
  const admins = users.filter((u) => u.role === 'admin');

  const handleToggle = (leaderId: string, currentAllowed: boolean) => {
    if (isReadOnly || currentUser.role !== 'admin') {
      toast.error('Chỉ Quản trị viên (Chỉ huy trưởng) mới có quyền cấp hoặc thu hồi quyền xem.');
      return;
    }

    const nextState = !currentAllowed;
    toggleLeaderAccess(project.id, leaderId, nextState);
    toast.success(
      nextState ? 'Đã cấp quyền theo dõi cho lãnh đạo' : 'Đã thu hồi quyền theo dõi của lãnh đạo'
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview notice */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {currentUser.role === 'admin'
              ? 'Chủ trì Kế hoạch (Admin) có thể bật/tắt quyền xem của từng Lãnh đạo đối với dự án này.'
              : 'Danh sách nhân sự điều hành và lãnh đạo được phân quyền giám sát kế hoạch dự án.'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leaders Access Control */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Phân quyền Lãnh đạo xem dự án
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {project.leaderIds.length} lãnh đạo có quyền
            </span>
          </div>

          <div className="space-y-3">
            {leaders.map((leader) => {
              const hasAccess = project.leaderIds.includes(leader.id);

              return (
                <div
                  key={leader.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center text-xs">
                      {leader.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                        {leader.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{leader.title}</div>
                    </div>
                  </div>

                  {currentUser.role === 'admin' ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(leader.id, hasAccess)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        hasAccess
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-500'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-emerald-500 hover:text-white'
                      }`}
                    >
                      {hasAccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Được xem</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Chặn xem</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        hasAccess
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {hasAccess ? 'Có quyền xem' : 'Không có quyền'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Executive & Collaborators Team */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Đội ngũ Điều phối & Thực hiện
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Ban điều phối</span>
          </div>

          <div className="space-y-3">
            {/* Manager (Admin) */}
            {admins.map((adm) => (
              <div
                key={adm.id}
                className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold flex items-center justify-center text-xs">
                    {adm.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span>{adm.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500">
                        Chủ trì dự án
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{adm.email} • {adm.phone}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-500">Toàn quyền</span>
              </div>
            ))}

            {/* Field Engineers */}
            {assignees.map((asg) => (
              <div
                key={asg.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-xs">
                    {asg.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {asg.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{asg.title} • {asg.phone}</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-500">Thực hiện</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

