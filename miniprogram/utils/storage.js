const CITY_KEY = "wash_city";
const RECORDS_KEY = "wash_records";
const USER_KEY = "wash_user";

function getStoredCity(defaultCity) {
  return wx.getStorageSync(CITY_KEY) || defaultCity;
}

function setStoredCity(city) {
  wx.setStorageSync(CITY_KEY, city);
}

function getWashRecords() {
  return wx.getStorageSync(RECORDS_KEY) || [];
}

function saveWashRecords(records) {
  wx.setStorageSync(RECORDS_KEY, records);
}

function todayString(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeString(date = new Date()) {
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function normalizeWashRecord(record = {}) {
  const now = new Date();
  const date = record.date || todayString(now);
  const time = record.time || timeString(now);
  const createdAt = record.createdAt || now.toISOString();
  return {
    id: record.id || `wash_${date.replace(/-/g, "")}_${time.replace(":", "")}_${now.getTime()}`,
    date,
    time,
    source: record.source || "manual",
    location: String(record.location || "").trim(),
    cost: String(record.cost || "").trim(),
    washType: String(record.washType || "").trim(),
    paymentMethod: String(record.paymentMethod || "").trim(),
    note: String(record.note || "").trim(),
    createdAt
  };
}

function recordSortValue(record) {
  return new Date(`${record.date || "1970-01-01"}T${record.time || "00:00"}:00`).getTime();
}

function addWashRecord(record) {
  const records = [normalizeWashRecord(record)]
    .concat(getWashRecords())
    .sort((left, right) => recordSortValue(right) - recordSortValue(left));
  saveWashRecords(records.slice(0, 50));
  return getWashRecords();
}

function recordWashToday() {
  return addWashRecord({ source: "manual" });
}

function clearWashRecords() {
  wx.removeStorageSync(RECORDS_KEY);
}

function getStoredUser() {
  return wx.getStorageSync(USER_KEY) || null;
}

function setStoredUser(user) {
  wx.setStorageSync(USER_KEY, user);
}

function clearStoredUser() {
  wx.removeStorageSync(USER_KEY);
}

function daysSince(dateString) {
  if (!dateString) return null;
  const start = new Date(`${dateString}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

module.exports = {
  getStoredCity,
  setStoredCity,
  getWashRecords,
  addWashRecord,
  recordWashToday,
  clearWashRecords,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  daysSince,
  todayString,
  timeString
};
