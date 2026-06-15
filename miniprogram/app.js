const { cloudEnvId, isCloudConfigured } = require("./utils/config");

App({
  onLaunch() {
    if (wx.cloud && isCloudConfigured()) {
      wx.cloud.init({
        env: cloudEnvId,
        traceUser: false
      });
    }
  },

  globalData: {
    cloudReady: isCloudConfigured()
  }
});
