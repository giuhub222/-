Page({
  data: {
    checks: [
      "填写真实小程序 AppID",
      "开通微信云开发环境并填写 envId",
      "在云函数环境变量配置 QWEATHER_API_KEY",
      "上传并部署 getWashAdvice 与 searchCity 云函数",
      "提交审核前补充隐私保护指引"
    ]
  },

  copyEnvName() {
    wx.setClipboardData({ data: "QWEATHER_API_KEY" });
  },

  goIndex() {
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goRecord() {
    wx.redirectTo({ url: "/pages/record/record" });
  }
});
