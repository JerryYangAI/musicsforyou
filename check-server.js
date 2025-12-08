#!/usr/bin/env node

// 服务器诊断脚本
import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

console.log('🔍 检查服务器状态...\n');

// 检查1: 基本连接
console.log(`1. 检查基本连接 (http://${HOST}:${PORT})`);
const req1 = http.get(`http://${HOST}:${PORT}/`, (res) => {
  console.log(`   ✅ 状态码: ${res.statusCode}`);
  console.log(`   ✅ Content-Type: ${res.headers['content-type']}`);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // 检查2: Vite客户端
    console.log(`\n2. 检查Vite客户端 (http://${HOST}:${PORT}/@vite/client)`);
    const req2 = http.get(`http://${HOST}:${PORT}/@vite/client`, (res2) => {
      console.log(`   ✅ 状态码: ${res2.statusCode}`);
      console.log(`   ✅ Content-Type: ${res2.headers['content-type']}`);
      
      // 检查3: 主入口文件
      console.log(`\n3. 检查主入口文件 (http://${HOST}:${PORT}/src/main.tsx)`);
      const req3 = http.get(`http://${HOST}:${PORT}/src/main.tsx`, (res3) => {
        console.log(`   ✅ 状态码: ${res3.statusCode}`);
        console.log(`   ✅ Content-Type: ${res3.headers['content-type']}`);
        
        console.log('\n✅ 所有检查通过！服务器运行正常。');
        console.log(`\n🌐 请在浏览器中访问: http://${HOST}:${PORT}`);
        process.exit(0);
      });
      
      req3.on('error', (err) => {
        console.log(`   ❌ 错误: ${err.message}`);
        console.log('\n⚠️  主入口文件无法访问，可能是Vite中间件配置问题。');
        process.exit(1);
      });
    });
    
    req2.on('error', (err) => {
      console.log(`   ❌ 错误: ${err.message}`);
      console.log('\n⚠️  Vite客户端无法访问，可能是Vite中间件配置问题。');
      process.exit(1);
    });
  });
});

req1.on('error', (err) => {
  console.log(`   ❌ 错误: ${err.message}`);
  console.log('\n⚠️  服务器未运行或无法连接。');
  console.log('   请运行: npm run dev');
  process.exit(1);
});

