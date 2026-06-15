const cloud = require("wx-server-sdk");
const https = require("https");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const GEO_HOST = process.env.QWEATHER_API_HOST || process.env.QWEATHER_GEO_HOST || process.env.QWEATHER_HOST || "";

function normalizeHost(host) {
  return String(host || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function requestJSON(url, key) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "X-QW-Api-Key": key } }, res => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", chunk => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(new Error("城市服务返回格式异常"));
          }
        });
      })
      .on("error", reject);
  });
}

exports.main = async event => {
  const key = process.env.QWEATHER_API_KEY || process.env.QWEATHER_KEY || "";
  const keyword = String(event.keyword || "").trim();

  if (!key || !GEO_HOST) {
    return {
      success: false,
      code: "MISSING_QWEATHER_CONFIG",
      message: "云函数未配置和风天气 API Host"
    };
  }

  if (!keyword) {
    return {
      success: true,
      data: []
    };
  }

  const url = `https://${normalizeHost(GEO_HOST)}/geo/v2/city/lookup?location=${encodeURIComponent(keyword)}&range=cn&number=10`;
  const response = await requestJSON(url, key);

  if (response.code !== "200") {
    return {
      success: false,
      code: response.code || "QWEATHER_ERROR",
      message: "城市搜索失败"
    };
  }

  return {
    success: true,
    data: (response.location || []).map(item => ({
      id: item.id,
      name: item.name,
      adm1: item.adm1,
      adm2: item.adm2
    }))
  };
};
