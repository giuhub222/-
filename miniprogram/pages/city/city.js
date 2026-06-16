const regions = require("../../utils/regions");
const { defaultCity } = require("../../utils/config");
const { searchCity } = require("../../utils/api");
const { getStoredCity, setStoredCity } = require("../../utils/storage");

const cityCache = {};
let searchPresetCache = null;

function comparableName(name) {
  return String(name || "")
    .trim()
    .replace(/(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市|区|县)$/g, "");
}

function isSameName(left, right) {
  const leftText = String(left || "").trim();
  const rightText = String(right || "").trim();
  if (!leftText || !rightText) return false;
  return leftText === rightText || comparableName(leftText) === comparableName(rightText);
}

function uniqueRegionParts(parts) {
  return parts.filter(Boolean).reduce((result, part) => {
    if (!result.some(item => isSameName(item, part))) {
      result.push(part);
    }
    return result;
  }, []);
}

function formatCityLabel(city) {
  const parts = uniqueRegionParts([city.adm1, city.adm2, city.area || city.name]);
  return parts.length ? parts.join(" · ") : city.name || "请选择城市";
}

function formatSearchMeta(city) {
  const parts = uniqueRegionParts([city.adm1, city.adm2]);
  return parts.length ? parts.join(" · ") : city.fullName || "中国";
}

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
  return items.findIndex(item => isSameName(item.name, name));
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

function cityLevelPreset(province, city) {
  const cityData = {
    id: city.code,
    gbCode: city.code,
    name: city.name,
    adm1: province.name,
    adm2: city.name,
    area: city.name
  };
  return {
    ...cityData,
    fullName: formatCityLabel(cityData)
  };
}

function countyLevelPreset(province, city, county) {
  const cityData = {
    id: county.code,
    gbCode: county.code,
    name: county.name,
    adm1: province.name,
    adm2: city.name,
    area: county.name
  };
  return {
    ...cityData,
    fullName: formatCityLabel(cityData)
  };
}

function getSearchPresets() {
  if (searchPresetCache) return searchPresetCache;
  searchPresetCache = [];
  regions.forEach((province, provinceIndex) => {
    getCities(provinceIndex).forEach(city => {
      searchPresetCache.push(cityLevelPreset(province, city));
      (city.children || []).forEach(county => {
        searchPresetCache.push(countyLevelPreset(province, city, county));
      });
    });
  });
  return searchPresetCache;
}

function normalizeSearchResult(item) {
  const id = String(item.id || item.weatherId || item.gbCode || item.areaCode || "");
  const city = {
    id,
    gbCode: item.gbCode || item.areaCode || (/^\d{6}$/.test(id) ? id : ""),
    weatherId: item.weatherId || (/^\d{9}$/.test(id) ? id : ""),
    name: item.name || item.area || item.adm2 || item.adm1 || "",
    adm1: item.adm1 || item.province || "",
    adm2: item.adm2 || item.city || "",
    area: item.area || item.name || "",
    fullName: item.fullName || ""
  };
  city.fullName = city.fullName || formatCityLabel(city);
  city.displayName = city.name || city.fullName;
  city.metaText = formatSearchMeta(city);
  return city;
}

Page({
  data: {
    selectedCity: defaultCity,
    currentCityText: formatCityLabel(defaultCity),
    regionValue: [0, 0, 0],
    selectedRegionText: "",
    selectorOpen: false,
    provinceList: [],
    cityList: [],
    countyList: [],
    provinceAnchor: "",
    cityAnchor: "",
    countyAnchor: "",
    searchKeyword: "",
    hasSearchKeyword: false,
    searchFocused: false,
    searchTouched: false,
    searchLoading: false,
    searchError: "",
    searchResults: []
  },

  onLoad() {
    const selectedCity = getStoredCity(defaultCity);
    const regionValue = normalizeValue(...findInitialValue(selectedCity));
    this.setData({
      selectedCity,
      currentCityText: selectedCity.fullName || formatCityLabel(selectedCity),
      regionValue,
      ...selectorData(regionValue)
    });
  },

  onUnload() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchToken = (this.searchToken || 0) + 1;
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
      currentCityText: city.fullName || selectedText(regionValue),
      regionValue,
      selectorOpen: false,
      searchKeyword: "",
      hasSearchKeyword: false,
      searchTouched: false,
      searchLoading: false,
      searchError: "",
      searchResults: [],
      ...selectorData(regionValue)
    });
    wx.showToast({ title: "已切换城市", icon: "success" });
    setTimeout(() => this.returnToIndex(), 350);
  },

  handleSearchFocus() {
    this.setData({ searchFocused: true });
  },

  handleSearchBlur() {
    this.setData({ searchFocused: false });
  },

  handleSearchInput(event) {
    const keyword = event.detail.value || "";
    const hasSearchKeyword = Boolean(String(keyword).trim());
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchToken = (this.searchToken || 0) + 1;

    this.setData({
      searchKeyword: keyword,
      hasSearchKeyword,
      searchTouched: hasSearchKeyword,
      searchLoading: hasSearchKeyword,
      searchError: "",
      searchResults: []
    });

    if (!hasSearchKeyword) {
      this.setData({
        searchLoading: false,
        searchError: ""
      });
      return;
    }

    this.searchTimer = setTimeout(() => {
      this.runCitySearch(keyword);
    }, 300);
  },

  handleSearchConfirm() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.runCitySearch(this.data.searchKeyword);
  },

  retrySearch() {
    this.runCitySearch(this.data.searchKeyword);
  },

  clearSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchToken = (this.searchToken || 0) + 1;
    this.setData({
      searchKeyword: "",
      hasSearchKeyword: false,
      searchTouched: false,
      searchLoading: false,
      searchError: "",
      searchResults: []
    });
  },

  async runCitySearch(keyword) {
    const text = String(keyword || "").trim();
    if (!text) {
      this.clearSearch();
      return;
    }

    const token = (this.searchToken || 0) + 1;
    this.searchToken = token;
    this.setData({
      searchTouched: true,
      searchLoading: true,
      searchError: "",
      searchResults: []
    });

    try {
      const results = await searchCity(text, getSearchPresets());
      if (this.searchToken !== token) return;
      this.setData({
        searchLoading: false,
        searchResults: (results || []).slice(0, 20).map(normalizeSearchResult)
      });
    } catch (error) {
      if (this.searchToken !== token) return;
      this.setData({
        searchLoading: false,
        searchError: error.message || "城市搜索失败，请稍后重试",
        searchResults: []
      });
    }
  },

  handleSearchResultTap(event) {
    const index = Number(event.currentTarget.dataset.index);
    const city = normalizeSearchResult(this.data.searchResults[index] || {});
    if (!city.name && !city.adm2 && !city.adm1) return;

    const regionValue = normalizeValue(...findInitialValue(city));
    setStoredCity(city);
    this.setData({
      selectedCity: city,
      currentCityText: city.fullName || formatCityLabel(city),
      regionValue,
      selectorOpen: false,
      searchKeyword: city.displayName || city.name,
      hasSearchKeyword: Boolean(city.displayName || city.name),
      searchTouched: false,
      searchLoading: false,
      searchError: "",
      searchResults: [],
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
