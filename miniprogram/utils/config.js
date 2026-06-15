const cloudEnvId = "YOUR_CLOUD_ENV_ID";
const qweatherApiKey = "YOUR_QWEATHER_API_KEY";
const qweatherApiHost = "YOUR_QWEATHER_API_HOST";

const defaultCity = {
  id: "101020100",
  name: "上海",
  adm1: "上海市",
  adm2: "上海市"
};

function isCloudConfigured() {
  return Boolean(cloudEnvId && cloudEnvId !== "YOUR_CLOUD_ENV_ID");
}

function isQWeatherConfigured() {
  return Boolean(
    qweatherApiKey &&
      qweatherApiKey !== "YOUR_QWEATHER_API_KEY" &&
      qweatherApiHost &&
      qweatherApiHost !== "YOUR_QWEATHER_API_HOST"
  );
}

module.exports = {
  cloudEnvId,
  qweatherApiKey,
  qweatherApiHost,
  defaultCity,
  isCloudConfigured,
  isQWeatherConfigured,
  sourceLabel: "和风天气"
};
