# 微信支付和支付宝支付测试指南

## 📋 概述

本项目已集成Stripe的微信支付和支付宝支付功能。本文档说明如何测试这些支付方式。

## ✅ 已实现的功能

1. ✅ **支付方式选择** - 用户可以选择信用卡、微信支付或支付宝
2. ✅ **支付Intent创建** - 后端根据选择的支付方式创建相应的Payment Intent
3. ✅ **二维码显示** - 微信支付和支付宝显示支付二维码
4. ✅ **支付状态轮询** - 自动轮询支付状态，支付成功后自动跳转
5. ✅ **订单创建** - 支付成功后自动创建订单并触发音乐生成

## 🔧 配置要求

### 1. Stripe账户配置

确保您的Stripe账户已启用微信支付和支付宝：

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Settings** → **Payment methods**
3. 确认 **WeChat Pay** 和 **Alipay** 已启用
4. 配置支付方式配置（Payment Method Configuration）
   - 配置ID应设置在环境变量 `STRIPE_PAYMENT_METHOD_CONFIGURATION` 中
   - 或使用默认值：`pmc_1SUNeS2Kpr72bl34tTfOqI2t`

### 2. 环境变量配置

在 `.env` 文件中确保以下变量已配置：

```env
# Stripe配置
STRIPE_SECRET_KEY=sk_test_...  # 或生产密钥
STRIPE_PAYMENT_METHOD_CONFIGURATION=pmc_1SUNeS2Kpr72bl34tTfOqI2t

# 前端Stripe公钥
VITE_STRIPE_PUBLIC_KEY=pk_test_...
# 或测试环境
TESTING_VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 🧪 测试步骤

### 测试1: 信用卡支付

1. **启动服务器**
   ```bash
   npm run dev
   ```

2. **创建测试订单**
   - 访问 `http://localhost:5000/create`
   - 填写音乐定制表单
   - 点击"继续支付"

3. **选择支付方式**
   - 在支付页面选择"信用卡"
   - 填写测试卡号：`4242 4242 4242 4242`
   - 任意未来日期和CVC

4. **验证**
   - 支付应成功完成
   - 应跳转到订单页面
   - 订单状态应为 `processing`
   - 音乐生成任务应自动创建

### 测试2: 微信支付

1. **创建测试订单**
   - 访问 `http://localhost:5000/create`
   - 填写音乐定制表单
   - 点击"继续支付"

2. **选择微信支付**
   - 在支付页面选择"微信支付"
   - 点击"确认支付"

3. **查看二维码**
   - 应显示微信支付二维码
   - 二维码应清晰可扫描
   - 显示"等待支付确认..."提示

4. **使用微信扫码支付**
   - 使用微信扫描二维码
   - 完成支付（测试环境可能需要特殊配置）

5. **验证支付状态**
   - 支付成功后，页面应自动跳转到订单页面
   - 订单状态应为 `processing`
   - 音乐生成任务应自动创建

### 测试3: 支付宝支付

1. **创建测试订单**
   - 访问 `http://localhost:5000/create`
   - 填写音乐定制表单
   - 点击"继续支付"

2. **选择支付宝**
   - 在支付页面选择"支付宝"
   - 点击"确认支付"

3. **查看二维码**
   - 应显示支付宝支付二维码
   - 二维码应清晰可扫描
   - 显示"等待支付确认..."提示

4. **使用支付宝扫码支付**
   - 使用支付宝扫描二维码
   - 完成支付（测试环境可能需要特殊配置）

5. **验证支付状态**
   - 支付成功后，页面应自动跳转到订单页面
   - 订单状态应为 `processing`
   - 音乐生成任务应自动创建

## 🔍 调试和故障排除

### 问题1: 二维码不显示

**可能原因**：
- Payment Intent未正确创建
- Stripe账户未启用微信支付/支付宝
- Payment Method Configuration配置错误

**解决方案**：
1. 检查浏览器控制台错误
2. 检查服务器日志
3. 验证Stripe Dashboard中的支付方式配置
4. 确认环境变量配置正确

### 问题2: 支付状态轮询不工作

**可能原因**：
- API端点未正确响应
- Payment Intent ID未正确存储
- 网络请求失败

**解决方案**：
1. 检查浏览器Network标签页
2. 验证 `/api/payment-intent/:id/status` 端点
3. 检查sessionStorage中的paymentIntentId

### 问题3: 支付成功后订单未创建

**可能原因**：
- 支付状态轮询逻辑错误
- 订单创建API调用失败
- Session过期

**解决方案**：
1. 检查浏览器控制台错误
2. 检查服务器日志
3. 验证用户Session是否有效
4. 检查订单创建API端点

## 📊 测试检查清单

- [ ] 信用卡支付可以正常完成
- [ ] 微信支付二维码可以正常显示
- [ ] 支付宝二维码可以正常显示
- [ ] 支付状态轮询正常工作
- [ ] 支付成功后订单自动创建
- [ ] 支付成功后音乐生成任务自动创建
- [ ] 支付失败时显示错误提示
- [ ] 支付方式切换正常工作
- [ ] 页面刷新后支付状态保持
- [ ] 双语支持正常工作（中文/英文）

## 🎯 生产环境注意事项

1. **使用生产密钥**
   - 确保使用Stripe生产环境密钥
   - 配置正确的Payment Method Configuration ID

2. **测试支付流程**
   - 在生产环境部署前，使用Stripe测试模式充分测试
   - 验证微信支付和支付宝的实际支付流程

3. **监控和日志**
   - 设置支付失败的监控告警
   - 记录支付相关的日志以便调试

4. **用户体验**
   - 确保二维码清晰可扫描
   - 提供支付超时提示
   - 优化支付状态更新速度

## 📚 相关文档

- [Stripe微信支付文档](https://stripe.com/docs/payments/wechat-pay)
- [Stripe支付宝文档](https://stripe.com/docs/payments/alipay)
- [Stripe Payment Intents文档](https://stripe.com/docs/payments/payment-intents)

---

**最后更新**: 2025-11-27
**状态**: ✅ 微信支付和支付宝集成完成，可以开始测试

