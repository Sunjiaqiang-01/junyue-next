import { NextPage } from 'next';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: '君悦彩虹SPA - 官方发布页',
  description: '君悦彩虹SPA技师展示平台官方发布页，提供主站和备用站点访问地址',
};

const ReleasePage: NextPage = () => {
  return (
    <div className="bg-[#f8f9fa] min-h-screen py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B5C] to-[#D4AF37] shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 relative mr-4">
                <Image 
                  src="/assets/logo.png" 
                  alt="君悦彩虹SPA Logo" 
                  width={64} 
                  height={64}
                  className="object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#1A2B5C]">君悦彩虹SPA</h1>
                <p className="text-gray-600">专业技师展示平台 - 官方发布页</p>
              </div>
            </div>
            
            <div className="flex justify-center mb-8">
              <a 
                href="https://www.junyuecaihong.com" 
                className="group relative px-6 py-3 text-white font-semibold rounded-lg bg-[#1A2B5C] hover:bg-opacity-90 transition duration-300 shadow-md"
              >
                <span className="flex items-center">
                  主站入口
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                  点击访问主站
                </span>
              </a>
            </div>
            
            <h2 className="text-xl font-semibold text-[#1A2B5C] mb-4">备用访问地址</h2>
            <div className="flex justify-center mb-8">
              <a 
                href="https://www.junyuecaihong.xyz" 
                className="group relative px-6 py-3 text-white font-semibold rounded-lg bg-[#D4AF37] hover:bg-opacity-90 transition duration-300 shadow-md"
              >
                <span className="flex items-center">
                  备用站点
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                <span className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                  主站无法访问时使用
                </span>
              </a>
            </div>
            
            <div className="bg-gray-100 border-l-4 border-[#D4AF37] p-4 mb-8">
              <h2 className="text-xl font-semibold text-[#1A2B5C] mb-2">📢 重要公告</h2>
              <p className="mb-2">如遇网站无法访问，请保存此发布页地址：<strong className="text-[#1A2B5C]">www.junyuecaihong.com/release</strong></p>
              <p className="mb-2">
                主站地址：
                <a 
                  href="https://www.junyuecaihong.com" 
                  className="text-[#1A2B5C] font-bold hover:underline"
                >
                  www.junyuecaihong.com
                </a>
              </p>
              <p className="mb-2">
                备用站点：
                <a 
                  href="https://www.junyuecaihong.xyz" 
                  className="text-[#1A2B5C] font-bold hover:underline"
                >
                  www.junyuecaihong.xyz
                </a>
              </p>
              <p>我们会在此页面实时更新最新的访问地址</p>
            </div>
            
            <h2 className="text-xl font-semibold text-[#1A2B5C] mb-4">📞 联系我们</h2>
            <p className="mb-2">客服微信：请通过网站内获取</p>
            <p className="mb-4">服务时间：24小时在线</p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['南京', '苏州', '杭州', '武汉', '郑州'].map((city) => (
                <span key={city} className="px-3 py-1 bg-gray-200 rounded-full text-sm">
                  {city}
                </span>
              ))}
            </div>
            
            <div className="text-center text-gray-600 text-sm mt-8">
              <p>© 2024 君悦彩虹SPA - 专业技师展示平台</p>
            </div>
            
            <div className="text-right text-gray-500 text-xs mt-4">
              最后更新：{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleasePage; 