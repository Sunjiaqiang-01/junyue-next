/**
 * 媒体文件缩略图工具函数
 * 用于确保所有视频使用统一的缩略图
 */

// 统一的视频缩略图路径
export const COMMON_VIDEO_THUMBNAIL = '/uploads/common/video-thumbnail-v2.jpg';

/**
 * 获取媒体文件的缩略图路径
 * 如果是视频类型，则返回统一的视频缩略图
 * @param mediaType 媒体类型('image' | 'video')
 * @param thumbnailPath 原始缩略图路径
 * @param originalPath 原始图片路径，用于构建可能的缩略图路径
 * @returns 最终使用的缩略图路径
 */
export function getThumbnailUrl(mediaType: 'image' | 'video', thumbnailPath?: string | null, originalPath?: string): string {
  // 如果是视频类型，则始终使用统一缩略图
  if (mediaType === 'video') {
    return COMMON_VIDEO_THUMBNAIL;
  }
  
  // 如果是图片类型且有缩略图，则使用原缩略图
  if (thumbnailPath) {
    return thumbnailPath;
  }
  
  // 如果没有缩略图，但有原图路径，尝试构建缩略图路径
  if (originalPath) {
    // 检查原图路径是否包含文件名
    const pathParts = originalPath.split('/');
    if (pathParts.length > 0) {
      const fileName = pathParts[pathParts.length - 1];
      
      // 构建可能的缩略图路径
      // 方法1: /uploads/technicians/xiaokang/thumbnails/thumb_filename.jpg
      const dirPath = pathParts.slice(0, -1).join('/');
      const possibleThumbPath1 = `${dirPath}/thumbnails/thumb_${fileName}`;
      
      // 方法2: 替换原始路径中的目录为thumbnails子目录
      const technicianDir = pathParts.slice(0, -1).join('/');
      const possibleThumbPath2 = `${technicianDir}/thumbnails/thumb_${fileName}`;
      
      // 返回第一种构建方式的缩略图路径
      return possibleThumbPath1;
    }
  }
  
  // 如果无法构建缩略图路径，返回原图路径或默认图片
  return originalPath || '/uploads/common/no-image.jpg';
}
