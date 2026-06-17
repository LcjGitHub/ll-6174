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

/**
 * @typedef {Object} EmergencyContact
 * @property {number} id
 * @property {string} name
 * @property {string} relationship
 * @property {string} phone
 * @property {boolean} is_primary
 * @property {string|null} note
 * @property {string} created_at
 */

/** @returns {Promise<EmergencyContact[]>} */
export async function fetchContacts() {
  const { data } = await api.get('/contacts');
  return data;
}

/**
 * @param {{ name: string, relationship: string, phone: string, is_primary?: boolean, note?: string }} payload
 * @returns {Promise<EmergencyContact>}
 */
export async function createContact(payload) {
  const { data } = await api.post('/contacts', payload);
  return data;
}

/**
 * @param {number} contactId
 * @param {{ name?: string, relationship?: string, phone?: string, is_primary?: boolean, note?: string }} payload
 * @returns {Promise<EmergencyContact>}
 */
export async function updateContact(contactId, payload) {
  const { data } = await api.put(`/contacts/${contactId}`, payload);
  return data;
}

/**
 * @param {number} contactId
 * @returns {Promise<void>}
 */
export async function deleteContact(contactId) {
  await api.delete(`/contacts/${contactId}`);
}

/**
 * @typedef {Object} EmergencyDrill
 * @property {number} id
 * @property {string} title
 * @property {string} drill_date
 * @property {number} participant_count
 * @property {string} location
 * @property {string|null} summary
 * @property {string} created_at
 */

/** @returns {Promise<EmergencyDrill[]>} */
export async function fetchDrills() {
  const { data } = await api.get('/drills');
  return data;
}

/**
 * @param {{ title: string, drill_date: string, participant_count: number, location: string, summary?: string }} payload
 * @returns {Promise<EmergencyDrill>}
 */
export async function createDrill(payload) {
  const { data } = await api.post('/drills', payload);
  return data;
}

/**
 * @typedef {Object} StorageLocation
 * @property {number} id
 * @property {string} name
 * @property {string} room
 * @property {string} capacity_desc
 * @property {number} current_count
 * @property {string} created_at
 */

/** @returns {Promise<StorageLocation[]>} */
export async function fetchLocations() {
  const { data } = await api.get('/locations');
  return data;
}

/**
 * @param {number} locationId
 * @returns {Promise<StorageLocation>}
 */
export async function fetchLocation(locationId) {
  const { data } = await api.get(`/locations/${locationId}`);
  return data;
}

/**
 * @param {{ name: string, room: string, capacity_desc?: string, current_count?: number }} payload
 * @returns {Promise<StorageLocation>}
 */
export async function createLocation(payload) {
  const { data } = await api.post('/locations', payload);
  return data;
}

/**
 * @param {number} locationId
 * @param {{ name?: string, room?: string, capacity_desc?: string, current_count?: number }} payload
 * @returns {Promise<StorageLocation>}
 */
export async function updateLocation(locationId, payload) {
  const { data } = await api.put(`/locations/${locationId}`, payload);
  return data;
}

/**
 * @param {number} locationId
 * @returns {Promise<void>}
 */
export async function deleteLocation(locationId) {
  await api.delete(`/locations/${locationId}`);
}

export default api;
