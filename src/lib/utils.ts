import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateVN(dateString: string | Date | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTimeVN(dateString: string | Date | undefined): string {
  if (!dateString) return "—";
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return "—";
  
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function getRelativeDueLabel(dueDateStr: string, isCompleted: boolean = false): {
  label: string;
  isOverdue: boolean;
  isNearDue: boolean;
} {
  if (!dueDateStr) return { label: "Không có hạn", isOverdue: false, isNearDue: false };
  if (isCompleted) return { label: "Đã hoàn thành", isOverdue: false, isNearDue: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Trễ ${Math.abs(diffDays)} ngày`,
      isOverdue: true,
      isNearDue: false,
    };
  } else if (diffDays === 0) {
    return {
      label: "Hôm nay là hạn chót",
      isOverdue: false,
      isNearDue: true,
    };
  } else if (diffDays <= 3) {
    return {
      label: `Còn ${diffDays} ngày`,
      isOverdue: false,
      isNearDue: true,
    };
  } else {
    return {
      label: `Còn ${diffDays} ngày`,
      isOverdue: false,
      isNearDue: false,
    };
  }
}

export function formatCurrencyVN(amount: number | undefined): string {
  if (amount === undefined || isNaN(amount)) return "0 VNĐ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

