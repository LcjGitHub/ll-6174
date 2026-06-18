import dayjs from 'dayjs';

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|Date|null} value - 原始日期值
 * @returns {string} 格式化后的日期字符串，空值返回 '—'
 */
export function formatDate(value) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '—';
}
