const {
  getWashRecords,
  addWashRecord,
  clearWashRecords,
  getStoredCity,
  daysSince,
  todayString,
  timeString
} = require("../../utils/storage");
const { defaultCity } = require("../../utils/config");

const TABS = [
  { key: "all", label: "总览" },
  { key: "month", label: "月记录" },
  { key: "analysis", label: "统计" }
];

const WASH_TYPES = ["普洗", "精洗", "自助洗", "打蜡护理"];
const PAYMENT_METHODS = ["微信", "支付宝", "现金", "会员卡"];
const SERVICE_ICONS = {
  standard: "/assets/icons/record/service-standard.svg",
  premium: "/assets/icons/record/service-premium.svg",
  interior: "/assets/icons/record/service-interior.svg"
};
const PREVIEW_RECORDS = [
  { id: "preview-2026-06-18", date: "2026-06-18", time: "10:30", cost: "32", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-06-10", date: "2026-06-10", time: "14:20", cost: "38", location: "途虎养车工场店（望京店）", washType: "精洗", paymentMethod: "支付宝", source: "preview" },
  { id: "preview-2026-06-02", date: "2026-06-02", time: "09:45", cost: "28", location: "车享家（合生汇店）", washType: "内饰清洁", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-05-28", date: "2026-05-28", time: "11:00", cost: "30", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-05-20", date: "2026-05-20", time: "15:20", cost: "26", location: "途虎养车工场店（双井店）", washType: "打蜡护理", paymentMethod: "支付宝", source: "preview" },
  { id: "preview-2026-05-12", date: "2026-05-12", time: "10:10", cost: "24", location: "车享家（合生汇店）", washType: "内饰清洁", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-05-04", date: "2026-05-04", time: "09:20", cost: "30", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-04-25", date: "2026-04-25", time: "09:50", cost: "30", location: "途虎养车工场店（望京店）", washType: "精洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-04-18", date: "2026-04-18", time: "14:00", cost: "30", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-04-10", date: "2026-04-10", time: "13:20", cost: "30", location: "车享家（国贸店）", washType: "内饰清洁", paymentMethod: "支付宝", source: "preview" },
  { id: "preview-2026-04-02", date: "2026-04-02", time: "09:15", cost: "30", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-03-22", date: "2026-03-22", time: "10:10", cost: "36", location: "途虎养车工场店（双井店）", washType: "精洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-03-08", date: "2026-03-08", time: "09:40", cost: "36", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-02-25", date: "2026-02-25", time: "10:00", cost: "28", location: "车享家（合生汇店）", washType: "内饰清洁", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-02-16", date: "2026-02-16", time: "14:30", cost: "30", location: "途虎养车工场店（望京店）", washType: "精洗", paymentMethod: "支付宝", source: "preview" },
  { id: "preview-2026-02-06", date: "2026-02-06", time: "11:10", cost: "28", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" },
  { id: "preview-2026-01-22", date: "2026-01-22", time: "09:30", cost: "36", location: "途虎养车工场店（望京店）", washType: "精洗", paymentMethod: "支付宝", source: "preview" },
  { id: "preview-2026-01-08", date: "2026-01-08", time: "10:20", cost: "32", location: "车仆洗车（朝阳大悦城店）", washType: "普洗", paymentMethod: "微信", source: "preview" }
];

function pad2(value) {
  return `${value}`.padStart(2, "0");
}

function normalizeDate(date) {
  if (date instanceof Date) return date;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseRecordDateTime(record) {
  const date = record && record.date ? record.date : todayString();
  const time = record && record.time ? record.time : "00:00";
  return normalizeDate(`${date}T${time}:00`);
}

function monthKeyFromDate(date) {
  const safeDate = normalizeDate(date);
  return `${safeDate.getFullYear()}-${pad2(safeDate.getMonth() + 1)}`;
}

function monthLabelFromKey(monthKey) {
  const [year, month] = String(monthKey).split("-");
  return `${year}年${Number(month)}月`;
}

function monthLabelShort(monthKey, withYear) {
  const [year, month] = String(monthKey).split("-");
  return withYear ? `${year}年${Number(month)}月` : `${Number(month)}月`;
}

function monthKeyOffset(monthKey, offset) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return monthKeyFromDate(date);
}

function moneyNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function moneyText(value) {
  return `¥${moneyNumber(value).toFixed(2)}`;
}

function compactParts(parts) {
  return parts.filter(Boolean).join(" · ");
}

function currentCityName() {
  const city = getStoredCity(defaultCity);
  return city.fullName || city.area || city.name || "";
}

function getChromeMetrics() {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
    const statusBarHeight = info.statusBarHeight || 20;
    const menuButton = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null;
    const hasMenuButton = menuButton && menuButton.height && menuButton.top >= statusBarHeight;
    const navBarHeight = hasMenuButton
      ? Math.max(44, (menuButton.top - statusBarHeight) * 2 + menuButton.height)
      : 44;
    const capsuleSafeWidth = hasMenuButton
      ? Math.max(88, info.windowWidth - menuButton.left + 8)
      : 88;
    return {
      statusBarHeight,
      navBarHeight,
      headerHeight: statusBarHeight + navBarHeight,
      capsuleSafeWidth
    };
  } catch (error) {
    return {
      statusBarHeight: 20,
      navBarHeight: 44,
      headerHeight: 64,
      capsuleSafeWidth: 88
    };
  }
}

function createRecordForm() {
  return {
    date: todayString(),
    time: timeString(),
    location: currentCityName(),
    cost: "",
    washType: WASH_TYPES[0],
    paymentMethod: PAYMENT_METHODS[0],
    note: ""
  };
}

function iconForType(type) {
  const text = String(type || "");
  if (text.indexOf("精") >= 0) return SERVICE_ICONS.premium;
  if (text.indexOf("内饰") >= 0) return SERVICE_ICONS.interior;
  return SERVICE_ICONS.standard;
}

function titleForType(type) {
  const text = String(type || "").trim();
  if (text.indexOf("普洗") >= 0) return "标准洗车";
  if (text.indexOf("精洗") >= 0) return "精致洗车";
  if (text.indexOf("内饰") >= 0) return "内饰清洁";
  if (text.indexOf("打蜡") >= 0) return "打蜡护理";
  if (text) return text;
  return "标准洗车";
}

function buildMonthWindow(selectedMonthKey, count) {
  const keys = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    keys.push(monthKeyOffset(selectedMonthKey, -index));
  }
  return keys;
}

function averageIntervalDays(records) {
  if (!records || records.length < 2) return 0;
  const sorted = records
    .slice()
    .sort((left, right) => parseRecordDateTime(left).getTime() - parseRecordDateTime(right).getTime());
  let total = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    total += (parseRecordDateTime(sorted[index]).getTime() - parseRecordDateTime(sorted[index - 1]).getTime()) / 86400000;
  }
  return total / (sorted.length - 1);
}

function formatInterval(value) {
  const safeValue = Number.isFinite(value) ? value : 0;
  if (!safeValue) return "—";
  return `${Math.max(1, Math.round(safeValue))}`;
}

function sumCost(records) {
  return records.reduce((total, item) => total + moneyNumber(item.cost), 0);
}

function uniqueWashDays(records) {
  const seen = {};
  records.forEach(item => {
    if (item.date) seen[item.date] = true;
  });
  return Object.keys(seen).length;
}

function countDiffText(current, previous) {
  const diff = current - previous;
  if (diff > 0) return { tone: "up", text: `较上月 +${diff}次` };
  if (diff < 0) return { tone: "down", text: `较上月少 ${Math.abs(diff)}次` };
  return { tone: "neutral", text: "较上月持平" };
}

function costDiffText(current, previous) {
  const diff = current - previous;
  if (Math.abs(diff) < 0.005) return { tone: "neutral", text: "较上月持平" };
  return {
    tone: diff > 0 ? "up" : "down",
    text: `较上月${diff > 0 ? "多" : "少"} ¥${Math.abs(diff).toFixed(2)}`
  };
}

function intervalDiffText(current, previous, currentCount, previousCount) {
  if (currentCount < 2 || previousCount < 2) return { tone: "neutral", text: "暂无上月数据" };
  const currentRounded = Math.max(1, Math.round(current));
  const previousRounded = Math.max(1, Math.round(previous));
  const diff = currentRounded - previousRounded;
  if (!diff) return { tone: "neutral", text: "较上月持平" };
  return {
    tone: diff > 0 ? "up" : "down",
    text: `较上月 ${diff > 0 ? "+" : "-"}${Math.abs(diff)}天`
  };
}

function formatBarAmount(value) {
  const amount = moneyNumber(value);
  return amount % 1 === 0 ? `${amount.toFixed(0)}` : amount.toFixed(1);
}

function buildOverviewCards(records, selectedMonthKey) {
  const previousMonthKey = monthKeyOffset(selectedMonthKey, -1);
  const currentMonthRecords = records.filter(item => item.monthKey === selectedMonthKey);
  const previousMonthRecords = records.filter(item => item.monthKey === previousMonthKey);
  const monthCount = currentMonthRecords.length;
  const previousCount = previousMonthRecords.length;
  const totalCost = sumCost(currentMonthRecords);
  const previousCost = sumCost(previousMonthRecords);
  const averageInterval = averageIntervalDays(currentMonthRecords);
  const previousInterval = averageIntervalDays(previousMonthRecords);
  const totalDays = uniqueWashDays(currentMonthRecords);

  const countDiff = countDiffText(monthCount, previousCount);
  const costDiff = costDiffText(totalCost, previousCost);
  const intervalDiff = intervalDiffText(averageInterval, previousInterval, monthCount, previousCount);

  return [
    {
      label: "洗车次数",
      valueText: `${monthCount}次`,
      footnoteValue: countDiff.text,
      footnoteTone: countDiff.tone
    },
    {
      label: "总花费",
      valueText: `¥${totalCost.toFixed(2)}`,
      footnoteValue: costDiff.text,
      footnoteTone: costDiff.tone
    },
    {
      label: "平均间隔",
      valueText: averageInterval ? `约${formatInterval(averageInterval)}天/次` : "—",
      footnoteValue: intervalDiff.text,
      footnoteTone: intervalDiff.tone
    },
    {
      label: "洗车天数",
      valueText: `${totalDays}天`,
      footnoteValue: "暂无上月数据",
      footnoteTone: "neutral"
    }
  ];
}

function buildTrendData(records, selectedMonthKey) {
  const monthKeys = buildMonthWindow(selectedMonthKey, 6);
  const amounts = monthKeys.map(monthKey => sumCost(records.filter(item => item.monthKey === monthKey)));
  const maxAmount = Math.max.apply(null, amounts.concat([0]));
  const topValue = Math.max(50, Math.ceil((maxAmount || 1) / 50) * 50);
  const axisLabels = [topValue, (topValue * 2) / 3, topValue / 3, 0].map(value => `${Math.round(value)}`);
  const bars = monthKeys.map((monthKey, index) => {
    const amount = amounts[index];
    const hasAmount = amount > 0;
    const height = hasAmount && topValue ? Math.max(12, Math.min(88, (amount / topValue) * 88)) : 3;
    return {
      monthKey,
      label: monthLabelShort(monthKey, false),
      amount,
      amountText: formatBarAmount(amount),
      heightStyle: `height: ${height}%;`,
      hasAmount,
      isCurrent: monthKey === selectedMonthKey
    };
  });
  return {
    axisLabels,
    bars,
    hasData: maxAmount > 0
  };
}

function buildDisplayRecord(item, index) {
  const sortDate = parseRecordDateTime(item);
  const monthKey = monthKeyFromDate(sortDate);
  const locationText = item.location || currentCityName() || "今日洗车查询";
  const cost = moneyNumber(item.cost);
  return {
    ...item,
    recordKey: item.id || `${item.date || "record"}-${item.time || index}-${index}`,
    sortValue: sortDate.getTime(),
    monthKey,
    monthLabel: monthLabelFromKey(monthKey),
    title: titleForType(item.washType),
    locationText,
    dateTimeText: `${item.date || todayString()} ${item.time || "00:00"}`,
    priceText: moneyText(cost),
    icon: iconForType(item.washType),
    statusText: "已完成",
    ago: daysSince(item.date) === 0 ? "今天" : `${daysSince(item.date)}天前`
  };
}

function buildMonthGroups(records, expandedKeys) {
  const groups = [];
  records.forEach(record => {
    const last = groups[groups.length - 1];
    if (last && last.monthKey === record.monthKey) {
      last.items.push(record);
      last.count += 1;
      last.totalCost += moneyNumber(record.cost);
    } else {
      groups.push({
        monthKey: record.monthKey,
        monthLabel: record.monthLabel,
        count: 1,
        totalCost: moneyNumber(record.cost),
        items: [record]
      });
    }
  });
  return groups.map(group => ({
    ...group,
    expanded: expandedKeys.indexOf(group.monthKey) >= 0,
    totalCostText: moneyText(group.totalCost)
  }));
}

function selectedMonthGroups(groupCards, selectedMonthKey) {
  return groupCards.filter(group => group.monthKey === selectedMonthKey).slice(0, 1);
}

function initialExpandedKeys(records) {
  return records[0] ? [records[0].monthKey] : [];
}

Page({
  data: {
    activeTab: "all",
    tabs: TABS,
    records: [],
    groupCards: [],
    overviewGroupCards: [],
    selectedMonthKey: monthKeyFromDate(new Date()),
    selectedMonthLabel: monthLabelFromKey(monthKeyFromDate(new Date())),
    overviewCards: [],
    trendAxisLabels: ["150", "100", "50", "0"],
    trendBars: [],
    hasTrendData: false,
    expandedMonthKeys: [],
    scrollTop: 0,
    usePreview: false,
    loadState: "loading",
    loadError: "",
    statusBarHeight: 20,
    navBarHeight: 44,
    headerHeight: 64,
    capsuleSafeWidth: 88,
    formVisible: false,
    formSaving: false,
    form: createRecordForm(),
    washTypes: WASH_TYPES,
    paymentMethods: PAYMENT_METHODS
  },

  onShow() {
    this.loadRecords();
  },

  onLoad() {
    this.setData(getChromeMetrics());
  },

  loadRecords() {
    const preserveExpansion = this.data.loadState === "ready";
    this.setData({ loadState: "loading", loadError: "" });
    try {
      const storedRecords = getWashRecords();
      const records = storedRecords
        .map((item, index) => buildDisplayRecord(item, index))
        .sort((left, right) => right.sortValue - left.sortValue);
      const selectedMonthKey = records[0] ? records[0].monthKey : monthKeyFromDate(new Date());
      const expandedMonthKeys = preserveExpansion
        ? this.data.expandedMonthKeys.slice()
        : (this.data.activeTab === "month" ? initialExpandedKeys(records) : []);
      const groupCards = buildMonthGroups(records, expandedMonthKeys);
      const overviewCards = buildOverviewCards(records, selectedMonthKey);
      const trendData = buildTrendData(records, selectedMonthKey);
      this.setData({
        records,
        usePreview: false,
        expandedMonthKeys,
        groupCards,
        overviewGroupCards: selectedMonthGroups(groupCards, selectedMonthKey),
        selectedMonthKey,
        selectedMonthLabel: monthLabelFromKey(selectedMonthKey),
        overviewCards,
        trendAxisLabels: trendData.axisLabels,
        trendBars: trendData.bars,
        hasTrendData: trendData.hasData,
        loadState: "ready",
        loadError: ""
      });
    } catch (error) {
      this.setData({
        loadState: "error",
        loadError: "暂时无法读取本机记录，请重新加载"
      });
    }
  },

  retryRecords() {
    this.loadRecords();
  },

  switchTab(event) {
    const nextTab = event.currentTarget.dataset.key;
    if (!nextTab || nextTab === this.data.activeTab) return;
    let expandedMonthKeys = this.data.expandedMonthKeys.slice();
    if (nextTab === "month") expandedMonthKeys = initialExpandedKeys(this.data.records);
    if (nextTab === "all") expandedMonthKeys = [];
    const groupCards = buildMonthGroups(this.data.records, expandedMonthKeys);
    this.setData({
      activeTab: nextTab,
      expandedMonthKeys,
      groupCards,
      overviewGroupCards: selectedMonthGroups(groupCards, this.data.selectedMonthKey)
    });
  },

  onOverviewMonthChange(event) {
    const selectedMonthKey = String(event.detail.value || "");
    if (!/^\d{4}-\d{2}$/.test(selectedMonthKey)) return;
    const overviewCards = buildOverviewCards(this.data.records, selectedMonthKey);
    const trendData = buildTrendData(this.data.records, selectedMonthKey);
    const groupCards = buildMonthGroups(this.data.records, this.data.expandedMonthKeys);
    this.setData({
      selectedMonthKey,
      selectedMonthLabel: monthLabelFromKey(selectedMonthKey),
      overviewCards,
      groupCards,
      overviewGroupCards: selectedMonthGroups(groupCards, selectedMonthKey),
      trendAxisLabels: trendData.axisLabels,
      trendBars: trendData.bars,
      hasTrendData: trendData.hasData
    });
  },

  toggleMonthSection(event) {
    const monthKey = event.currentTarget.dataset.key;
    const expandedKeys = this.data.expandedMonthKeys.slice();
    const currentIndex = expandedKeys.indexOf(monthKey);
    if (currentIndex >= 0) {
      expandedKeys.splice(currentIndex, 1);
    } else {
      expandedKeys.push(monthKey);
    }
    const groupCards = buildMonthGroups(this.data.records, expandedKeys);
    this.setData({
      expandedMonthKeys: expandedKeys,
      groupCards,
      overviewGroupCards: selectedMonthGroups(groupCards, this.data.selectedMonthKey)
    });
  },

  openRecordForm() {
    this.setData({
      formVisible: true,
      formSaving: false,
      form: createRecordForm()
    });
  },

  closeRecordForm() {
    if (this.data.formSaving) return;
    this.setData({ formVisible: false });
  },

  stopTap() {},

  handleFormInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  handleFormPicker(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  selectFormOption(event) {
    const { field, value } = event.currentTarget.dataset;
    this.setData({
      [`form.${field}`]: value
    });
  },

  saveRecordForm() {
    const form = this.data.form;
    const cost = String(form.cost || "").trim();
    if (cost && (!Number.isFinite(Number(cost)) || Number(cost) < 0)) {
      wx.showToast({ title: "请输入正确花费", icon: "none" });
      return;
    }

    this.setData({ formSaving: true });
    try {
      addWashRecord({
        date: form.date,
        time: form.time,
        location: form.location,
        cost,
        washType: form.washType,
        paymentMethod: form.paymentMethod,
        note: form.note,
        source: "manual"
      });
    } catch (error) {
      console.error("保存洗车记录失败", error);
      this.setData({ formSaving: false });
      wx.showToast({ title: "保存失败，请重试", icon: "none" });
      return;
    }
    this.setData({
      formVisible: false,
      formSaving: false,
      form: createRecordForm()
    });
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

  goAbout() {
    wx.redirectTo({ url: "/pages/about/about" });
  }
});
