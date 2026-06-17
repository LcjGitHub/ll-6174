import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

/**
 * @typedef {Object} Medicine
 * @property {number} id
 * @property {string} name
 * @property {string} specification
 * @property {number} quantity
 * @property {string|null} expiry_date
 * @property {string|null} last_check_date
 * @property {string|null} next_check_date
 * @property {string} created_at
 * @property {('expired'|'check_due')[]} status_tags
 */

/**
 * @typedef {Object} InventoryRecord
 * @property {number} id
 * @property {number} medicine_id
 * @property {string} check_date
 * @property {number|null} quantity_checked
 * @property {string|null} note
 * @property {string|null} next_check_date
 * @property {string} created_at
 */

/** @returns {Promise<Medicine[]>} */
export async function fetchMedicines() {
  const { data } = await api.get('/medicines');
  return data;
}

/**
 * @param {number} medicineId
 * @returns {Promise<InventoryRecord[]>}
 */
export async function fetchRecords(medicineId) {
  const { data } = await api.get(`/medicines/${medicineId}/records`);
  return data;
}

/**
 * @param {number} medicineId
 * @param {{ check_date: string, quantity_checked?: number, note?: string, next_check_date?: string }} payload
 * @returns {Promise<InventoryRecord>}
 */
export async function createRecord(medicineId, payload) {
  const { data } = await api.post(`/medicines/${medicineId}/records`, payload);
  return data;
}

export default api;
