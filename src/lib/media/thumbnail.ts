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
 * @param originalPath 原始文件路径
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
      
      // 目录部分(不包括文件名)
      const dirPath = pathParts.slice(0, -1).join('/');
      
      // 构建缩略图可能的路径
      const thumbPath = `${dirPath}/thumbnails/thumb_${fileName}`;
      
      // 返回可能的缩略图路径
      return thumbPath;
    }
  }
  
  // 默认占位图片
  return '/uploads/common/placeholder.jpg';
}
