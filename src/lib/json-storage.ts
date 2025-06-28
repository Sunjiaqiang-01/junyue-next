import { promises as fs } from 'fs';
import path from 'path';

export class JsonStorage {
  private dataPath: string;
  private cache: Map<string, any> = new Map();
  
  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
  }
  
  // 读取JSON文件
  async read<T>(filename: string): Promise<T> {
    const cacheKey = filename;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const filePath = path.join(this.dataPath, filename);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache.set(cacheKey, parsed);
      return parsed;
    } catch (error) {
      // 文件不存在时返回默认结构
      const defaultData = this.getDefaultData(filename);
      await this.write(filename, defaultData);
      return defaultData;
    }
  }
  
  // 写入JSON文件
  async write(filename: string, data: any): Promise<void> {
    const filePath = path.join(this.dataPath, filename);
    await fs.mkdir(this.dataPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.cache.set(filename, data);
  }
  
  // 更新单条记录
  async update(filename: string, id: string, updateData: any): Promise<void> {
    const data = await this.read(filename) as any;
    const key = this.getArrayKey(filename);
    const items = data[key] || [];
    const index = items.findIndex((item: any) => item.id === id);
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updateData, updatedAt: new Date().toISOString() };
      await this.write(filename, data);
    } else {
      throw new Error(`Record with id ${id} not found`);
    }
  }
  
  // 删除单条记录
  async delete(filename: string, id: string): Promise<void> {
    const data = await this.read(filename) as any;
    const key = this.getArrayKey(filename);
    const items = data[key] || [];
    const filteredItems = items.filter((item: any) => item.id !== id);
    
    if (filteredItems.length === items.length) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    data[key] = filteredItems;
    await this.write(filename, data);
  }
  
  // 添加新记录
  async create(filename: string, newData: any): Promise<any> {
    const data = await this.read(filename) as any;
    const key = this.getArrayKey(filename);
    const items = data[key] || [];
    const newItem = {
      ...newData,
      id: newData.id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    await this.write(filename, data);
    return newItem;
  }
  
  // 获取单条记录
  async findById(filename: string, id: string): Promise<any> {
    const data = await this.read(filename) as any;
    const key = this.getArrayKey(filename);
    const items = data[key] || [];
    return items.find((item: any) => item.id === id);
  }
  
  // 获取所有记录
  async findAll(filename: string, filter?: (item: any) => boolean): Promise<any[]> {
    const data = await this.read(filename) as any;
    const key = this.getArrayKey(filename);
    const items = data[key] || [];
    return filter ? items.filter(filter) : items;
  }
  
  // 分页查询
  async findWithPagination(
    filename: string, 
    page: number = 1, 
    limit: number = 10,
    filter?: (item: any) => boolean
  ): Promise<{ data: any[], total: number, page: number, limit: number }> {
    const allItems = await this.findAll(filename, filter);
    const total = allItems.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = allItems.slice(startIndex, endIndex);
    
    return {
      data,
      total,
      page,
      limit
    };
  }
  
  // 清除缓存
  clearCache(): void {
    this.cache.clear();
  }
  
  // 获取默认数据结构
  private getDefaultData(filename: string): any {
    const defaults: Record<string, any> = {
      'technicians.json': { technicians: [] },
      'announcements.json': { announcements: [] },
      'customer-service.json': { customerService: [] },
      'admin.json': { 
        admin: { 
          username: 'admin', 
          passwordHash: '', 
          lastLogin: null,
          loginAttempts: 0,
          lockedUntil: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } 
      }
    };
    return defaults[filename] || {};
  }
  
  // 获取数组键名
  private getArrayKey(filename: string): string {
    const keys: Record<string, string> = {
      'technicians.json': 'technicians',
      'announcements.json': 'announcements', 
      'customer-service.json': 'customerService'
    };
    return keys[filename] || 'items';
  }
  
  // 生成唯一ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 单例模式
export const jsonStorage = new JsonStorage(); 