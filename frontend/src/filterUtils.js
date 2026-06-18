export const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'normal', label: '正常' },
  { value: 'check_due', label: '待检查' },
  { value: 'expired', label: '过期' },
];

export function filterByStatus(items, status) {
  if (!status || status === 'all') {
    return items;
  }
  if (status === 'normal') {
    return items.filter((item) => !item.status_tags || item.status_tags.length === 0);
  }
  return items.filter((item) => item.status_tags && item.status_tags.includes(status));
}

export function filterByName(items, keyword) {
  if (!keyword || keyword.trim() === '') {
    return items;
  }
  const lowerKeyword = keyword.trim().toLowerCase();
  return items.filter((item) => item.name && item.name.toLowerCase().includes(lowerKeyword));
}

export function filterItems(items, { status, keyword }) {
  let result = items;
  result = filterByStatus(result, status);
  result = filterByName(result, keyword);
  return result;
}

export function getStatusCounts(items) {
  const counts = {
    total: items.length,
    normal: 0,
    check_due: 0,
    expired: 0,
  };
  items.forEach((item) => {
    const tags = item.status_tags || [];
    if (tags.length === 0) {
      counts.normal += 1;
    } else {
      if (tags.includes('expired')) {
        counts.expired += 1;
      }
      if (tags.includes('check_due')) {
        counts.check_due += 1;
      }
    }
  });
  return counts;
}
