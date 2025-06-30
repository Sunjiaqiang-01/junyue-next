/**
 * 图片路径处理工具
 * 解决中文路径和特殊字符问题
 */

/**
 * 对图片路径进行URL编码，保留路径分隔符
 * @param path 原始图片路径
 * @returns 编码后的路径
 */
export function encodeImagePath(path: string): string {
  if (!path) return '';
  
  // 如果路径已经是URL形式则直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 处理绝对路径
  let isAbsolutePath = path.startsWith('/');
  if (isAbsolutePath) {
    path = path.substring(1);
  }
  
  // 分割路径，保留/字符
  const segments = path.split('/');
  
  // 编码每个路径段（排除空段）
  const encodedSegments = segments.map(segment => 
    segment ? encodeURIComponent(segment) : ''
  );
  
  // 重新组合路径
  let result = encodedSegments.join('/');
  
  // 恢复前导斜线
  if (isAbsolutePath) {
    result = '/' + result;
  }
  
  // 添加随机参数以防止缓存问题
  if (result.includes('?')) {
    result += '&v=' + Date.now();
  } else {
    result += '?v=' + Date.now();
  }
  
  // 调试输出
  console.log(`Image path encoded: ${path} -> ${result}`);
  
  return result;
}

/**
 * 创建图片加载错误处理的包装函数
 * @param fallbackImage 备用图片路径
 * @returns 处理函数
 */
export function handleImageError(fallbackImage: string = '/assets/image-placeholder.png') {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    console.error(`Image load error: ${img.src}`);
    img.src = fallbackImage;
    img.onerror = null; // 防止循环错误
  };
}

/**
 * 检查路径是否为有效的图片URL
 * @param path 图片路径
 * @returns 布尔值
 */
export function isValidImagePath(path: string): boolean {
  if (!path) return false;
  
  // 检查常见图片扩展名
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const lowercasePath = path.toLowerCase();
  
  return validExtensions.some(ext => lowercasePath.endsWith(ext));
}

/**
 * 获取安全的图片路径
 * @param path 原始路径
 * @param fallbackImage 备用图片
 * @returns 处理后的路径
 */
export function getSafeImagePath(path: string, fallbackImage: string = '/assets/image-placeholder.png'): string {
  if (!path || !isValidImagePath(path)) {
    console.warn(`Invalid image path: ${path}, using fallback`);
    return fallbackImage;
  }
  
  return encodeImagePath(path);
}
