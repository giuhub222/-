const regions = require("../../utils/regions");
const { defaultCity } = require("../../utils/config");
const { getStoredCity, setStoredCity } = require("../../utils/storage");

const cityCache = {};

function getCities(provinceIndex) {
  const province = regions[provinceIndex] || regions[0];
  if (!province || !province.children) return [];
  if (cityCache[province.code]) return cityCache[province.code];

  const cityMap = {};
  const cities = [];
  province.children.forEach(city => {
    if (!cityMap[city.name]) {
      cityMap[city.name] = {
        code: city.code,
        name: city.name,
        children: []
      };
      cities.push(cityMap[city.name]);
    }
    cityMap[city.name].children = cityMap[city.name].children.concat(city.children || []);
  });
  cityCache[province.code] = cities;
  return cities;
}

function getCounties(provinceIndex, cityIndex) {
  const city = getCities(provinceIndex)[cityIndex] || getCities(provinceIndex)[0];
  return city && city.children ? city.children : [];
}

function normalizeValue(provinceIndex, cityIndex, countyIndex) {
  const safeProvince = Math.max(0, Math.min(provinceIndex, regions.length - 1));
  const cities = getCities(safeProvince);
  const safeCity = Math.max(0, Math.min(cityIndex, cities.length - 1));
  const counties = getCounties(safeProvince, safeCity);
  const safeCounty = Math.max(0, Math.min(countyIndex, counties.length - 1));
  return [safeProvince, safeCity, safeCounty];
}

function selectedRegion(value) {
  const [provinceIndex, cityIndex, countyIndex] = value;
  const province = regions[provinceIndex];
  const city = getCities(provinceIndex)[cityIndex];
  const county = getCounties(provinceIndex, cityIndex)[countyIndex];
  return { province, city, county };
}

function selectedText(value) {
  const { province, city, county } = selectedRegion(value);
  if (!province || !city || !county) return "请选择城市";
  if (province.name === city.name) {
    return `${province.name} · ${county.name}`;
  }
  return `${province.name} · ${city.name} · ${county.name}`;
}

function cityFromRegion(value) {
  const { province, city, county } = selectedRegion(value);
  return {
    id: county.code,
    gbCode: county.code,
    name: county.name,
    adm1: province.name,
    adm2: city.name,
    area: county.name,
    fullName: selectedText(value)
  };
}

function findIndexByName(items, name) {
  return items.findIndex(item => item.name === name || item.name.replace(/市$/, "") === name);
}

function findInitialValue(storedCity) {
  const code = String(storedCity.gbCode || storedCity.areaCode || storedCity.id || "");
  if (/^\d{6}$/.test(code)) {
    for (let p = 0; p < regions.length; p += 1) {
      const cities = getCities(p);
      for (let c = 0; c < cities.length; c += 1) {
        const counties = getCounties(p, c);
        const a = counties.findIndex(item => item.code === code);
        if (a >= 0) return [p, c, a];
      }
    }
  }

  const provinceName = storedCity.adm1 || "";
  const cityName = storedCity.adm2 || storedCity.name || "";
  const areaName = storedCity.area || storedCity.name || "";
  let provinceIndex = findIndexByName(regions, provinceName);
  if (provinceIndex < 0) provinceIndex = findIndexByName(regions, cityName);
  if (provinceIndex < 0) return [8, 0, 0];

  const cities = getCities(provinceIndex);
  let cityIndex = findIndexByName(cities, cityName);
  if (cityIndex < 0) cityIndex = 0;

  const counties = getCounties(provinceIndex, cityIndex);
  let countyIndex = findIndexByName(counties, areaName);
  if (countyIndex < 0) countyIndex = 0;
  return [provinceIndex, cityIndex, countyIndex];
}

function anchorFor(type, item) {
  return item && item.code ? `${type}-${item.code}` : "";
}

function selectorData(regionValue) {
  const [provinceIndex, cityIndex, countyIndex] = regionValue;
  const provinceList = regions;
  const cityList = getCities(provinceIndex);
  const countyList = getCounties(provinceIndex, cityIndex);
  return {
    provinceList,
    cityList,
    countyList,
    provinceAnchor: anchorFor("province", provinceList[provinceIndex]),
    cityAnchor: anchorFor("city", cityList[cityIndex]),
    countyAnchor: anchorFor("county", countyList[countyIndex]),
    selectedRegionText: selectedText(regionValue)
  };
}

Page({
  data: {
    selectedCity: defaultCity,
    regionValue: [0, 0, 0],
    selectedRegionText: "",
    selectorOpen: false,
    provinceList: [],
    cityList: [],
    countyList: [],
    provinceAnchor: "",
    cityAnchor: "",
    countyAnchor: ""
  },

  onLoad() {
    const selectedCity = getStoredCity(defaultCity);
    const regionValue = normalizeValue(...findInitialValue(selectedCity));
    this.setData({
      selectedCity,
      regionValue,
      ...selectorData(regionValue)
    });
  },

  toggleSelector() {
    this.setData({ selectorOpen: !this.data.selectorOpen });
  },

  handleProvinceTap(event) {
    const provinceIndex = Number(event.currentTarget.dataset.index);
    const regionValue = normalizeValue(provinceIndex, 0, 0);
    this.setData({
      regionValue,
      ...selectorData(regionValue)
    });
  },

  handleCityTap(event) {
    const cityIndex = Number(event.currentTarget.dataset.index);
    const regionValue = normalizeValue(this.data.regionValue[0], cityIndex, 0);
    this.setData({
      regionValue,
      ...selectorData(regionValue)
    });
  },

  handleCountyTap(event) {
    const countyIndex = Number(event.currentTarget.dataset.index);
    const regionValue = normalizeValue(this.data.regionValue[0], this.data.regionValue[1], countyIndex);
    const city = cityFromRegion(regionValue);
    setStoredCity(city);
    this.setData({
      selectedCity: city,
      regionValue,
      selectorOpen: false,
      ...selectorData(regionValue)
    });
    wx.showToast({ title: "已切换城市", icon: "success" });
    setTimeout(() => this.returnToIndex(), 350);
  },

  returnToIndex() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goIndex() {
    this.returnToIndex();
  },

  goRecord() {
    wx.redirectTo({ url: "/pages/record/record" });
  }
});
