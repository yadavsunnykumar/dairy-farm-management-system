// Self-contained Bikram Sambat ↔ Gregorian converter
// Algorithm and data sourced from bikram-sambat (MIT licence).
// Inlined here to guarantee browser compatibility without CJS/ESM interop.

const BS_YEAR_ZERO = 1970;
const BS_EPOCH_TS = -1789990200000; // 1913-04-13 in IST (hardcoded, never recomputed)
const MS_PER_DAY = 86400000;

// Encoded days-per-month for BS years 1970–2090+.
// Each 32-bit int stores 12 months × 2 bits. value = 29 + (bits & 3).
const MONTH_DATA = [
  5315258,5314490,9459438,8673005,5315258,5315066,9459438,8673005,5315258,5314298,
  9459438,5327594,5315258,5314298,9459438,5327594,5315258,5314286,9459438,5315306,
  5315258,5314286,8673006,5315306,5315258,5265134,8673006,5315258,5315258,9459438,
  8673005,5315258,5314298,9459438,8673005,5315258,5314298,9459438,8473322,5315258,
  5314298,9459438,5327594,5315258,5314298,9459438,5327594,5315258,5314286,8673006,
  5315306,5315258,5265134,8673006,5315306,5315258,9459438,8673005,5315258,5314490,
  9459438,8673005,5315258,5314298,9459438,8473325,5315258,5314298,9459438,5327594,
  5315258,5314298,9459438,5327594,5315258,5314286,9459438,5315306,5315258,5265134,
  8673006,5315306,5315258,5265134,8673006,5315258,5314490,9459438,8673005,5315258,
  5314298,9459438,8669933,5315258,5314298,9459438,8473322,5315258,5314298,9459438,
  5327594,5315258,5314286,9459438,5315306,5315258,5265134,8673006,5315306,5315258,
  5265134,8673006,5315258,5315258,5527226,5528046,5527277,5528250,5528057,5527277,
  5527277,
];

export const BS_MONTHS = [
  "Baisakh","Jestha","Ashadh","Shrawan","Bhadra","Ashwin",
  "Kartik","Mangsir","Poush","Magh","Falgun","Chaitra",
];

function daysInMonthRaw(year, month) {
  const delta = MONTH_DATA[year - BS_YEAR_ZERO];
  if (delta === undefined) throw new Error(`No BS data for year ${year}`);
  return 29 + ((delta >>> ((month - 1) * 2)) & 3);
}

function adStrToBS(isoDateStr) {
  let days = Math.floor((Date.parse(isoDateStr) - BS_EPOCH_TS) / MS_PER_DAY) + 1;
  if (days <= 0) throw new Error(`Date out of supported range: ${isoDateStr}`);
  let year = BS_YEAR_ZERO;
  while (days > 0) {
    for (let m = 1; m <= 12; m++) {
      const dM = daysInMonthRaw(year, m);
      if (days <= dM) return { year, month: m, day: days };
      days -= dM;
    }
    year++;
  }
  throw new Error(`Conversion failed for ${isoDateStr}`);
}

function bsToGreg(bsYear, bsMonth, bsDay) {
  let timestamp = BS_EPOCH_TS + MS_PER_DAY * bsDay;
  let month = bsMonth - 1;
  let year = bsYear;
  while (year >= BS_YEAR_ZERO) {
    while (month > 0) {
      timestamp += MS_PER_DAY * daysInMonthRaw(year, month);
      month--;
    }
    month = 12;
    year--;
  }
  const d = new Date(timestamp);
  return { year: d.getUTCFullYear(), month: 1 + d.getUTCMonth(), day: d.getUTCDate() };
}

// Public API

export function todayBS() {
  const iso = new Date().toISOString().split("T")[0];
  return adStrToBS(iso);
}

export function adToBS(date) {
  const d = date instanceof Date ? date : new Date(date);
  const iso = d.toISOString().split("T")[0];
  const bs = adStrToBS(iso);
  return { ...bs, monthName: BS_MONTHS[bs.month - 1] };
}

export function bsToAD(year, month, day) {
  const g = bsToGreg(year, month, day);
  return new Date(Date.UTC(g.year, g.month - 1, g.day));
}

export function daysInBSMonth(year, month) {
  return daysInMonthRaw(year, month);
}

export function formatBSDate(date) {
  if (!date) return "—";
  try {
    const bs = adToBS(date);
    const day = String(bs.day).padStart(2, "0");
    return `${bs.year} ${bs.monthName} ${day}`;
  } catch {
    return "—";
  }
}

export const BS_YEAR_MIN = 2070;
export const BS_YEAR_MAX = 2092;
