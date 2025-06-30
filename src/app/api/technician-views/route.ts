import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VIEWS_FILE_PATH = path.join(process.cwd(), 'data', 'technician-views.json');

/**
 * 获取技师访问数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // day, week, month
    
    // 读取访问记录数据
    const viewsData = readViewsData();
    
    // 根据时间段筛选数据
    const filteredData = filterDataByPeriod(viewsData.views, period);
    
    // 计算每个技师的访问量
    const technicianViews = countTechnicianViews(filteredData);
    
    return NextResponse.json({ 
      success: true, 
      period,
      views: technicianViews
    });
  } catch (error) {
    console.error('Failed to get technician views:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get technician views' },
      { status: 500 }
    );
  }
}

/**
 * 记录技师访问数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.technicianId) {
      return NextResponse.json(
        { success: false, error: 'Technician ID is required' },
        { status: 400 }
      );
    }
    
    // 读取现有数据
    const viewsData = readViewsData();
    
    // 添加新的访问记录
    viewsData.views.push({
      technicianId: body.technicianId,
      timestamp: new Date().toISOString()
    });
    
    // 写入数据
    fs.writeFileSync(VIEWS_FILE_PATH, JSON.stringify(viewsData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record technician view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record technician view' },
      { status: 500 }
    );
  }
}

/**
 * 读取访问数据文件
 */
function readViewsData() {
  try {
    if (!fs.existsSync(VIEWS_FILE_PATH)) {
      return { views: [] };
    }
    
    const data = fs.readFileSync(VIEWS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read views data:', error);
    return { views: [] };
  }
}

/**
 * 根据时间段筛选数据
 */
function filterDataByPeriod(views: any[], period: string) {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = startDate.getDay() || 7;
      startDate.setDate(startDate.getDate() - day + 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setHours(0, 0, 0, 0);
  }
  
  return views.filter(view => {
    const viewDate = new Date(view.timestamp);
    return viewDate >= startDate && viewDate <= now;
  });
}

/**
 * 计算每个技师的访问量
 */
function countTechnicianViews(views: any[]) {
  const viewsCount: Record<string, number> = {};
  
  views.forEach(view => {
    const { technicianId } = view;
    viewsCount[technicianId] = (viewsCount[technicianId] || 0) + 1;
  });
  
  // 转换为排序后的数组
  return Object.entries(viewsCount)
    .map(([id, count]) => ({ id, views: count }))
    .sort((a, b) => b.views - a.views);
} 