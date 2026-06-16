const {
  getWashRecords,
  recordWashToday,
  clearWashRecords,
  daysSince
} = require("../../utils/storage");

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function parseRecordDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function pad2(value) {
  return `${value}`.padStart(2, "0");
}

Page({
  data: {
    records: [],
    groups: [],
    lastWashText: "未记录",
    summary: {
      monthLabel: "",
      monthCount: 0,
      totalCount: 0,
      lastWashText: "未记录",
      lastDays: "--"
    }
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    const records = getWashRecords().map(item => this.formatRecord(item));
    const lastWashText = records[0] ? records[0].ago : "未记录";
    const groups = this.groupRecords(records);
    const summary = this.buildSummary(records, lastWashText);
    this.setData({ records, groups, lastWashText, summary });
  },

  formatAgo(date) {
    const days = daysSince(date);
    if (days === 0) return "今天";
    return `${days}天前`;
  },

  formatRecord(item) {
    const date = parseRecordDate(item.date);
    const monthKey = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    const isManual = item.source === "manual";
    return {
      ...item,
      monthKey,
      monthLabel: `${date.getFullYear()}年${date.getMonth() + 1}月`,
      dateShort: `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`,
      weekday: WEEKDAYS[date.getDay()],
      timeText: item.time || "本机记录",
      title: isManual ? "手动洗车" : "洗车记录",
      badge: isManual ? "手动添加" : "本机缓存",
      badgeTone: isManual ? "blue" : "green",
      dotTone: isManual ? "blue" : "green",
      detailText: isManual ? "本机手动添加，用于首页上次洗车" : "来自本机缓存记录",
      storeName: "今日洗车查询",
      statusText: "已完成",
      ago: this.formatAgo(item.date)
    };
  },

  groupRecords(records) {
    return records.reduce((groups, record) => {
      const last = groups[groups.length - 1];
      if (last && last.monthKey === record.monthKey) {
        last.items.push(record);
        last.count += 1;
      } else {
        groups.push({
          monthKey: record.monthKey,
          monthLabel: record.monthLabel,
          count: 1,
          items: [record]
        });
      }
      return groups;
    }, []);
  },

  buildSummary(records, lastWashText) {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const monthCount = records.filter(item => item.monthKey === monthKey).length;
    const lastDays = records[0] ? daysSince(records[0].date) : "--";
    return {
      monthLabel: `${now.getFullYear()}年${now.getMonth() + 1}月`,
      monthCount,
      totalCount: records.length,
      lastWashText,
      lastDays
    };
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
