function pad2(value) {
  return String(value).padStart(2, "0");
}

function updatedText(date) {
  return `更新于 ${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

const WEATHER_ICON_BASE = "/assets/icons/weather";
const UI_ICON_BASE = "/assets/icons/ui";

function getDemoAdvice(city) {
  const now = new Date();
  const forecast = [
    { date: "2026-06-15", isToday: true, dayName: "今天", dateLabel: "今", dateShort: "06/15", tempMax: "28", tempMin: "20", tempRange: "20~28°C", weather: "cloudy", weatherIcon: `${WEATHER_ICON_BASE}/partly-cloudy-day.svg`, textDay: "多云", washLevel: "best", washLabel: "非常适合", faceIcon: `${UI_ICON_BASE}/face-smile-green.svg` },
    { date: "2026-06-16", isToday: false, dayName: "明天", dateLabel: "二", dateShort: "06/16", tempMax: "29", tempMin: "21", tempRange: "21~29°C", weather: "cloudy", weatherIcon: `${WEATHER_ICON_BASE}/cloudy.svg`, textDay: "多云", washLevel: "normal", washLabel: "适合", faceIcon: `${UI_ICON_BASE}/face-smile-green.svg` },
    { date: "2026-06-17", isToday: false, dayName: "周三", dateLabel: "三", dateShort: "06/17", tempMax: "30", tempMin: "22", tempRange: "22~30°C", weather: "sunny", weatherIcon: `${WEATHER_ICON_BASE}/clear-day.svg`, textDay: "晴", washLevel: "best", washLabel: "非常适合", faceIcon: `${UI_ICON_BASE}/face-smile-green.svg` },
    { date: "2026-06-18", isToday: false, dayName: "周四", dateLabel: "四", dateShort: "06/18", tempMax: "24", tempMin: "19", tempRange: "19~24°C", weather: "rain", weatherIcon: `${WEATHER_ICON_BASE}/rain.svg`, textDay: "小雨", washLevel: "avoid", washLabel: "不太适合", faceIcon: `${UI_ICON_BASE}/face-frown-red.svg` },
    { date: "2026-06-19", isToday: false, dayName: "周五", dateLabel: "五", dateShort: "06/19", tempMax: "24", tempMin: "18", tempRange: "18~24°C", weather: "rain", weatherIcon: `${WEATHER_ICON_BASE}/rain.svg`, textDay: "阵雨", washLevel: "avoid", washLabel: "不适合", faceIcon: `${UI_ICON_BASE}/face-frown-red.svg` },
    { date: "2026-06-20", isToday: false, dayName: "周六", dateLabel: "六", dateShort: "06/20", tempMax: "27", tempMin: "20", tempRange: "20~27°C", weather: "cloudy", weatherIcon: `${WEATHER_ICON_BASE}/partly-cloudy-day.svg`, textDay: "多云", washLevel: "normal", washLabel: "适合", faceIcon: `${UI_ICON_BASE}/face-smile-green.svg` },
    { date: "2026-06-21", isToday: false, dayName: "周日", dateLabel: "日", dateShort: "06/21", tempMax: "29", tempMin: "21", tempRange: "21~29°C", weather: "sunny", weatherIcon: `${WEATHER_ICON_BASE}/clear-day.svg`, textDay: "晴", washLevel: "best", washLabel: "非常适合", faceIcon: `${UI_ICON_BASE}/face-smile-green.svg` }
  ];

  return {
    city,
    source: "演示数据",
    updatedAt: now.toISOString(),
    updatedText: updatedText(now),
    todayTitle: "今天（6月15日）洗车指数",
    decision: "可洗",
    decisionLevel: "good",
    displayDecision: "适合洗车",
    decisionIcon: `${UI_ICON_BASE}/face-smile-green.svg`,
    headline: "多云，气温适宜，未来24小时无雨",
    subline: "预计可保持 3 天以上",
    keepDays: 3,
    bestDay: "周三",
    bestWindow: "周三 17:00-20:00",
    reason: "未来 48 小时降雨风险低，周四起有雨，建议提前洗。",
    todayMetrics: [
      { icon: `${UI_ICON_BASE}/droplet-blue.svg`, name: "降水概率", value: "10%" },
      { icon: `${UI_ICON_BASE}/thermometer-blue.svg`, name: "温度范围", value: "20~28°C" },
      { icon: `${UI_ICON_BASE}/wind-blue.svg`, name: "风力等级", value: "2级" },
      { icon: `${UI_ICON_BASE}/sun-blue.svg`, name: "紫外线强度", value: "中等" }
    ],
    forecast
  };
}

module.exports = {
  getDemoAdvice
};
