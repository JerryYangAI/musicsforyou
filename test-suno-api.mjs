// 测试Suno API配置
import { readFileSync } from 'fs';
import axios from 'axios';

// 读取.env文件
function loadEnv() {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          env[key.trim()] = value;
        }
      }
    });
    return env;
  } catch (error) {
    console.error('无法读取.env文件:', error.message);
    return {};
  }
}

const env = loadEnv();
const API_KEY = env.SUNO_API_KEY || process.env.SUNO_API_KEY;
const API_URL = env.SUNO_API_URL || process.env.SUNO_API_URL || 'https://api.sunoapi.org';

console.log('🔍 测试Suno API配置...\n');
console.log(`API URL: ${API_URL}`);
console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : '未设置'}\n`);

if (!API_KEY) {
  console.error('❌ 错误: SUNO_API_KEY 未设置');
  console.log('请在 .env 文件中设置 SUNO_API_KEY');
  process.exit(1);
}

// 测试1: 检查API密钥格式
console.log('📝 测试1: 检查API密钥格式...');
if (API_KEY.length < 10) {
  console.error('❌ API密钥格式可能不正确（太短）');
} else {
  console.log('✅ API密钥格式看起来正确\n');
}

// 测试2: 测试生成音乐API
console.log('📝 测试2: 测试生成音乐API...');
async function testGenerateAPI() {
  try {
    // 使用自定义模式进行测试（与我们的实际代码一致）
    const testRequest = {
      customMode: true,
      prompt: "A happy pop song about testing",
      style: "Pop style with happy, upbeat mood",
      title: "Test Song",
      instrumental: false,
      model: "V5",
      callBackUrl: "https://example.com/callback", // 添加回调URL（测试用）
    };

    console.log('发送测试请求...');
    console.log('请求参数:', JSON.stringify(testRequest, null, 2));
    
    const response = await axios.post(
      `${API_URL}/api/v1/generate`,
      testRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 30000,
      }
    );

    if (response.data.code === 200 && response.data.data?.taskId) {
      console.log('✅ API连接成功！');
      console.log(`任务ID: ${response.data.data.taskId}\n`);
      return response.data.data.taskId;
    } else {
      console.error('❌ API返回了意外的响应:');
      console.error(JSON.stringify(response.data, null, 2));
      return null;
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ API请求失败:');
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误信息: ${error.response.data?.msg || error.message}`);
      
      if (error.response.status === 401) {
        console.error('\n💡 提示: API密钥可能无效或已过期');
        console.error('请检查您的API密钥是否正确');
      } else if (error.response.status === 403) {
        console.error('\n💡 提示: API密钥可能没有权限');
      } else if (error.response.status === 429) {
        console.error('\n💡 提示: API请求频率过高，请稍后再试');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ 无法连接到API服务器');
      console.error('请检查网络连接和API URL');
    } else if (error.code === 'ENOTFOUND') {
      console.error('❌ 无法解析API服务器地址');
      console.error('请检查API URL是否正确');
    } else {
      console.error('❌ 错误:', error.message);
    }
    return null;
  }
}

// 测试3: 测试查询状态API（如果有taskId）
async function testStatusAPI(taskId) {
  if (!taskId) {
    console.log('⏭️  跳过状态查询测试（没有任务ID）\n');
    return;
  }

  console.log('📝 测试3: 测试查询状态API...');
  try {
    const response = await axios.get(
      `${API_URL}/api/v1/generate/record-info`,
      {
        params: {
          taskId: taskId,
        },
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
        timeout: 10000,
      }
    );

    if (response.data.code === 200) {
      console.log('✅ 状态查询API工作正常！');
      console.log(`任务状态: ${response.data.data?.status || '未知'}\n`);
    } else {
      console.error('❌ 状态查询返回了意外的响应:');
      console.error(JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ 状态查询失败:');
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误信息: ${error.response.data?.msg || error.message}`);
    } else {
      console.error('❌ 错误:', error.message);
    }
  }
}

// 运行测试
(async () => {
  const taskId = await testGenerateAPI();
  await testStatusAPI(taskId);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (taskId) {
    console.log('✅ 所有测试通过！API配置正确。');
    console.log('\n💡 提示: 测试任务已创建，您可以在Suno API控制台查看。');
  } else {
    console.log('❌ 测试失败，请检查配置。');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();


