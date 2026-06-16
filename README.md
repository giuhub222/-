# 今日洗车查询

一个微信原生小程序，用于查询今天是否适合洗车、预计能保持几天，以及一周内最佳洗车时间。

## 功能

- Apple 风格简洁首页：大字号洗车建议、一周天气、保持天数、最佳窗口
- 手动选择城市，默认不强制定位
- 本地记录“我今天洗车了”，用于展示上次洗车时间
- 云函数代理和风天气 API，避免 API key 暴露在小程序前端
- 云环境未配置时自动展示演示数据，方便先检查界面

## 目录

```text
.
├── miniprogram/              # 微信原生小程序前端
│   ├── pages/index/          # 首页：洗车建议
│   ├── pages/city/           # 城市选择与搜索
│   ├── pages/record/         # 本地洗车记录
│   ├── pages/about/          # 配置与上架说明
│   └── utils/                # 配置、存储、云函数调用
├── cloudfunctions/
│   ├── getWashAdvice/        # 获取 7 天天气并计算洗车建议
│   ├── login/                # 获取微信用户 openid
│   └── searchCity/           # 搜索和风天气城市 ID
└── docs/                     # 上架与测试说明
```

## 本地打开

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择 `/Users/pengyuyan/Desktop/今日洗车查询`。
4. 先用游客 AppID 或填写真实 AppID 打开。

## 必填配置

### 1. 小程序 AppID

在 `project.config.json` 中把：

```json
"appid": "touristappid"
```

替换为你的真实小程序 AppID。

### 2. 云开发环境 ID

在 `miniprogram/utils/config.js` 中把：

```js
const cloudEnvId = "YOUR_CLOUD_ENV_ID";
```

替换为你的云开发环境 ID。

### 3. 和风天气 API key

和风天气新版接口需要同时配置 API key 和专属 API Host。API Host 可在和风天气控制台的项目设置中查看，格式类似：

```text
abc1234xyz.def.qweatherapi.com
```

本地调试可先在 `miniprogram/utils/config.js` 中填写：

```js
const qweatherApiKey = "你的和风天气Key";
const qweatherApiHost = "你的和风天气API Host";
```

正式上线建议在微信开发者工具的云开发控制台中，为两个云函数配置环境变量：

```text
QWEATHER_API_KEY=你的和风天气Key
QWEATHER_API_HOST=你的和风天气API Host
```

然后分别上传并部署：

- `cloudfunctions/getWashAdvice`
- `cloudfunctions/login`
- `cloudfunctions/searchCity`

## 上架前注意

- 默认只使用手动城市，不强制收集精确位置。
- 洗车记录仅保存在用户本机缓存中。
- 如果后续加入“使用当前位置”，需要补充位置权限说明和隐私协议。
- 天气数据来自和风天气，正式上线前请确认服务条款和数据来源展示要求。

## 主要页面

- `pages/index/index`：今日建议、一周天气、保持天数、洗车记录入口
- `pages/city/city`：常用城市选择，云函数配置后支持城市搜索
- `pages/record/record`：本地洗车记录
- `pages/about/about`：配置、隐私和上架说明
