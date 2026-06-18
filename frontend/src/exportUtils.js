import dayjs from 'dayjs';

function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

function formatStatus(tags = []) {
  if (!tags.length) {
    return '正常';
  }
  const statuses = [];
  if (tags.includes('expired')) {
    statuses.push('已过期');
  }
  if (tags.includes('check_due')) {
    statuses.push('待检查');
  }
  return statuses.join('、') || '正常';
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildInventoryCSV(items) {
  const headers = ['名称', '数量', '保质期', '上次检查日', '下次检查日', '状态'];
  const rows = items.map((item) => [
    item.name || '',
    item.quantity ?? '',
    formatDate(item.expiry_date),
    formatDate(item.last_check_date),
    formatDate(item.next_check_date),
    formatStatus(item.status_tags),
  ]);
  const allRows = [headers, ...rows];
  return allRows.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
}

export function downloadCSV(content, filename) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInventoryList(items) {
  const csvContent = buildInventoryCSV(items);
  const today = dayjs().format('YYYY-MM-DD');
  const filename = `应急包清单_${today}.csv`;
  downloadCSV(csvContent, filename);
}
