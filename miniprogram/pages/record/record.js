const {
  getWashRecords,
  recordWashToday,
  clearWashRecords,
  daysSince
} = require("../../utils/storage");

Page({
  data: {
    records: [],
    lastWashText: "未记录"
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    const records = getWashRecords().map(item => ({
      ...item,
      ago: this.formatAgo(item.date)
    }));
    const lastWashText = records[0] ? records[0].ago : "未记录";
    this.setData({ records, lastWashText });
  },

  formatAgo(date) {
    const days = daysSince(date);
    if (days === 0) return "今天";
    return `${days}天前`;
  },

  addToday() {
    recordWashToday();
    this.loadRecords();
    wx.showToast({ title: "已记录", icon: "success" });
  },

  clearAll() {
    wx.showModal({
      title: "清空记录",
      content: "只会清空本机小程序记录，不影响云端数据。",
      confirmText: "清空",
      confirmColor: "#ff3b30",
      success: res => {
        if (res.confirm) {
          clearWashRecords();
          this.loadRecords();
        }
      }
    });
  },

  goIndex() {
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goCity() {
    wx.redirectTo({ url: "/pages/city/city" });
  },

  goAbout() {
    wx.redirectTo({ url: "/pages/about/about" });
  }
});
