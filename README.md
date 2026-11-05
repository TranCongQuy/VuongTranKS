# Quản lý Dự án PXU (PXU TaskMaster Pro)

Hệ thống quản lý dự án / gói thầu của **Đại học Phú Xuân (PXU)**: nơi Admin tạo dự án và giao việc, đội giám sát / người thực hiện báo cáo tiến độ tại hiện trường, và lãnh đạo theo dõi, chỉ đạo các dự án được cấp quyền xem.

## Vai trò và quyền

Hệ thống có 3 vai trò:

### 1. Admin — thầy chủ trì
- Toàn quyền điều hành hệ thống.
- Tạo / sửa / xoá dự án (gói thầu), giao nhiệm vụ (task) cho người thực hiện.
- Duyệt hoặc trả lại báo cáo tiến độ của giám sát.
- Quản lý thành viên, cấp quyền xem dự án cho từng lãnh đạo.
- Xem báo cáo tổng hợp, nhật ký hoạt động và mục "Việc của tôi".

### 2. Giám sát / Người thực hiện (assignee)
- Xem các dự án mình tham gia và các việc được giao trong mục "Việc của tôi".
- Báo cáo tiến độ % của nhiệm vụ kèm ảnh minh chứng.
- Báo cáo sự cố / phát sinh ngoài ý muốn tại hiện trường (ví dụ: thời tiết, vướng mắc mặt bằng) để Admin nắm và xử lý.
- Trao đổi với Admin và các thành viên trong từng dự án.

### 3. Lãnh đạo (leader)
- Chỉ xem được những dự án đã được Admin cấp quyền xem — không thấy dự án ngoài phạm vi.
- Theo dõi tiến độ hoàn thiện của từng dự án được cấp quyền.
- Gửi chỉ đạo và đánh giá vào dự án.
- Không giao việc, không sửa dữ liệu nghiệp vụ.

## Luồng nghiệp vụ

1. **Admin tạo dự án** nhà trường / gói thầu và thiết lập các hạng mục, mốc tiến độ.
2. **Admin giao task** cho giám sát / người thực hiện (có tài khoản theo vai trò).
3. **Giám sát tới hiện trường**, kiểm tra dự án đạt bao nhiêu % rồi **báo cáo tiến độ kèm ảnh minh chứng**; nếu có phát sinh ngoài ý muốn (thời tiết, sự cố...) thì **báo cáo sự cố** ngay trong nhiệm vụ.
4. **Admin duyệt hoặc trả lại** báo cáo (trả lại kèm lý do để giám sát bổ sung).
5. **Lãnh đạo xem** tiến độ các dự án được cấp quyền, **gửi chỉ đạo / đánh giá** khi cần.
6. Mọi người **trao đổi trong từng dự án** qua mục Trao đổi / tin nhắn theo dự án, Admin tham gia như thành viên điều hành.

## Tính năng chính

- Tổng quan điều hành: tiến độ dự án, việc quá hạn, việc chờ duyệt, sự cố hiện trường.
- Quản lý dự án / gói thầu: tiến độ %, hạng mục công việc, mốc thanh toán, quy trình các bước.
- Giao việc & theo dõi task theo trạng thái, kèm việc con (subtask) và hạn hoàn thành.
- Báo cáo tiến độ có ảnh minh chứng, báo cáo sự cố, duyệt / trả báo cáo.
- Phân quyền xem dự án cho lãnh đạo theo từng dự án.
- Chỉ đạo và đánh giá của lãnh đạo ngay trên dự án.
- Trao đổi (chat) theo dự án giữa các user và Admin, có thông báo tin nhắn chưa đọc.
- Thông báo trong hệ thống, nhật ký hoạt động, báo cáo & xuất PDF, giao diện sáng / tối, dùng tốt trên điện thoại (thanh điều hướng dưới).

## Công nghệ

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Zustand** (quản lý state, persist xuống localStorage)
- Lucide icons, Sonner (toast), Recharts (biểu đồ)

## Cách chạy

Cài dependencies:

```bash
npm install
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Mở http://localhost:3000 — hệ thống sẽ đưa bạn tới trang đăng nhập, chọn một tài khoản demo để vào ngay (một số tài khoản có thêm bước OTP demo).

Build và chạy bản production:

```bash
npm run build
npm run start
```

## Ghi chú quan trọng

- **Đây là bản demo**: toàn bộ dữ liệu là dữ liệu mẫu và được lưu bằng **localStorage** trên trình duyệt. Mỗi trình duyệt / thiết bị có một bộ dữ liệu riêng, không đồng bộ với nhau và không có máy chủ dữ liệu thật phía sau.
- **Đăng nhập demo**: chọn tài khoản mẫu theo vai trò (Admin, Giám sát / Người thực hiện, Lãnh đạo); có thể chuyển vai trò demo ngay trong menu người dùng ở góc trên để xem hệ thống dưới góc nhìn của vai trò khác, và đăng xuất từ cùng menu đó.
- **Lộ trình tiếp theo**: kết nối **Supabase** thật (cơ sở dữ liệu + đăng nhập thật + đồng bộ giữa các thiết bị) ở đợt nâng cấp sau. File `src/lib/supabase.ts` và thư mục `supabase/` (schema) hiện có chỉ là phần chuẩn bị, chưa được dùng trong luồng dữ liệu hiện tại.

## Cấu trúc thư mục

```text
src/
  app/            # Các route: trang chủ, projects, my-tasks, messages,
                  # reports, users, audit-logs, settings, login, tasks
  components/
    layout/       # AppShell, AppSidebar, AppHeader, BottomNav, CommandPalette
    providers/    # AppProvider (cổng đăng nhập, theme, toast)
    projects/     # Component theo tính năng dự án
    tasks/        # Component theo tính năng nhiệm vụ
    ui/           # Component giao diện dùng chung
  lib/
    store.ts      # Zustand store: state toàn cục + persist localStorage
    mock-data.ts  # Dữ liệu mẫu ban đầu
    types.ts      # Kiểu dữ liệu dùng chung
    utils.ts      # Hàm tiện ích
    supabase.ts   # Chuẩn bị cho đợt nối Supabase thật (chưa dùng)
supabase/
  schema.sql      # Schema chuẩn bị cho đợt nối Supabase thật
```
