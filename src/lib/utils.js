import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatBSDate } from "./nepali-date";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

// Displays dates in Nepali BS calendar format (e.g. "2081 Kartik 07")
export function formatDate(date) {
  return formatBSDate(date);
}

export function formatLiters(qty) {
  return `${qty} L`;
}

export function generateMilkmanCode(branchCode, sequence) {
  return `${branchCode.toUpperCase()}-${String(sequence).padStart(3, "0")}`;
}
