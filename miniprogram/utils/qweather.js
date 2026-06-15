const { qweatherApiKey, qweatherApiHost } = require("./config");

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const WEATHER_ICON_BASE = "/assets/icons/weather";
const UI_ICON_BASE = "/assets/icons/ui";

function apiHost() {
  const host = String(qweatherApiHost || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}`;
}

function requestJSON(path, data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${apiHost()}${path}`,
      data,
      method: "GET",
      header: {
        "X-QW-Api-Key": qweatherApiKey
      },
      success: res => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
          resolve(res.data);
          return;
        }
        const detail = res.data && res.data.error && res.data.error.title;
        reject(new Error(detail || "天气服务请求失败"));
      },
      fail: reject
    });
  });
}

async function resolveWeatherLocationId(city) {
  if (city && city.weatherId) return city.weatherId;
  if (/^\d{9}$/.test(String(city && city.id))) return city.id;

  const location = (city && (city.area || city.name || city.gbCode || city.id)) || "";
  const admCandidates = [city && city.adm2, city && city.adm1, ""]
    .filter((item, index, arr) => item !== undefined && arr.indexOf(item) === index);

  for (const adm of admCandidates) {
    const data = {
      location,
      range: "cn",
      number: 1
    };
    if (adm) data.adm = adm;
    const response = await requestJSON("/geo/v2/city/lookup", data);
    if (response.code === "200" && response.location && response.location[0]) {
      return response.location[0].id;
    }
  }

  return city.id;
}

function hasRainText(text) {
  return /雨|雪|雷|雹|霾|沙尘|扬沙/.test(text || "");
}

function isRainy(day) {
  const precip = Number(day.precip || 0);
  const pop = Number(day.pop || 0);
  return hasRainText(`${day.textDay}${day.textNight}`) || precip >= 1 || pop >= 45;
}

function weatherClass(day) {
  if (isRainy(day)) return "rain";
  if (/云|阴/.test(`${day.textDay}${day.textNight}`)) return "cloudy";
  return "sunny";
}

function weatherIcon(day) {
  const text = `${day.textDay || ""}${day.textNight || ""}`;
  if (/雷/.test(text)) return `${WEATHER_ICON_BASE}/thunderstorms.svg`;
  if (/雪/.test(text)) return `${WEATHER_ICON_BASE}/snow.svg`;
  if (/雨/.test(text)) return `${WEATHER_ICON_BASE}/rain.svg`;
  if (/雾|霾|沙尘|扬沙|浮尘/.test(text)) return `${WEATHER_ICON_BASE}/fog.svg`;
  if (/阴/.test(text)) return `${WEATHER_ICON_BASE}/cloudy.svg`;
  if (/云/.test(text)) return `${WEATHER_ICON_BASE}/partly-cloudy-day.svg`;
  return `${WEATHER_ICON_BASE}/clear-day.svg`;
}

function dateLabel(date, index) {
  if (index === 0) return "今";
  const day = new Date(`${date}T00:00:00`);
  return WEEKDAYS[day.getDay()];
}

function dayName(date, index) {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  const day = new Date(`${date}T00:00:00`);
  return `周${WEEKDAYS[day.getDay()]}`;
}

function dateShort(date) {
  const day = new Date(`${date}T00:00:00`);
  return `${pad2(day.getMonth() + 1)}/${pad2(day.getDate())}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function monthDayText(date) {
  const day = new Date(`${date}T00:00:00`);
  return `${day.getMonth() + 1}月${day.getDate()}日`;
}

function formatUpdatedText(isoString) {
  const date = new Date(isoString);
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `更新于 ${month}-${day} ${hour}:${minute}`;
}

function tempRange(day) {
  const min = day.tempMin || "--";
  const max = day.tempMax || "--";
  return `${min}~${max}°C`;
}

function precipProbability(day) {
  const pop = day.pop === undefined || day.pop === "" ? 0 : Number(day.pop);
  return `${Number.isNaN(pop) ? 0 : pop}%`;
}

function windText(day) {
  const scale = day.windScaleDay || day.windScaleNight || "";
  const wind = day.windDirDay || day.windDirNight || "";
  if (!scale && !wind) return "微风";
  if (!wind || wind === "无持续风向") return scale ? `${scale}级` : "微风";
  return scale ? `${scale}级 ${wind}` : wind;
}

function compactWindText(text) {
  const match = String(text || "").match(/^([0-9-]+级)/);
  return match ? match[1] : text || "--";
}

function uvText(day) {
  const uv = Number(day.uvIndex || 0);
  if (uv <= 2) return "低";
  if (uv <= 5) return "中等";
  if (uv <= 7) return "较强";
  if (uv <= 10) return "强";
  return "很强";
}

function washLabel(level, score) {
  if (level === "best") return "非常适合";
  if (level === "avoid") return score < 45 ? "不适合" : "不太适合";
  return "适合";
}

function washFaceIcon(level) {
  return level === "avoid" ? `${UI_ICON_BASE}/face-frown-red.svg` : `${UI_ICON_BASE}/face-smile-green.svg`;
}

function displayDecision(level, decision) {
  if (level === "good") return "适合洗车";
  if (level === "caution") return "谨慎洗车";
  return decision;
}

function decisionIcon(level) {
  if (level === "bad") return `${UI_ICON_BASE}/face-frown-red.svg`;
  if (level === "caution") return `${UI_ICON_BASE}/face-meh-orange.svg`;
  return `${UI_ICON_BASE}/face-smile-green.svg`;
}

function metricRows(today) {
  return [
    { icon: `${UI_ICON_BASE}/droplet-blue.svg`, name: "降水概率", value: today ? today.precipProbability : "--" },
    { icon: `${UI_ICON_BASE}/thermometer-blue.svg`, name: "温度范围", value: today ? today.tempRange : "--" },
    { icon: `${UI_ICON_BASE}/wind-blue.svg`, name: "风力等级", value: today ? compactWindText(today.windText) : "--" },
    { icon: `${UI_ICON_BASE}/sun-blue.svg`, name: "紫外线强度", value: today ? today.uvText : "--" }
  ];
}

function scoreDay(day, index) {
  let score = 100;
  const pop = Number(day.pop || 0);
  const humidity = Number(day.humidity || 0);
  const windScale = Number(String(day.windScaleDay || "0").split("-").pop() || 0);

  if (isRainy(day)) score -= 55;
  if (pop >= 30) score -= 12;
  if (humidity >= 85) score -= 8;
  if (windScale >= 5) score -= 8;
  if (index === 0) score += 4;
  if (index > 4) score -= 6;

  return Math.max(0, Math.min(100, score));
}

function calculateAdvice(city, daily) {
  const normalized = daily.slice(0, 7).map((day, index) => {
    const score = scoreDay(day, index);
    const rainy = isRainy(day);
    const level = rainy ? "avoid" : score >= 78 ? "best" : "normal";
    return {
      score,
      rainy,
      isToday: index === 0,
      date: day.fxDate,
      dateLabel: dateLabel(day.fxDate, index),
      dateShort: dateShort(day.fxDate),
      dayName: dayName(day.fxDate, index),
      tempMax: day.tempMax,
      tempMin: day.tempMin,
      tempRange: tempRange(day),
      precipProbability: precipProbability(day),
      windText: windText(day),
      uvText: uvText(day),
      textDay: day.textDay,
      weather: weatherClass(day),
      weatherIcon: weatherIcon(day),
      washLevel: level,
      washLabel: washLabel(level, score),
      faceIcon: washFaceIcon(level)
    };
  });

  const today = normalized[0];
  const tomorrow = normalized[1];
  let baseScore = today ? today.score : 50;
  if (tomorrow && tomorrow.rainy) baseScore -= 18;

  const best = normalized
    .filter(day => !day.rainy)
    .sort((a, b) => b.score - a.score)[0];

  let keepDays = 0;
  for (const day of normalized) {
    if (day.rainy) break;
    keepDays += 1;
  }

  let decision = "可洗";
  let decisionLevel = "good";
  let headline = "今天适合洗车";
  if (baseScore < 55) {
    decision = "不建议";
    decisionLevel = "bad";
    headline = "未来短期有降雨风险";
  } else if (baseScore < 75) {
    decision = "谨慎";
    decisionLevel = "caution";
    headline = "可洗，但保持时间有限";
  }

  const bestDay = best ? best.dayName : "暂无";
  const bestWindow = best ? `${best.dayName} 17:00-20:00` : "暂无合适窗口";
  const subline = keepDays > 0 ? `预计可保持 ${keepDays} 天以上` : "洗后可能很快变脏";
  const nextRain = normalized.find(day => day.rainy);
  const reason = nextRain
    ? `${decision}。${nextRain.dayName}有${nextRain.textDay}，建议避开降雨前后洗车。`
    : `${decision}。未来一周没有明显降雨，适合安排洗车。`;

  const updatedAt = new Date().toISOString();

  return {
    city,
    source: "和风天气",
    updatedAt,
    updatedText: formatUpdatedText(updatedAt),
    todayTitle: today ? `${today.dayName}（${monthDayText(today.date)}）洗车指数` : "今日洗车指数",
    decision,
    decisionLevel,
    displayDecision: displayDecision(decisionLevel, decision),
    decisionIcon: decisionIcon(decisionLevel),
    headline,
    subline,
    keepDays,
    bestDay,
    bestWindow,
    reason,
    todayMetrics: metricRows(today),
    forecast: normalized
  };
}

async function getQWeatherAdvice(city) {
  const location = await resolveWeatherLocationId(city);
  const response = await requestJSON("/v7/weather/7d", { location });
  if (response.code !== "200") {
    throw new Error("天气数据获取失败");
  }
  return calculateAdvice(city, response.daily || []);
}

module.exports = {
  getQWeatherAdvice
};
