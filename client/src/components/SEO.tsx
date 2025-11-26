// SEO 组件 - 用于管理页面的 meta 标签
// 使用 react-helmet-async 实现

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';

interface SEOProps {
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  image?: string;
  type?: string;
  locale?: 'zh' | 'en';
}

const BASE_URL = 'https://www.musicsforyou.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;

const defaultMeta = {
  zh: {
    title: '音为你 - 专业音乐定制平台',
    description: '音为你是专业的音乐定制平台，为您打造独一无二的专属音乐。无论是生日祝福、婚礼纪念还是企业品牌，我们都能为您创作动人旋律。',
  },
  en: {
    title: 'Your Melody - Professional Music Customization',
    description: 'Your Melody is a professional music customization platform. Create unique, personalized music for birthdays, weddings, corporate branding, and more.',
  },
};

export function SEO({
  title,
  titleEn,
  description,
  descriptionEn,
  image = DEFAULT_IMAGE,
  type = 'website',
  locale = 'zh',
}: SEOProps) {
  const [location] = useLocation();
  const currentUrl = `${BASE_URL}${location}`;
  
  const finalTitle = locale === 'zh' 
    ? (title ? `${title} | 音为你` : defaultMeta.zh.title)
    : (titleEn || title ? `${titleEn || title} | Your Melody` : defaultMeta.en.title);
  
  const finalDescription = locale === 'zh'
    ? (description || defaultMeta.zh.description)
    : (descriptionEn || description || defaultMeta.en.description);

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Language */}
      <html lang={locale === 'zh' ? 'zh-CN' : 'en'} />
      
      {/* Open Graph - Facebook, LinkedIn */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={locale === 'zh' ? '音为你' : 'Your Melody'} />
      <meta property="og:locale" content={locale === 'zh' ? 'zh_CN' : 'en_US'} />
      
      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={locale === 'zh' ? '音为你' : 'Your Melody'} />
      <meta name="keywords" content={locale === 'zh' 
        ? '音乐定制,定制音乐,专属音乐,生日歌曲,婚礼音乐,企业歌曲,个性化音乐'
        : 'custom music, personalized songs, birthday songs, wedding music, corporate music, unique music'
      } />
    </Helmet>
  );
}

// 预定义的页面 SEO 配置
export const pageSEO = {
  home: {
    zh: {
      title: '首页',
      description: '音为你 - 专业音乐定制平台。为您打造独一无二的专属音乐，无论是生日祝福、婚礼纪念还是企业品牌，我们都能为您创作动人旋律。',
    },
    en: {
      title: 'Home',
      description: 'Your Melody - Professional music customization platform. Create unique, personalized music for any occasion.',
    },
  },
  create: {
    zh: {
      title: '定制音乐',
      description: '开始定制您的专属音乐。填写您的需求，我们的专业团队将为您创作独一无二的歌曲。',
    },
    en: {
      title: 'Create Music',
      description: 'Start creating your personalized music. Tell us your requirements and our professional team will compose a unique song for you.',
    },
  },
  orders: {
    zh: {
      title: '我的订单',
      description: '查看您的音乐定制订单状态和历史记录。',
    },
    en: {
      title: 'My Orders',
      description: 'View your music customization order status and history.',
    },
  },
  about: {
    zh: {
      title: '关于我们',
      description: '了解音为你音乐定制平台。我们致力于为每一位客户创作独一无二的专属音乐作品。',
    },
    en: {
      title: 'About Us',
      description: 'Learn about Your Melody music customization platform. We are dedicated to creating unique music for every customer.',
    },
  },
  contact: {
    zh: {
      title: '联系我们',
      description: '有任何问题或建议？欢迎联系音为你团队，我们将竭诚为您服务。',
    },
    en: {
      title: 'Contact Us',
      description: 'Have questions or suggestions? Contact the Your Melody team. We are here to help.',
    },
  },
  auth: {
    zh: {
      title: '登录/注册',
      description: '登录或注册音为你账户，开始您的音乐定制之旅。',
    },
    en: {
      title: 'Login/Register',
      description: 'Login or register for a Your Melody account to start your music customization journey.',
    },
  },
  profile: {
    zh: {
      title: '个人中心',
      description: '管理您的音为你账户信息和设置。',
    },
    en: {
      title: 'Profile',
      description: 'Manage your Your Melody account information and settings.',
    },
  },
};

export default SEO;
