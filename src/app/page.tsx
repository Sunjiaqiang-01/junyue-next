import Image from 'next/image'
import { TechnicianList } from '@/components/custom/technician-list'
import { AnnouncementBanner } from '@/components/ui/announcement-banner'
import { FloatingCustomerService } from '@/components/ui/floating-customer-service'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* 头部Logo区域 */}
      <header className="w-full py-4 bg-white shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <Image
              src="/assets/logo.png"
              alt="君悦彩虹SPA Logo"
              width={120}
              height={60}
              className="object-contain"
              priority
            />
            <h1 className="text-2xl font-bold text-primary">
              君悦彩虹SPA
            </h1>
          </div>
        </div>
      </header>

      {/* 公告栏区域 */}
      <AnnouncementBanner />

      {/* 主要内容区域 */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            专业SPA技师服务
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            我们提供专业的SPA技师服务，让您享受放松身心的美好时光。
            所有技师均经过专业培训，为您提供优质的服务体验。
          </p>
          
          {/* 服务项目展示 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">💆</div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                项目一（498元/60分钟）
              </h3>
              <p className="text-gray-600 text-sm">
                基础舒缓SPA：体推、全身推油、肾部保养、全身按摩、臀部保养、私密护理
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">💆‍♀️</div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                项目二（598元/80分钟）
              </h3>
              <p className="text-gray-600 text-sm">
                进阶焕活SPA：包含项目一全部内容，额外增加头疗、激情助浴、耳边调情、手指弹滑
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-sm">
              <div className="text-4xl mb-4">💆‍♂️</div>
              <h3 className="text-xl font-semibold text-primary mb-2">
                项目三（698元/90分钟）
              </h3>
              <p className="text-gray-600 text-sm">
                奢华尊享SPA：包含项目一+二全部内容，额外增加花式滑推、水晶之恋、疏通护理、深度放松
              </p>
            </div>
          </div>

          {/* 预约说明 */}
          <div className="mt-12 bg-primary text-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">💰 预约说明</h3>
            <ul className="text-left space-y-2 max-w-md mx-auto">
              <li>• 预约需支付定金100元</li>
              <li>• 支持上门服务（需报销实际路费）</li>
              <li>• 路费标准：滴滴/出租车实际计费</li>
              <li>• 透明消费，不满意可及时反馈</li>
              <li>• 选择好技师，确定项目和时间，联系客服安排即可~</li>
            </ul>
          </div>
        </div>

        {/* 技师展示区域 */}
        <section className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">
              ✨ 精选技师团队
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              我们拥有专业的技师团队，每位技师都经过严格筛选和专业培训，
              为您提供最优质的SPA服务体验。
            </p>
          </div>
          
          <TechnicianList />
        </section>
      </main>

      {/* 悬浮客服 */}
      <FloatingCustomerService />

      {/* 底部客服区域 */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            如需预约服务，请联系我们的客服
          </p>
          <p className="text-sm text-gray-500">
            君悦彩虹SPA © 2024 版权所有
          </p>
        </div>
      </footer>
    </div>
  )
} 