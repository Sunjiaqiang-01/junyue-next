/**
 * 城市主题色工具函数
 */

export type CityType = 'nanjing' | 'suzhou' | 'hangzhou' | 'wuhan' | 'zhengzhou' | string;

/**
 * 获取城市主题色
 * @param city 城市代码
 * @returns 返回对应城市的主题色
 */
export function getCityThemeColor(city: CityType): string {
  const cityColors: Record<string, string> = {
    nanjing: '#D4AF37',    // 金陵金
    suzhou: '#38A169',     // 园林绿
    hangzhou: '#3182CE',   // 西湖蓝
    wuhan: '#ED64A6',      // 樱花粉
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
    { key: 'hangzhou', name: '杭州', color: getCityThemeColor('hangzhou') },
    { key: 'wuhan', name: '武汉', color: getCityThemeColor('wuhan') },
    { key: 'zhengzhou', name: '郑州', color: getCityThemeColor('zhengzhou') },
  ];
} 