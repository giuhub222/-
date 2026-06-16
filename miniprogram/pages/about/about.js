const {
  getWashRecords,
  daysSince,
  getStoredUser,
  setStoredUser,
  clearStoredUser
} = require("../../utils/storage");

const DEFAULT_AVATAR = "/assets/icons/ui/nav-user-active.svg";

function pad2(value) {
  return `${value}`.padStart(2, "0");
}

Page({
  data: {
    isLoggedIn: false,
    avatarUrl: DEFAULT_AVATAR,
    displayName: "未登录",
    draftNickname: "",
    profileDesc: "登录后可保存你的洗车偏好",
    loginMeta: "未登录",
    identityText: "未登录",
    stats: [
      { value: 0, label: "累计洗车(次)" },
      { value: 0, label: "本月洗车(次)" },
      { value: "--", label: "距上次(天)" }
    ],
    lastWashText: "暂无记录"
  },

  onShow() {
    this.loadUserSession();
    this.loadProfileData();
  },

  loadUserSession() {
    const user = getStoredUser();
    const isLoggedIn = !!(user && user.isLoggedIn);
    const nickname = isLoggedIn ? (user.nickname || "微信用户") : "";
    this.setData({
      isLoggedIn,
      avatarUrl: user && user.avatarUrl ? user.avatarUrl : DEFAULT_AVATAR,
      displayName: isLoggedIn ? nickname : "未登录",
      draftNickname: nickname,
      profileDesc: isLoggedIn ? "欢迎回来，继续保持爱车清爽" : "选择头像并填写昵称后登录",
      loginMeta: isLoggedIn ? this.formatLoginTime(user.loginAt) : "未登录",
      identityText: isLoggedIn ? (user.loginType === "cloud" ? "微信云登录" : "本机登录") : "未登录"
    });
  },

  loadProfileData() {
    const records = getWashRecords();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const monthCount = records.filter(item => item.date && item.date.indexOf(currentMonth) === 0).length;
    const lastDays = records[0] ? daysSince(records[0].date) : "--";
    const lastWashText = records[0] ? (lastDays === 0 ? "今天洗过车" : `${lastDays}天前洗过车`) : "还没有洗车记录";

    this.setData({
      lastWashText,
      stats: [
        { value: records.length, label: "累计洗车(次)" },
        { value: monthCount, label: "本月洗车(次)" },
        { value: lastDays, label: "距上次(天)" }
      ]
    });
  },

  formatLoginTime(loginAt) {
    if (!loginAt) return "已登录";
    const date = new Date(loginAt);
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const hour = `${date.getHours()}`.padStart(2, "0");
    const minute = `${date.getMinutes()}`.padStart(2, "0");
    return `登录于 ${month}-${day} ${hour}:${minute}`;
  },

  onChooseAvatar(event) {
    const avatarUrl = event.detail && event.detail.avatarUrl;
    if (avatarUrl) {
      this.setData({ avatarUrl });
    }
  },

  onNicknameInput(event) {
    this.setData({ draftNickname: event.detail.value });
  },

  loginWithWechat() {
    const nickname = (this.data.draftNickname || "").trim() || "微信用户";
    this.requestLoginIdentity()
      .then(identity => {
        const user = {
          isLoggedIn: true,
          nickname,
          avatarUrl: this.data.avatarUrl,
          loginAt: Date.now(),
          ...identity
        };
        setStoredUser(user);
        this.loadUserSession();
        wx.showToast({ title: "登录成功", icon: "success" });
      })
      .catch(() => {
        wx.showToast({ title: "登录失败", icon: "none" });
      });
  },

  requestLoginIdentity() {
    const app = getApp();
    if (wx.cloud && app.globalData && app.globalData.cloudReady) {
      return wx.cloud
        .callFunction({ name: "login" })
        .then(res => {
          const result = res.result || {};
          if (result.success) {
            return {
              loginType: "cloud",
              openid: result.openid || ""
            };
          }
          return this.loginWithCode();
        })
        .catch(() => this.loginWithCode());
    }
    return this.loginWithCode();
  },

  loginWithCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: res => {
          if (res.code) {
            resolve({ loginType: "code" });
          } else {
            reject(new Error("wx.login no code"));
          }
        },
        fail: reject
      });
    });
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后仍会保留本机洗车记录。",
      confirmText: "退出",
      confirmColor: "#ff3b30",
      success: res => {
        if (res.confirm) {
          clearStoredUser();
          this.loadUserSession();
          wx.showToast({ title: "已退出", icon: "none" });
        }
      }
    });
  },

  showSettings() {
    wx.showModal({
      title: "设置",
      content: "登录信息和洗车记录默认保存在本机；配置云开发后可通过 login 云函数识别微信用户。",
      confirmText: "知道了",
      showCancel: false
    });
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
