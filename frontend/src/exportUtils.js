import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|Date|null} value - 原始日期值
 * @returns {string} 格式化后的日期字符串，空值返回 '—'
 */
function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}

/**
 * 将状态标签数组转换为中文描述文本
 * @param {string[]} tags - 状态标签数组，可能包含 'expired'、'check_due'
 * @returns {string} 中文状态文本，过期标注为「已过期」、待检查标注为「待检查」，多状态用「、」连接，无状态返回「正常」
 */
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

/**
 * 转义逗号分隔文本字段，处理包含逗号、引号、换行符的内容
 * @param {*} value - 原始字段值
 * @returns {string} 转义后的字段值，特殊字符用双引号包裹并转义内部双引号
 */
function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 将应急包物品列表组装为逗号分隔的文本内容
 * @param {Array<Object>} items - 物品数组，每项包含 name、quantity、expiry_date、last_check_date、next_check_date、status_tags
 * @returns {string} 组装完成的逗号分隔文本，首行为表头：名称,数量,保质期,上次检查日,下次检查日,状态
 */
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

/**
 * 触发浏览器下载文本文件
 * @param {string} content - 文件文本内容
 * @param {string} filename - 下载文件名（含后缀）
 */
export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出应急包清单为逗号分隔的纯文本文件并触发下载
 * @param {Array<Object>} items - 待导出的物品列表
 * @returns {boolean} 导出成功返回 true，无数据时返回 false
 */
export function exportInventoryList(items) {
  if (!items || items.length === 0) {
    return false;
  }
  const csvContent = buildInventoryCSV(items);
  const today = dayjs().format('YYYY-MM-DD');
  const filename = `应急包清单_${today}.txt`;
  downloadCSV(csvContent, filename);
  return true;
}
