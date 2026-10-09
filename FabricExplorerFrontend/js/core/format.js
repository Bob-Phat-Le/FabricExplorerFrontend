// Định dạng hiển thị dùng chung (số, ngày giờ, "x phút trước", khoảng thời gian).
const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const EMPTY = '—';

function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatNumber(value) {
    return value === null || value === undefined ? EMPTY : Number(value).toLocaleString();
}

export function formatDateTime(value) {
    const d = toDate(value);
    return d ? dateTimeFormat.format(d) : EMPTY;
}

/** "Just now" / "5 min ago" / "3 hr ago" / "2 days ago"; quá 7 ngày thì hiện ngày giờ đầy đủ. */
export function timeAgo(value) {
    const d = toDate(value);
    if (!d) return EMPTY;
    const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (seconds < 45) return 'Just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return days <= 7 ? `${days} day${days === 1 ? '' : 's'} ago` : dateTimeFormat.format(d);
}

/** Số giây -> "18 sec" / "2 min" / "1.5 hr". */
export function formatSeconds(value) {
    if (value === null || value === undefined) return EMPTY;
    const s = Number(value);
    if (s < 60) return `${s} sec`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    return `${(s / 3600).toFixed(1).replace(/\.0$/, '')} hr`;
}
