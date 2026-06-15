const { isCloudConfigured, qweatherApiKey, isQWeatherConfigured } = require("./config");
const { getDemoAdvice } = require("./demo");
const { getQWeatherAdvice } = require("./qweather");

function callCloud(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => resolve(res.result),
      fail: reject
    });
  });
}

async function getWashAdvice(city) {
  if (!isCloudConfigured()) {
    if (isQWeatherConfigured()) {
      return {
        demo: false,
        data: await getQWeatherAdvice(city)
      };
    }

    if (qweatherApiKey && qweatherApiKey !== "YOUR_QWEATHER_API_KEY") {
      throw new Error("请先配置和风天气 API Host");
    }

    return {
      demo: true,
      data: getDemoAdvice(city)
    };
  }

  const result = await callCloud("getWashAdvice", { cityId: city.id, city });
  if (!result || result.success === false) {
    throw new Error((result && result.message) || "天气服务暂时不可用");
  }

  return {
    demo: false,
    data: result.data
  };
}

async function searchCity(keyword, presets) {
  const text = String(keyword || "").trim();
  if (!text) return presets;

  if (!isCloudConfigured()) {
    return presets.filter(city => {
      const haystack = `${city.name}${city.adm1}${city.adm2}`;
      return haystack.indexOf(text) >= 0;
    });
  }

  const result = await callCloud("searchCity", { keyword: text });
  if (!result || result.success === false) {
    throw new Error((result && result.message) || "城市搜索暂时不可用");
  }
  return result.data || [];
}

module.exports = {
  getWashAdvice,
  searchCity
};
