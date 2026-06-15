const CITY_KEY = "wash_city";
const RECORDS_KEY = "wash_records";

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

function recordWashToday() {
  const today = todayString();
  const records = getWashRecords();
  if (!records.find(item => item.date === today)) {
    records.unshift({ date: today, source: "manual" });
    saveWashRecords(records.slice(0, 30));
  }
  return getWashRecords();
}

function clearWashRecords() {
  wx.removeStorageSync(RECORDS_KEY);
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
  recordWashToday,
  clearWashRecords,
  daysSince,
  todayString
};
