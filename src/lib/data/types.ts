// 媒体文件类型
export interface TechnicianMedia {
  type: 'image' | 'video';
  path: string;
  thumbnail: string;
  description?: string;
  sortOrder: number;
}

// 技师相关类型
export interface Technician {
  id: string;
  nickname: string;
  age: number;
  height: number;
  weight: number;
  cities: string[];
  features: string;
  isNew: boolean;
  isActive: boolean;
  isRecommended: boolean;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
  media: TechnicianMedia[];
  createdAt: string;
  updatedAt: string;
}

// 公告相关类型
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'normal' | 'urgent';
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 客服相关类型
export interface CustomerService {
  id: string;
  city: string;
  wechatId: string;
  qrCodePath: string;
  workHours: string;
  isActive: boolean;
  updatedAt: string;
}

// 管理员类型
export interface Admin {
  username: string;
  passwordHash: string;
  lastLogin: string | null;
  loginAttempts: number;
  lockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

// JSON文件数据结构
export interface TechniciansData {
  technicians: Technician[];
}

export interface AnnouncementsData {
  announcements: Announcement[];
}

export interface CustomerServiceData {
  customerService: CustomerService[];
}

export interface AdminData {
  admin: Admin;
}

// 城市类型
export type CityType = 'nanjing' | 'suzhou' | 'hangzhou' | 'wuhan' | 'zhengzhou'

// 媒体类型
export type MediaType = 'image' | 'video'

// 公告类型
export type AnnouncementType = 'normal' | 'urgent'

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// 筛选参数
export interface TechnicianFilters {
  city?: string
  isNew?: boolean
  isRecommended?: boolean
  isActive?: boolean
  search?: string
}

// 距离计算参数
export interface LocationParams {
  latitude: number
  longitude: number
}

// 文件上传类型
export interface UploadedFile {
  filename: string
  originalname: string
  mimetype: string
  size: number
  path: string
  url: string
}

// 服务项目类型
export interface ServicePackage {
  id: number
  name: string
  price: number
  duration: number
  description: string
  features: string[]
  emoji: string
}

// 预约信息类型
export interface BookingInfo {
  technicianId: string
  servicePackage: ServicePackage
  customerInfo: {
    name?: string
    phone?: string
    wechat?: string
  }
  appointmentTime?: string
  address?: string
  notes?: string
}

// 管理员登录请求类型
export interface AdminLoginRequest {
  username: string;
  password: string;
}

// 管理员登录响应类型
export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  message?: string;
} 