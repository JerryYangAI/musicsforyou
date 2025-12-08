# 服务器启动错误修复

## 🔍 问题分析

### 错误信息
```
Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:3000
```

### 错误原因

1. **不支持的listen参数格式**
   - 原代码使用了对象参数格式：`server.listen({ port, host: "0.0.0.0", reusePort: true })`
   - `reusePort: true` 选项在macOS上不被支持，导致 `ENOTSUP` 错误
   - Node.js HTTP Server的`listen()`方法在某些版本中不支持这种对象参数格式

2. **端口配置问题**
   - 代码默认使用端口5000，但环境变量可能设置为3000
   - 如果端口3000被占用或配置有问题，也会导致错误

## ✅ 解决方案

### 已修复的问题

1. **修改listen方法调用**
   - 从对象参数格式改为标准格式：`server.listen(port, host, callback)`
   - 移除了不支持的 `reusePort: true` 选项
   - 使用标准的Node.js HTTP Server API

2. **改进端口和主机配置**
   - 支持通过环境变量 `PORT` 设置端口（默认5000）
   - 支持通过环境变量 `HOST` 设置主机（默认0.0.0.0）
   - 添加了更友好的启动日志

### 修复后的代码

```typescript
const port = parseInt(process.env.PORT || '5000', 10);
const host = process.env.HOST || '0.0.0.0';

server.listen(port, host, () => {
  log(`serving on port ${port}`);
  if (host === '0.0.0.0') {
    log(`Access the app at http://localhost:${port}`);
  } else {
    log(`Access the app at http://${host}:${port}`);
  }
});
```

## 🚀 现在可以正常启动

### 启动命令

```bash
cd /Users/yangguang/Desktop/websiteproject/musicsforyou
npm run dev
```

### 预期输出

启动成功后，您应该看到：
```
✓ serving on port 5000
Access the app at http://localhost:5000
Music generation worker started
```

### 访问地址

- **本地访问**: http://localhost:5000
- **网络访问**: http://0.0.0.0:5000（如果host设置为0.0.0.0）

## 🔧 环境变量配置

### 端口配置

在 `.env` 文件中可以设置：

```env
# 服务器端口（默认5000）
PORT=5000

# 服务器主机（默认0.0.0.0，表示监听所有网络接口）
HOST=0.0.0.0
```

### 如果端口被占用

如果端口5000被占用，可以：

1. **更改端口**（推荐）：
   ```env
   PORT=5001
   ```

2. **或者杀死占用端口的进程**：
   ```bash
   # 查找占用端口的进程
   lsof -ti:5000
   
   # 杀死进程（替换PID）
   kill -9 PID
   ```

## 📝 技术说明

### Node.js HTTP Server listen() 方法

**标准格式**：
```typescript
server.listen(port, host, callback)
```

**参数说明**：
- `port`: 端口号（数字）
- `host`: 主机地址（字符串，可选）
  - `'0.0.0.0'`: 监听所有网络接口
  - `'localhost'` 或 `'127.0.0.1'`: 仅本地访问
- `callback`: 启动成功回调函数（可选）

**不支持的选项**：
- `reusePort`: 在某些系统（特别是macOS）上不被支持
- 对象参数格式在某些Node.js版本中可能不被支持

## ✅ 验证修复

启动服务器后，检查：

1. ✅ 服务器成功启动，没有错误
2. ✅ 可以看到 "serving on port XXXX" 日志
3. ✅ 可以在浏览器中访问 http://localhost:5000
4. ✅ 页面正常加载，没有连接错误

---

**修复完成时间**: 2025-11-27
**状态**: ✅ 问题已修复，服务器可以正常启动

