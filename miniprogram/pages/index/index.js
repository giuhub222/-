const { defaultCity } = require("../../utils/config");
const { getWashAdvice } = require("../../utils/api");
const {
  getStoredCity,
  getWashRecords,
  daysSince
} = require("../../utils/storage");

Page({
  data: {
    city: defaultCity,
    advice: null,
    loading: true,
    error: "",
    lastWashText: "未记录"
  },

  onLoad() {
    this.loadLocalState();
  },

  onShow() {
    this.loadLocalState();
    this.refreshAdvice();
  },

  onPullDownRefresh() {
    this.refreshAdvice().finally(() => wx.stopPullDownRefresh());
  },

  loadLocalState() {
    const city = getStoredCity(defaultCity);
    const records = getWashRecords();
    const lastDate = records[0] && records[0].date;
    const lastWashText = this.formatLastWash(lastDate);
    this.setData({ city, lastWashText });
  },

  formatLastWash(dateString) {
    if (!dateString) return "未记录";
    const days = daysSince(dateString);
    if (days === 0) return "今天";
    return `${days}天前`;
  },

  async refreshAdvice() {
    const city = this.data.city;
    this.setData({ loading: true, error: "" });

    try {
      const result = await getWashAdvice(city);
      this.setData({
        advice: result.data,
        loading: false
      });
    } catch (error) {
      this.setData({
        loading: false,
        error: error.message || "天气服务暂时不可用"
      });
    }
  },

  showReason() {
    const advice = this.data.advice;
    wx.showModal({
      title: "判断依据",
      content: advice ? advice.reason : "暂无天气依据",
      showCancel: false,
      confirmText: "知道了"
    });
  },

  goCity() {
    wx.navigateTo({ url: "/pages/city/city" });
  },

  goRecord() {
    wx.redirectTo({ url: "/pages/record/record" });
  },

  goAbout() {
    wx.redirectTo({ url: "/pages/about/about" });
  }
});
