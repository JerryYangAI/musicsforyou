# 下一步操作指南

## ✅ 已完成的配置

1. ✅ **Suno API密钥** - 已配置并测试通过
2. ✅ **数据库连接** - Neon Database已配置
3. ✅ **数据库迁移** - 表结构已创建
4. ✅ **Redis** - 已安装并运行

## 🚀 启动服务器

### 启动开发服务器

```bash
npm run dev
```

服务器将在 `http://localhost:5000` 启动。

### 检查启动状态

启动后，您应该看到：
- ✅ 数据库连接成功
- ✅ Music generation worker started
- ✅ serving on port 5000

## 🧪 测试完整流程

### 1. 访问网站

打开浏览器访问：`http://localhost:5000`

### 2. 创建测试订单

1. **注册/登录账号**
   - 访问 `/auth` 页面
   - 创建测试账号

2. **创建音乐订单**
   - 访问 `/create` 页面
   - 填写音乐定制表单：
     - 选择风格（如：pop）
     - 选择情绪（如：happy）
     - 输入描述/歌词
     - 选择时长
   - 点击"继续支付"

3. **完成支付**
   - 在支付页面完成支付（使用Stripe测试卡号）
   - 支付成功后，订单状态应变为 `processing`

4. **观察音乐生成**
   - 查看服务器日志，应该看到：
     ```
     [API] Music generation task queued for order xxx
     [Worker] Processing music generation for order xxx
     [Worker] Music generation started, taskId: xxx
     ```
   - 订单状态会从 `processing` 变为 `completed`
   - 生成完成后，可以在订单页面下载音乐

### 3. 检查订单状态

访问 `/orders` 页面，查看订单列表和状态。

## 📊 监控和调试

### 查看服务器日志

服务器日志会显示：
- API请求
- Worker处理进度
- 错误信息

### 检查Redis队列

```bash
redis-cli
> KEYS bull:music-generation:*
> LLEN bull:music-generation:wait
> LLEN bull:music-generation:active
```

### 检查数据库

可以在Neon Dashboard查看数据库表和数据。

## 🐛 常见问题排查

### 问题1: Worker未启动

**检查**：
- 查看启动日志中是否有 "Music generation worker started"
- 检查Redis连接是否正常

### 问题2: 任务未处理

**检查**：
- Redis是否运行：`redis-cli ping`
- Worker日志中是否有错误
- 检查队列中是否有任务

### 问题3: API调用失败

**检查**：
- Suno API密钥是否正确
- 网络连接是否正常
- API配额是否充足

### 问题4: 文件上传失败

**检查**：
- 对象存储配置是否正确
- 文件大小是否超限
- 权限设置是否正确

## 📝 后续优化

### 阶段二：进度跟踪与通知

- [ ] 实现WebSocket实时推送进度
- [ ] 前端显示实时生成进度
- [ ] 完成通知

### 阶段三：用户体验优化

- [ ] 音乐预览功能
- [ ] 订单搜索和筛选
- [ ] 音乐收藏功能

### 阶段四：错误处理增强

- [ ] 完善错误分类
- [ ] 添加监控和告警
- [ ] 优化重试机制

---

**当前状态**: ✅ 基础配置完成，可以开始测试！


