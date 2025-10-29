# Banner 加载问题排查清单

## 问题现象
Banner 没有加载出来

## 排查步骤

### ✅ 步骤 1：检查云函数是否部署成功

1. **打开微信开发者工具**
2. **点击"云开发"控制台**
3. **进入"云函数"标签**
4. **查找 `getBanners` 函数**

**检查点：**
- [ ] `getBanners` 函数是否存在？
- [ ] 函数状态是否为"已部署"？
- [ ] 部署时间是否是最近的？

**如果没有部署：**
1. 右键 `cloudFunctions/getBanners` 文件夹
2. 选择"上传并部署：云端安装依赖"
3. 等待部署完成（约 1-2 分钟）

---

### ✅ 步骤 2：检查数据库集合和数据

1. **在云开发控制台，进入"数据库"标签**
2. **查找 `banners` 集合**

**检查点：**
- [ ] `banners` 集合是否存在？
- [ ] 集合中是否有 3 条记录？
- [ ] 每条记录的 `enabled` 字段是否为 `true`？

**查看记录详情：**
```json
{
  "_id": "banner1",
  "id": 1,
  "title": "流水宝",
  "enabled": true,  // ← 必须是 true
  "sort": 1
}
```

**如果数据不对：**
1. 删除所有记录
2. 重新导入 `docs/aa.json`（使用 JSON Lines 格式）

---

### ✅ 步骤 3：测试云函数

1. **在云开发控制台，进入"云函数"标签**
2. **点击 `getBanners` 函数**
3. **点击"测试"标签**
4. **输入测试参数：`{}`**
5. **点击"运行测试"**

**期望的返回结果：**
```json
{
  "success": true,
  "data": [
    {
      "_id": "banner1",
      "id": 1,
      "title": "流水宝",
      "cloudPath": "cloud://...",
      "imageUrl": "https://...",
      "bgColor": "linear-gradient(...)",
      "link": "/packageBusiness/pages/liushui/liushui",
      "disabled": true,
      "enabled": true,
      "sort": 1
    },
    // ... 其他两个 banner
  ]
}
```

**检查点：**
- [ ] `success` 是否为 `true`？
- [ ] `data` 数组是否包含 3 个元素？
- [ ] 每个 banner 是否有 `imageUrl` 字段？

**如果返回错误：**
- 查看错误信息
- 检查云函数日志（点击"日志"标签）
- 检查数据库权限

---

### ✅ 步骤 4：检查前端控制台日志

1. **编译小程序**
2. **打开首页**
3. **查看控制台（Console）**

**期望的日志：**
```
开始加载 Banner 配置
Banner 云函数调用结果: {...}
成功获取 Banner 配置: [...]
```

**如果看到错误日志：**

#### 错误 1：`云函数 getBanners 不存在`
**原因：** 云函数未部署
**解决：** 重新部署云函数（参考步骤 1）

#### 错误 2：`加载 Banner 配置失败: Error: 获取 Banner 配置失败`
**原因：** 云函数返回的数据格式不对
**解决：** 
1. 测试云函数（参考步骤 3）
2. 查看云函数返回的数据结构
3. 确保返回 `{ success: true, data: [...] }`

#### 错误 3：`errCode: -404011`
**原因：** 数据库集合不存在
**解决：** 创建 `banners` 集合并导入数据（参考步骤 2）

#### 错误 4：没有任何日志
**原因：** `loadBanners()` 方法没有被调用
**解决：** 检查 `onLoad()` 方法是否调用了 `this.loadBanners()`

---

### ✅ 步骤 5：检查页面显示

**如果控制台没有错误，但页面不显示 Banner：**

1. **检查 WXML 模板**
   - 查看 `miniprogram/pages/home/home.wxml`
   - 确认 `<swiper>` 标签存在
   - 确认 `wx:if="{{banners.length > 0}}"` 条件

2. **检查数据绑定**
   - 在控制台输入：`getCurrentPages()[0].data.banners`
   - 查看 `banners` 数组是否有数据

3. **检查样式**
   - 查看 `miniprogram/pages/home/home.wxss`
   - 确认 `.banner-swiper` 样式存在
   - 确认高度设置正确

---

### ✅ 步骤 6：检查云存储图片

**如果 Banner 显示但没有图片：**

1. **检查云存储文件是否存在**
   - 进入云开发控制台 → 存储
   - 查找 `banners` 文件夹
   - 确认 `banner1.png`, `banner2.png`, `banner3.png` 存在

2. **检查 cloudPath 是否正确**
   - 在数据库中查看 `cloudPath` 字段
   - 格式应该是：`cloud://环境ID/banners/banner1.png`
   - 环境ID应该匹配你的云环境

3. **检查临时链接生成**
   - 查看云函数日志
   - 确认 `cloud.getTempFileURL()` 调用成功
   - 确认返回的 `imageUrl` 是有效的 HTTPS 链接

---

## 常见问题和解决方案

### 问题 1：显示"加载中..."不消失

**原因：** `loading` 状态没有更新为 `false`

**解决：**
1. 检查 `loadBanners()` 方法
2. 确认在 `then` 和 `catch` 中都设置了 `loading: false`

---

### 问题 2：显示默认的渐变背景，没有图片

**原因：** 
1. 云存储文件不存在
2. `cloudPath` 路径错误
3. 临时链接生成失败

**解决：**
1. 检查云存储文件（参考步骤 6）
2. 检查数据库中的 `cloudPath` 字段
3. 查看云函数日志，确认临时链接生成成功

---

### 问题 3：只显示部分 Banner

**原因：** 
1. 数据库中只有部分记录的 `enabled` 为 `true`
2. 部分记录的 `sort` 字段有问题

**解决：**
1. 检查数据库中所有记录的 `enabled` 字段
2. 确认 `sort` 字段是数字类型（1, 2, 3）

---

### 问题 4：Banner 顺序不对

**原因：** `sort` 字段值不正确

**解决：**
1. 检查数据库中的 `sort` 字段
2. 确保：banner1 的 sort=1, banner2 的 sort=2, banner3 的 sort=3

---

## 调试技巧

### 技巧 1：查看云函数日志

1. 云开发控制台 → 云函数 → getBanners → 日志
2. 查看最近的调用记录
3. 查看错误信息和返回数据

### 技巧 2：在控制台查看数据

```javascript
// 在小程序控制台输入
const page = getCurrentPages()[0]
console.log('banners:', page.data.banners)
console.log('loading:', page.data.loading)
```

### 技巧 3：手动调用云函数

```javascript
// 在小程序控制台输入
wx.cloud.callFunction({
  name: 'getBanners'
}).then(res => {
  console.log('云函数返回:', res)
})
```

### 技巧 4：查看网络请求

1. 打开微信开发者工具的"Network"标签
2. 刷新页面
3. 查找 `callFunction` 请求
4. 查看请求和响应数据

---

## 快速诊断命令

在小程序控制台依次执行以下命令：

```javascript
// 1. 检查 banners 数据
console.log('banners:', getCurrentPages()[0].data.banners)

// 2. 检查 loading 状态
console.log('loading:', getCurrentPages()[0].data.loading)

// 3. 手动调用云函数
wx.cloud.callFunction({
  name: 'getBanners'
}).then(res => {
  console.log('云函数返回:', res.result)
}).catch(err => {
  console.error('云函数错误:', err)
})

// 4. 手动设置测试数据
getCurrentPages()[0].setData({
  banners: [
    {
      id: 1,
      title: '测试 Banner',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      link: '/pages/index/index',
      disabled: false
    }
  ],
  loading: false
})
```

---

## 联系我

如果以上步骤都检查过了还是有问题，请提供以下信息：

1. **控制台日志截图**（包括错误信息）
2. **云函数测试结果截图**
3. **数据库 banners 集合截图**（显示所有记录）
4. **云函数列表截图**（显示 getBanners 是否部署）

我会根据这些信息帮你进一步诊断问题。

