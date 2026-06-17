import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * @typedef {Object} EmergencyItem
 * @property {number} id
 * @property {string} name
 * @property {number} quantity
 * @property {string|null} expiry_date
 * @property {string|null} last_check_date
 * @property {string|null} next_check_date
 * @property {string} created_at
 * @property {('expired'|'check_due')[]} status_tags
 */

/**
 * @typedef {Object} CheckRecord
 * @property {number} id
 * @property {number} item_id
 * @property {string} check_date
 * @property {string|null} note
 * @property {string|null} next_check_date
 * @property {string} created_at
 */

/** @returns {Promise<EmergencyItem[]>} */
export async function fetchItems() {
  const { data } = await api.get('/items');
  return data;
}

/**
 * @param {number} itemId
 * @returns {Promise<CheckRecord[]>}
 */
export async function fetchChecks(itemId) {
  const { data } = await api.get(`/items/${itemId}/checks`);
  return data;
}

/**
 * @param {number} itemId
 * @param {{ check_date: string, note?: string, next_check_date?: string }} payload
 * @returns {Promise<CheckRecord>}
 */
export async function createCheck(itemId, payload) {
  const { data } = await api.post(`/items/${itemId}/checks`, payload);
  return data;
}

export default api;
