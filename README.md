# HỆ THỐNG QUẢN LÝ DỰ ÁN & GÓI THẦU CẢI TẠO, SỬA CHỮA
## TRƯỜNG ĐẠI HỌC PHÚ XUÂN (PXU TASKMASTER PRO)

Hệ thống Web điều hành và giám sát kỹ thuật chuyên dụng cho 16 hạng mục công trình cải tạo, sửa chữa tại **Trường Đại học Phú Xuân (PXU)**. Hệ thống được chuẩn hóa nghiệp vụ dựa trên:
- **Quy trình 9 bước quản lý gói thầu chuẩn hóa** (từ phê duyệt chủ trương đến quyết toán & bảo hành).
- **Hồ sơ hợp đồng thi công thực tế**: HĐ 18/2026, HĐ 08/2026, HĐ 09/2026, HĐ 10/2026, HĐ 22102026 và các báo cáo theo dõi hiện trường.
- **Mô hình quản trị 3 cấp**: Admin (Chủ trì toàn quyền), Kỹ sư giám sát / Đơn vị thực hiện (Báo cáo hiện trường, ảnh minh chứng, sự cố), Lãnh đạo nhà trường (Theo dõi tiến độ, gửi chỉ đạo).

---

## 1. Vai trò và Phân quyền người dùng

| Vai trò | Người phụ trách mẫu | Quyền hạn chính |
|---|---|---|
| **Admin (Chủ trì)** | Thầy Vương | Toàn quyền điều hành: tạo/sửa dự án & gói thầu, phân rã công việc, giao task, duyệt/trả báo cáo tiến độ, xử lý sự cố hiện trường, cấp quyền xem cho lãnh đạo, truy cập toàn bộ 16 route. |
| **Assignee (Giám sát / Kỹ sư)** | Thầy Kiệt | Xem các gói thầu tham gia; truy cập trung tâm việc làm cá nhân (`/my-tasks`); cập nhật % tiến độ kèm ảnh minh chứng; báo cáo sự cố phát sinh ngoài ý muốn (thời tiết, mặt bằng); trao đổi kỹ thuật. |
| **Leader (Lãnh đạo nhà trường)** | TS. Nguyễn Văn Dũng, ThS. Hoàng Tuấn | Chỉ truy cập các dự án được Admin cấp quyền; theo dõi biểu đồ tiến độ & dòng tiền; gửi chỉ đạo / kết luận điều hành trực tiếp vào từng gói thầu. Không can thiệp chỉnh sửa dữ liệu kỹ thuật. |

---

## 2. Quy trình 9 Bước Quản lý Gói thầu Chuẩn hóa

Mỗi gói thầu tại Đại học Phú Xuân tuân thủ vòng đời 9 bước, được điều hướng trực quan qua bảng **Kanban kéo thả** và thanh **Workflow Stepper**:

1. **Bước 1 — Phê duyệt chủ trương đầu tư**: Tờ trình đề xuất, xác định phạm vi, kinh phí dự kiến.
2. **Bước 2 — Hoàn thiện hồ sơ thiết kế và dự toán**: Khảo sát hiện trạng, phê duyệt thiết kế, lập dự toán.
3. **Bước 3 — Tổ chức lựa chọn nhà thầu**: Chào giá, so sánh phương án, tờ trình đề xuất lựa chọn nhà thầu.
4. **Bước 4 — Thương thảo và ký kết hợp đồng**: Ký kết hợp đồng chính thức (phạm vi, giá trị, điều kiện tạm ứng, bảo hành).
5. **Bước 5 — Lập và phê duyệt kế hoạch triển khai**: Xây dựng tiến độ thi công chi tiết, mốc kiểm soát.
6. **Bước 6 — Tổ chức thi công và giám sát**: Triển khai hiện trường, giám sát kỹ thuật, an toàn lao động, nhật ký thi công.
7. **Bước 7 — Nghiệm thu công việc và giai đoạn**: Biên bản kiểm tra khối lượng, nghiệm thu kỹ thuật A4, ảnh minh chứng.
8. **Bước 8 — Bàn giao đưa vào sử dụng**: Nghiệm thu hoàn thành, bàn giao hiện trạng, đào tạo vận hành.
9. **Bước 9 — Quyết toán và bảo hành**: Hồ sơ quyết toán kinh phí, thanh lý hợp đồng, lưu trữ hồ sơ, quản lý bảo hành.

---

## 3. Kiến trúc Công nghệ & Thư viện

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Server Components & Client Components)
- **UI & Runtime**: [React 19](https://react.dev), TypeScript (strict mode)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) + Hệ màu Aurora (Dark/Light mode mượt mà, hỗ trợ in ấn A4 chuẩn `print:`)
- **Quản lý trạng thái (State Management)**:
  - [Zustand](https://github.com/pmndrs/zustand) với middleware `persist` lưu cục bộ qua `localStorage`.
  - Cơ chế **Seed Versioning** (`src/lib/seed.ts` - phiên bản `v3`): tự động cập nhật dữ liệu mẫu chuẩn nghiệp vụ khi cấu trúc thay đổi mà không làm mất trạng thái người dùng.
- **Động cơ tính toán số liệu (Safe Selectors)**: `src/lib/selectors.ts` là nguồn chân lý duy nhất (Single Source of Truth) để tính:
  - % tiến độ danh mục tổng hợp có tính trọng số theo giá trị hợp đồng (VNĐ).
  - % tiến độ theo kế hoạch thời gian trôi qua.
  - Phân loại cảnh báo đỏ (Red alerts) và mức độ rủi ro (low, medium, critical).
- **Thư viện bổ trợ**:
  - `lucide-react`: Hệ thống icon kỹ thuật
  - `sonner`: Thông báo Toast tương tác
  - `cmdk`: Command Palette tìm kiếm nhanh (`Ctrl + K`)
  - `@supabase/supabase-js`: Chuẩn bị sẵn module kết nối database và auth đám mây (`src/lib/supabase.ts`)

---

## 4. Cấu trúc Thư mục Nguồn

```text
├── public/                       # Tài nguyên tĩnh
├── src/
│   ├── app/                      # Next.js App Router (16 routes)
│   │   ├── layout.tsx            # Root layout bọc AppProvider & Sonner
│   │   ├── page.tsx              # Dashboard điều hành (KPIs, biểu đồ tiến độ trọng số, chỉ đạo nhanh)
│   │   ├── login/page.tsx        # Đăng nhập chọn vai trò & xác thực 2FA mô phỏng
│   │   ├── projects/page.tsx     # Danh mục 16 gói thầu PXU, bộ lọc, hợp đồng, Kanban
│   │   ├── projects/[id]/page.tsx# Chi tiết gói thầu (5 tab: Tổng quan, 9 bước, Tài chính, Sự cố, Minh chứng)
│   │   ├── my-tasks/page.tsx     # Bàn làm việc kỹ sư (quá hạn, sắp đến hạn, chờ duyệt, đã duyệt)
│   │   ├── tasks/new/page.tsx    # Giao việc mới & phân rã mục tiêu (Admin)
│   │   ├── messages/page.tsx     # Kênh trao đổi nội bộ theo gói thầu và tin nhắn trực tiếp
│   │   ├── reports/page.tsx      # Trung tâm báo cáo tiến độ, tài chính, sự cố
│   │   ├── reports/print/page.tsx# Trang in A4 Báo cáo tổng hợp tiến độ & tài chính
│   │   ├── reports/minutes/[taskId]/page.tsx # Biên bản nghiệm thu kỹ thuật A4 chuẩn in ấn
│   │   ├── users/page.tsx        # Quản lý nhân sự và phân quyền dự án
│   │   ├── audit-logs/page.tsx   # Nhật ký kiểm toán hoạt động hệ thống
│   │   └── settings/page.tsx     # Cài đặt giao diện Sáng/Tối, reset dữ liệu, bảo mật 2FA
│   │
│   ├── components/
│   │   ├── layout/               # AppShell, AppHeader, AppSidebar, BottomNav, CommandPalette
│   │   ├── projects/             # TaskKanbanView, TaskListView, TaskTimelineView, WorkflowStepper,
│   │   │                         # WorkBreakdownChecklist, ProjectContractsCard, ProjectGallery,
│   │   │                         # ProjectChat, ProjectMembers
│   │   ├── tasks/                # TaskDetailModal, TaskUpdateModal, TaskApprovalModal
│   │   ├── providers/            # AppProvider (Theme, Auth gate, Khởi tạo dữ liệu)
│   │   └── ui/                   # AuroraBackground, RingProgress, Sparkline, StatusBadge,
│   │                             # SegmentedControl, Modal, cards, Switch, RowMenu, PageHeader
│   │
│   └── lib/
│       ├── types.ts              # Định nghĩa TypeScript toàn bộ thực thể nghiệp vụ
│       ├── utils.ts              # Hàm định dạng tiền VNĐ, ngày tháng VN, tính hạn quá hạn, ghép class cn()
│       ├── selectors.ts          # Bộ chọn tính toán tiến độ trọng số và phân loại rủi ro
│       ├── store.ts              # Zustand store điều phối toàn bộ hành động (CRUD, duyệt, sự cố)
│       ├── seed.ts               # Bộ nạp dữ liệu chuẩn 16 gói thầu & di chuyển phiên bản
│       ├── mock-data.ts          # Dữ liệu 16 gói thầu chi tiết kèm phân rã công việc & hợp đồng thực tế
│       ├── mock-images.ts        # Bộ phát sinh ảnh minh chứng SVG và bìa gói thầu
│       └── supabase.ts           # Cấu hình Supabase client
└── supabase/
    └── schema.sql                # SQL Schema đầy đủ cho cơ sở dữ liệu PostgreSQL
```

---

## 5. Hướng dẫn Cài đặt & Vận hành

### Yêu cầu môi trường
- **Node.js**: Phiên bản 18 trở lên (khuyến nghị 20+)
- **Trình quản lý gói**: `npm`, `yarn`, `pnpm` hoặc `bun`

### Cài đặt dependencies
```bash
npm install
```

### Chạy môi trường phát triển (Development)
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

### Kiểm tra mã nguồn (Lint & Type-check)
```bash
npm run lint
npx tsc --noEmit
```

### Đóng gói sản xuất (Production Build)
```bash
npm run build
npm run start
```

---

## 6. Nhật ký Tối ưu & Dọn dẹp Mã nguồn (Safe Refactoring)

Dự án đã được rà soát và tinh giản toàn diện theo nguyên tắc **Safe Refactoring**:
- **Bảo toàn tuyệt đối**: Giữ nguyên 100% giao diện UI/UX, logic nghiệp vụ, dữ liệu, cấu trúc định tuyến và các phiên bản dependencies trong `package.json`.
- **Tài nguyên thừa đã loại bỏ**:
  - Xóa 5 file SVG boilerplate từ create-next-app trong `public/` không được dùng (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).
  - Xóa component `CircularProgress.tsx` không còn sử dụng (đã được thay thế hoàn toàn bởi `RingProgress.tsx` theo ngôn ngữ thiết kế Aurora).
- **Mã nguồn được tối ưu**:
  - Dọn dẹp toàn bộ import thừa `React` ở các file `.tsx` phù hợp với chuẩn JSX Transform mới của React 19.
  - Hợp nhất các câu lệnh import trùng lặp thư viện `lucide-react` trong `src/app/reports/page.tsx`.
  - Tinh chỉnh tham số signature `_state` trong hàm `selectWeightedTimeProgress` tại `src/lib/selectors.ts` để loại bỏ cảnh báo biến không sử dụng.
- **Kết quả kiểm thử**:
  - `npm run lint`: **0 lỗi, 0 cảnh báo**.
  - `npx tsc --noEmit`: **0 lỗi biên dịch TypeScript**.
  - `npm run build`: **Biên dịch và prerender thành công 16/16 routes**.
