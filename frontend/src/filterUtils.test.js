import { describe, it, expect } from 'vitest';
import {
  filterByStatus,
  filterByName,
  filterItems,
  getStatusCounts,
  STATUS_OPTIONS,
} from './filterUtils';

const mockItems = [
  { id: 1, name: '布洛芬缓释胶囊', status_tags: [] },
  { id: 2, name: '阿莫西林胶囊', status_tags: ['expired'] },
  { id: 3, name: '感冒灵颗粒', status_tags: ['check_due'] },
  { id: 4, name: '碘伏消毒液', status_tags: ['expired', 'check_due'] },
  { id: 5, name: '创可贴', status_tags: [] },
  { id: 6, name: '健胃消食片', status_tags: ['check_due'] },
];

describe('STATUS_OPTIONS', () => {
  it('should have all four status options', () => {
    expect(STATUS_OPTIONS).toHaveLength(4);
    expect(STATUS_OPTIONS.map((o) => o.value)).toEqual([
      'all',
      'normal',
      'check_due',
      'expired',
    ]);
  });
});

describe('filterByStatus', () => {
  it('should return all items when status is all', () => {
    const result = filterByStatus(mockItems, 'all');
    expect(result).toHaveLength(mockItems.length);
  });

  it('should return all items when status is empty or undefined', () => {
    expect(filterByStatus(mockItems, '')).toHaveLength(mockItems.length);
    expect(filterByStatus(mockItems, undefined)).toHaveLength(mockItems.length);
    expect(filterByStatus(mockItems, null)).toHaveLength(mockItems.length);
  });

  it('should return only normal items when status is normal', () => {
    const result = filterByStatus(mockItems, 'normal');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(expect.arrayContaining([1, 5]));
  });

  it('should return only check_due items when status is check_due', () => {
    const result = filterByStatus(mockItems, 'check_due');
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(expect.arrayContaining([3, 4, 6]));
  });

  it('should return only expired items when status is expired', () => {
    const result = filterByStatus(mockItems, 'expired');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(expect.arrayContaining([2, 4]));
  });

  it('should handle items without status_tags property', () => {
    const items = [{ id: 1, name: '测试' }, { id: 2, name: '测试2', status_tags: ['expired'] }];
    const normalResult = filterByStatus(items, 'normal');
    expect(normalResult).toHaveLength(1);
    expect(normalResult[0].id).toBe(1);
  });
});

describe('filterByName', () => {
  it('should return all items when keyword is empty', () => {
    expect(filterByName(mockItems, '')).toHaveLength(mockItems.length);
    expect(filterByName(mockItems, '   ')).toHaveLength(mockItems.length);
    expect(filterByName(mockItems, undefined)).toHaveLength(mockItems.length);
    expect(filterByName(mockItems, null)).toHaveLength(mockItems.length);
  });

  it('should filter items by name with exact match', () => {
    const result = filterByName(mockItems, '布洛芬');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('布洛芬缓释胶囊');
  });

  it('should filter items by name with partial match', () => {
    const result = filterByName(mockItems, '胶囊');
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual(
      expect.arrayContaining(['布洛芬缓释胶囊', '阿莫西林胶囊'])
    );
  });

  it('should be case insensitive', () => {
    const items = [{ id: 1, name: 'Vitamin C' }, { id: 2, name: 'vitamin d' }];
    const result = filterByName(items, 'VITAMIN');
    expect(result).toHaveLength(2);
  });

  it('should handle items without name property', () => {
    const items = [{ id: 1 }, { id: 2, name: '测试' }];
    const result = filterByName(items, '测试');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('should return empty array when no matches', () => {
    const result = filterByName(mockItems, '不存在的药品');
    expect(result).toHaveLength(0);
  });
});

describe('filterItems', () => {
  it('should return all items with no filters', () => {
    const result = filterItems(mockItems, { status: 'all', keyword: '' });
    expect(result).toHaveLength(mockItems.length);
  });

  it('should filter by status only', () => {
    const result = filterItems(mockItems, { status: 'normal', keyword: '' });
    expect(result).toHaveLength(2);
  });

  it('should filter by keyword only', () => {
    const result = filterItems(mockItems, { status: 'all', keyword: '胶囊' });
    expect(result).toHaveLength(2);
  });

  it('should filter by both status and keyword - normal + name', () => {
    const result = filterItems(mockItems, { status: 'normal', keyword: '布' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('布洛芬缓释胶囊');
  });

  it('should filter by both status and keyword - check_due + name', () => {
    const result = filterItems(mockItems, { status: 'check_due', keyword: '感冒' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('感冒灵颗粒');
  });

  it('should filter by both status and keyword - expired + name', () => {
    const result = filterItems(mockItems, { status: 'expired', keyword: '阿莫' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('阿莫西林胶囊');
  });

  it('should return empty when combined filters match nothing', () => {
    const result = filterItems(mockItems, { status: 'normal', keyword: '阿莫' });
    expect(result).toHaveLength(0);
  });
});

describe('getStatusCounts', () => {
  it('should count all statuses correctly', () => {
    const counts = getStatusCounts(mockItems);
    expect(counts.total).toBe(6);
    expect(counts.normal).toBe(2);
    expect(counts.check_due).toBe(3);
    expect(counts.expired).toBe(2);
  });

  it('should handle empty array', () => {
    const counts = getStatusCounts([]);
    expect(counts.total).toBe(0);
    expect(counts.normal).toBe(0);
    expect(counts.check_due).toBe(0);
    expect(counts.expired).toBe(0);
  });

  it('should handle items without status_tags', () => {
    const items = [{ id: 1, name: '测试' }];
    const counts = getStatusCounts(items);
    expect(counts.normal).toBe(1);
    expect(counts.check_due).toBe(0);
    expect(counts.expired).toBe(0);
  });
});
