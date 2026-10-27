-- ========================================================
-- CƠ SỞ DỮ LIỆU SUPABASE - HỆ THỐNG GIAO VIỆC & THEO DÕI CÔNG TRÌNH
-- Trường Đại học Phú Xuân (PXU TaskMaster Pro)
-- Copy và chạy toàn bộ mã này trong Supabase: SQL Editor -> New Query -> Run
-- ========================================================

-- 1. BẢNG DỰ ÁN / 16 GÓI THẦU CẢI TẠO (projects)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT DEFAULT 'facilities',
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  workflow_step INT DEFAULT 1,
  campus TEXT DEFAULT 'cs2',
  organization TEXT,
  contractor TEXT,
  budget TEXT,
  budget_total NUMERIC,
  completed_tasks_list JSONB DEFAULT '[]'::jsonb,
  pending_tasks_list JSONB DEFAULT '[]'::jsonb,
  red_alerts JSONB DEFAULT '[]'::jsonb,
  technical_notes TEXT,
  leader_ids JSONB DEFAULT '["usr-leader-1"]'::jsonb,
  member_ids JSONB DEFAULT '["usr-assignee"]'::jsonb,
  manager_id TEXT DEFAULT 'usr-admin',
  cover_gradient TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BẢNG HỢP ĐỒNG THI CÔNG & PHÁP LÝ (contracts)
CREATE TABLE IF NOT EXISTS public.contracts (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  contract_value NUMERIC NOT NULL,
  vat_rate NUMERIC DEFAULT 10,
  advance_payment_rate NUMERIC DEFAULT 30,
  warranty_rate NUMERIC DEFAULT 5,
  warranty_months INT DEFAULT 12,
  scope_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. BẢNG NHIỆM VỤ / TASK CHI TIẾT (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id TEXT DEFAULT 'usr-assignee',
  status TEXT DEFAULT 'todo', -- todo, in_progress, submitted, approved, returned
  progress INT DEFAULT 0,
  start_date DATE,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  return_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BẢNG SỰ CỐ & PHÁT SINH HIỆN TRƯỜNG (task_incidents)
CREATE TABLE IF NOT EXISTS public.task_incidents (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'site', -- weather, material, technical, site, other
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, resolving, resolved
  reported_by TEXT DEFAULT 'usr-assignee',
  solution TEXT,
  reported_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 5. BẢNG MỐC THANH TOÁN THEO ĐỢT (payment_milestones)
CREATE TABLE IF NOT EXISTS public.payment_milestones (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  due_date DATE,
  paid_date DATE,
  status TEXT DEFAULT 'pending', -- paid, pending, overdue
  proof_file TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BẢNG NHẬT KÝ BẤT BIẾN (audit_logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- BẬT ROW LEVEL SECURITY (RLS) & POLICY CHO PHÉP TRUY VẤN
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép đọc toàn bộ dữ liệu dự án" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Cho phép cập nhật dự án" ON public.projects FOR ALL USING (true);

CREATE POLICY "Cho phép đọc hợp đồng" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Cho phép chỉnh sửa hợp đồng" ON public.contracts FOR ALL USING (true);

CREATE POLICY "Cho phép đọc task" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Cho phép chỉnh sửa task" ON public.tasks FOR ALL USING (true);

CREATE POLICY "Cho phép đọc sự cố" ON public.task_incidents FOR SELECT USING (true);
CREATE POLICY "Cho phép chỉnh sửa sự cố" ON public.task_incidents FOR ALL USING (true);

CREATE POLICY "Cho phép đọc đợt thanh toán" ON public.payment_milestones FOR SELECT USING (true);
CREATE POLICY "Cho phép chỉnh sửa đợt thanh toán" ON public.payment_milestones FOR ALL USING (true);

CREATE POLICY "Cho phép đọc audit log" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Cho phép thêm audit log" ON public.audit_logs FOR INSERT WITH CHECK (true);

