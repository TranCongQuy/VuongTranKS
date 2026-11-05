'use client';

import React from 'react';
import { Project } from '@/lib/types';
import { useConstructionStore } from '@/lib/store';
import { ShieldCheck, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { SectionCard, Avatar } from '@/components/ui/cards';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Switch } from '@/components/ui/Switch';

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
    <div className="space-y-5">
      {/* Overview notice */}
      <div className="p-4 rounded-[20px] bg-gold-100/60 dark:bg-gold-500/10 border border-gold-500/25 text-gold-600 dark:text-gold-400 text-[13px] flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span className="text-ink dark:text-slate-200">
          {currentUser.role === 'admin'
            ? 'Chủ trì Kế hoạch (Admin) có thể bật/tắt quyền xem của từng Lãnh đạo đối với dự án này.'
            : 'Danh sách nhân sự điều hành và lãnh đạo được phân quyền giám sát kế hoạch dự án.'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {/* Leaders Access Control */}
        <SectionCard
          title="Phân quyền Lãnh đạo xem dự án"
          subtitle="Bật để cấp quyền theo dõi dự án này"
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft dark:text-slate-400">
              <Eye className="w-3.5 h-3.5" />
              {project.leaderIds.length} lãnh đạo có quyền
            </span>
          }
          pad={false}
        >
          <ul className="divide-y divide-line dark:divide-night-line px-5">
            {leaders.map((leader) => {
              const hasAccess = project.leaderIds.includes(leader.id);

              return (
                <li key={leader.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar text={leader.avatar} tone="pine" />
                    <div className="min-w-0">
                      <div className="font-bold text-[13px] text-ink dark:text-slate-200 truncate">
                        {leader.name}
                      </div>
                      <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">{leader.title}</div>
                    </div>
                  </div>

                  {currentUser.role === 'admin' ? (
                    <div className="flex items-center gap-2.5 shrink-0">
                      <StatusBadge tone={hasAccess ? 'pine' : 'slate'}>
                        {hasAccess ? 'Được xem' : 'Chặn xem'}
                      </StatusBadge>
                      <Switch
                        checked={hasAccess}
                        onChange={() => handleToggle(leader.id, hasAccess)}
                        label={`Quyền xem dự án của ${leader.name}`}
                      />
                    </div>
                  ) : (
                    <StatusBadge tone={hasAccess ? 'pine' : 'slate'}>
                      {hasAccess ? 'Có quyền xem' : 'Không có quyền'}
                    </StatusBadge>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        {/* Executive & Collaborators Team */}
        <SectionCard
          title="Đội ngũ Điều phối & Thực hiện"
          subtitle="Ban điều phối dự án"
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {admins.length + assignees.length} thành viên
            </span>
          }
          pad={false}
        >
          <ul className="divide-y divide-line dark:divide-night-line px-5">
            {/* Manager (Admin) */}
            {admins.map((adm) => (
              <li key={adm.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar text={adm.avatar} tone="gold" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-ink dark:text-slate-200 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{adm.name}</span>
                      <StatusBadge tone="gold">Chủ trì dự án</StatusBadge>
                    </div>
                    <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">{adm.email} • {adm.phone}</div>
                  </div>
                </div>
                <StatusBadge tone="navy" className="shrink-0">Toàn quyền</StatusBadge>
              </li>
            ))}

            {/* Field Engineers */}
            {assignees.map((asg) => (
              <li key={asg.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar text={asg.avatar} tone="navy" />
                  <div className="min-w-0">
                    <div className="font-bold text-[13px] text-ink dark:text-slate-200 truncate">
                      {asg.name}
                    </div>
                    <div className="text-[11px] text-ink-soft dark:text-slate-400 truncate">{asg.title} • {asg.phone}</div>
                  </div>
                </div>
                <StatusBadge tone="sky" className="shrink-0">Thực hiện</StatusBadge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
