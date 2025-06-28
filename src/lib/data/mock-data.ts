import { TechnicianWithMedia, CityType, AnnouncementData } from './types'

// 模拟公告数据
export const MOCK_ANNOUNCEMENTS: AnnouncementData[] = [
  {
    id: 1,
    title: "欢迎来到君悦彩虹SPA",
    content: "我们提供专业的SPA服务，让您享受身心的完全放松。营业时间：上午9:00-晚上23:00",
    type: "NORMAL",
    isActive: true,
    priority: 1,
    validFrom: null,
    validTo: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-27')
  },
  {
    id: 2,
    title: "营业时间调整通知",
    content: "为了更好地为您服务，我们的营业时间调整为：上午9:00-晚上23:00，感谢您的理解与支持！",
    type: "NORMAL",
    isActive: true,
    priority: 2,
    validFrom: null,
    validTo: null,
    createdAt: new Date('2024-06-15'),
    updatedAt: new Date('2024-06-27')
  },
  {
    id: 3,
    title: "新技师CX入驻优惠活动",
    content: "🎉 新技师CX正式入驻！预约享受首次体验优惠，专业服务等您来体验！",
    type: "URGENT",
    isActive: true,
    priority: 3,
    validFrom: null,
    validTo: null,
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-27')
  }
]

export const MOCK_TECHNICIANS: TechnicianWithMedia[] = [
  {
    id: 1,
    nickname: "CX",
    age: 24,
    height: 165,
    weight: 48,
    features: "温柔体贴，技术精湛，擅长全身按摩和深度放松，让您享受专业的SPA服务体验",
    isNew: true,
    isRecommended: true,
    isActive: true,
    city: "nanjing" as CityType,
    area: "南京市建邺区",
    address: "南京市建邺区河西万达广场附近",
    latitude: 32.0334,
    longitude: 118.7298,
    serviceCities: ["nanjing"],
    createdAt: new Date('2024-06-20'),
    updatedAt: new Date('2024-06-27'),
    media: [
      {
        id: 1,
        technicianId: 1,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/CX/9894669bad6f9b006c4bafed80ed052f_.jpg",
        thumbnailPath: "/uploads/technicians/CX/9894669bad6f9b006c4bafed80ed052f_.jpg",
        description: "CX技师照片1",
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: 2,
        technicianId: 1,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/CX/19679065cd026b15fdf76471fe7f6ad3_.jpg",
        thumbnailPath: "/uploads/technicians/CX/19679065cd026b15fdf76471fe7f6ad3_.jpg",
        description: "CX技师照片2",
        sortOrder: 2,
        createdAt: new Date()
      },
      {
        id: 3,
        technicianId: 1,
        mediaType: "VIDEO" as const,
        filePath: "/uploads/technicians/CX/5787fabb783c46410a4d4ceb5480b332_4.mp4",
        thumbnailPath: "/uploads/technicians/CX/ac7cc805cda37b0f073afdb72d561f21.jpg",
        description: "CX技师视频",
        sortOrder: 3,
        createdAt: new Date()
      },
      {
        id: 4,
        technicianId: 1,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/CX/ac7cc805cda37b0f073afdb72d561f21.jpg",
        thumbnailPath: "/uploads/technicians/CX/ac7cc805cda37b0f073afdb72d561f21.jpg",
        description: "CX技师照片3",
        sortOrder: 4,
        createdAt: new Date()
      },
      {
        id: 5,
        technicianId: 1,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/CX/bb5d8dad619766dcf46e3e82bb1d8778.jpg",
        thumbnailPath: "/uploads/technicians/CX/bb5d8dad619766dcf46e3e82bb1d8778.jpg",
        description: "CX技师照片4",
        sortOrder: 5,
        createdAt: new Date()
      },
      {
        id: 6,
        technicianId: 1,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/CX/7fc2ef5e6476fafc0cbd98c459c15559.jpg",
        thumbnailPath: "/uploads/technicians/CX/7fc2ef5e6476fafc0cbd98c459c15559.jpg",
        description: "CX技师照片5",
        sortOrder: 6,
        createdAt: new Date()
      }
    ]
  },
  {
    id: 2,
    nickname: "陨石",
    age: 26,
    height: 168,
    weight: 52,
    features: "经验丰富，服务周到，专业按摩手法精湛，注重细节，让您身心得到完全放松",
    isNew: false,
    isRecommended: true,
    isActive: true,
    city: "suzhou" as CityType,
    area: "苏州市姑苏区",
    address: "苏州市姑苏区观前街商圈",
    latitude: 31.3017,
    longitude: 120.5954,
    serviceCities: ["suzhou"],
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-06-27'),
    media: [
      {
        id: 7,
        technicianId: 2,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/陨石/4cdeb8b50a81577df513f1925f5a7ca.jpg",
        thumbnailPath: "/uploads/technicians/陨石/4cdeb8b50a81577df513f1925f5a7ca.jpg",
        description: "陨石技师照片1",
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: 8,
        technicianId: 2,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/陨石/6ece6107223e6ebdff27ffd7eee7718.jpg",
        thumbnailPath: "/uploads/technicians/陨石/6ece6107223e6ebdff27ffd7eee7718.jpg",
        description: "陨石技师照片2",
        sortOrder: 2,
        createdAt: new Date()
      }
    ]
  },
  {
    id: 3,
    nickname: "大白菜",
    age: 25,
    height: 162,
    weight: 49,
    features: "养生保健专家，私人定制服务，温柔贴心，擅长深度按摩和身心调理",
    isNew: false,
    isRecommended: false,
    isActive: true,
    city: "hangzhou" as CityType,
    area: "杭州市西湖区",
    address: "杭州市西湖区文三路数码城附近",
    latitude: 30.2741,
    longitude: 120.1551,
    serviceCities: ["hangzhou"],
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-06-27'),
    media: [
      {
        id: 9,
        technicianId: 3,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/大白菜/bbb1ff89d351a78486dccb85cf0126f7_.jpg",
        thumbnailPath: "/uploads/technicians/大白菜/bbb1ff89d351a78486dccb85cf0126f7_.jpg",
        description: "大白菜技师照片1",
        sortOrder: 1,
        createdAt: new Date()
      },
      {
        id: 10,
        technicianId: 3,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/大白菜/76ef39e4aa0832bf7b6ae8222b670780_.jpg",
        thumbnailPath: "/uploads/technicians/大白菜/76ef39e4aa0832bf7b6ae8222b670780_.jpg",
        description: "大白菜技师照片2",
        sortOrder: 2,
        createdAt: new Date()
      },
      {
        id: 11,
        technicianId: 3,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/大白菜/fd8a40ed037f77f00ebdd796e669aace_.jpg",
        thumbnailPath: "/uploads/technicians/大白菜/fd8a40ed037f77f00ebdd796e669aace_.jpg",
        description: "大白菜技师照片3",
        sortOrder: 3,
        createdAt: new Date()
      },
      {
        id: 12,
        technicianId: 3,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/大白菜/ec7ec20dddb99c26c1dac4951498271b_.jpg",
        thumbnailPath: "/uploads/technicians/大白菜/ec7ec20dddb99c26c1dac4951498271b_.jpg",
        description: "大白菜技师照片4",
        sortOrder: 4,
        createdAt: new Date()
      },
      {
        id: 13,
        technicianId: 3,
        mediaType: "IMAGE" as const,
        filePath: "/uploads/technicians/大白菜/3c3e683db06e66246f2936c2ce9846bc_.jpg",
        thumbnailPath: "/uploads/technicians/大白菜/3c3e683db06e66246f2936c2ce9846bc_.jpg",
        description: "大白菜技师照片5",
        sortOrder: 5,
        createdAt: new Date()
      }
    ]
  }
] 