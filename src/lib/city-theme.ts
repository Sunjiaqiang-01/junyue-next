/**
 * 城市主题色工具函数
 */

export type CityType = 'nanjing' | 'suzhou' | 'wuxi' | 'changzhou' | 'xuzhou' | 'nantong' | 'lianyungang' | 'huaian' | 'yancheng' | 'yangzhou' | 'zhenjiang' | 'taizhou' | 'suqian' | 'hangzhou' | 'zhengzhou' | string;

/**
 * 获取城市主题色
 * @param city 城市代码
 * @returns 返回对应城市的主题色
 */
export function getCityThemeColor(city: CityType): string {
  const cityColors: Record<string, string> = {
    nanjing: '#D4AF37',    // 金陵金
    suzhou: '#38A169',     // 园林绿
    wuxi: '#4299E1',       // 太湖蓝
    changzhou: '#ED8936',  // 龙城橙
    xuzhou: '#9F7AEA',     // 徐州紫
    nantong: '#48BB78',    // 通州绿
    lianyungang: '#0BC5EA', // 海港蓝
    huaian: '#F6AD55',     // 淮安橙
    yancheng: '#68D391',   // 盐城绿
    yangzhou: '#F6E05E',   // 扬州黄
    zhenjiang: '#FC8181',  // 镇江红
    taizhou: '#4FD1C5',    // 泰州青
    suqian: '#B794F4',     // 宿迁紫
    hangzhou: '#3182CE',   // 西湖蓝
    zhengzhou: '#ED8936',  // 黄河金
  };

  return cityColors[city] || '#1A2B5C'; // 默认返回品牌主色
}

/**
 * 获取所有城市配置
 * @returns 城市配置数组
 */
export function getAllCities() {
  return [
    { key: 'nanjing', name: '南京', color: getCityThemeColor('nanjing') },
    { key: 'suzhou', name: '苏州', color: getCityThemeColor('suzhou') },
    { key: 'wuxi', name: '无锡', color: getCityThemeColor('wuxi') },
    { key: 'changzhou', name: '常州', color: getCityThemeColor('changzhou') },
    { key: 'xuzhou', name: '徐州', color: getCityThemeColor('xuzhou') },
    { key: 'nantong', name: '南通', color: getCityThemeColor('nantong') },
    { key: 'lianyungang', name: '连云港', color: getCityThemeColor('lianyungang') },
    { key: 'huaian', name: '淮安', color: getCityThemeColor('huaian') },
    { key: 'yancheng', name: '盐城', color: getCityThemeColor('yancheng') },
    { key: 'yangzhou', name: '扬州', color: getCityThemeColor('yangzhou') },
    { key: 'zhenjiang', name: '镇江', color: getCityThemeColor('zhenjiang') },
    { key: 'taizhou', name: '泰州', color: getCityThemeColor('taizhou') },
    { key: 'suqian', name: '宿迁', color: getCityThemeColor('suqian') },
    { key: 'hangzhou', name: '杭州', color: getCityThemeColor('hangzhou') },
    { key: 'zhengzhou', name: '郑州', color: getCityThemeColor('zhengzhou') },
  ];
} 