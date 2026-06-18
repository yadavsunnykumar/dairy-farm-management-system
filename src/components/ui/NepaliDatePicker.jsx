"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  BS_MONTHS,
  BS_YEAR_MIN,
  BS_YEAR_MAX,
  adToBS,
  bsToAD,
  daysInBSMonth,
  todayBS,
} from "@/lib/nepali-date";

const YEARS = Array.from({ length: BS_YEAR_MAX - BS_YEAR_MIN + 1 }, (_, i) => BS_YEAR_MIN + i);

// Compute initial BS date from an AD value, or fall back to today
function resolveInitialBS(value) {
  if (value) {
    try {
      const d = value instanceof Date ? value : new Date(value);
      return adToBS(d);
    } catch {}
  }
  return todayBS();
}

export function NepaliDatePicker({ value, onChange, disabled }) {
  // Lazy initializers run synchronously at mount — no empty-state flash
  const [bsYear, setBsYear] = useState(() => resolveInitialBS(value).year);
  const [bsMonth, setBsMonth] = useState(() => resolveInitialBS(value).month);
  const [bsDay, setBsDay] = useState(() => resolveInitialBS(value).day);

  const maxDay = useMemo(() => {
    if (!bsYear || !bsMonth) return 32;
    try { return daysInBSMonth(bsYear, bsMonth); } catch { return 32; }
  }, [bsYear, bsMonth]);

  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function emit(year, month, day) {
    if (!year || !month || !day) return;
    const safeDay = Math.min(day, maxDay);
    try {
      onChange(bsToAD(year, month, safeDay));
    } catch {}
  }

  function handleYear(val) {
    const y = parseInt(val, 10);
    setBsYear(y);
    emit(y, bsMonth, bsDay);
  }

  function handleMonth(val) {
    const m = parseInt(val, 10);
    setBsMonth(m);
    emit(bsYear, m, bsDay);
  }

  function handleDay(val) {
    const d = parseInt(val, 10);
    setBsDay(d);
    emit(bsYear, bsMonth, d);
  }

  return (
    <div className="flex gap-2">
      <Select value={bsYear?.toString() ?? ""} onValueChange={handleYear} disabled={disabled}>
        <SelectTrigger className="w-[90px]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={bsMonth?.toString() ?? ""} onValueChange={handleMonth} disabled={disabled}>
        <SelectTrigger className="w-[110px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {BS_MONTHS.map((name, i) => (
            <SelectItem key={i + 1} value={(i + 1).toString()}>{name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={bsDay?.toString() ?? ""} onValueChange={handleDay} disabled={disabled}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((d) => (
            <SelectItem key={d} value={d.toString()}>{String(d).padStart(2, "0")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
