# musicsforyou Roadmap（短期）

## 1. 稳定 MVP

- [ ] 补齐 README / 基本文档（运行方式、环境变量说明）
- [ ] 写一份「产品介绍」的中英文文案（给未来落地页/公众号用）
- [ ] 用 guest / free / pro 三种身份各跑一遍完整流程，记录问题

## 2. 体验优化（不依赖 Stripe）

- [ ] 优化「预设风格」文本和图标
- [ ] 在 Prompt 旁边加一个「提示词示例 / 小问号说明」
- [ ] 我的作品页加简单筛选（按时间排序、按风格过滤）
- [ ] 手机端浏览体验优化（至少保证主流程可用）

## 3. 支付 & 收费闭环（只在 Stripe 测试环境）

- [ ] 把 Pricing 页从 mock 接口切到真实 PaymentIntent（测试 key）
- [ ] 通过 Stripe Dashboard + 测试卡跑通 Pro 升级
- [ ] 通过 Stripe Dashboard + 测试卡跑通 Credits 购买
- [ ] 确认 Webhook 能可靠更新 `data/orders.json` 和用户 plan/credits

## 4. 第一批真实用户

- [ ] 选 3–5 个愿意玩的朋友做「内测用户」
- [ ] 帮他们手动开通 Pro（先不用真实收费），换取反馈
- [ ] 根据反馈调整风格预设 / 文案 / 限额策略
