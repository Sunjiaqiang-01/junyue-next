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
 * @returns 最终使用的缩略图路径
 */
export function getThumbnailUrl(mediaType: 'image' | 'video', thumbnailPath?: string | null): string {
  // 如果是视频类型，则始终使用统一缩略图
  if (mediaType === 'video') {
    return COMMON_VIDEO_THUMBNAIL;
  }
  
  // 如果是图片类型且有缩略图，则使用原缩略图
  if (thumbnailPath) {
    return thumbnailPath;
  }
  
  // 默认占位图片
  return '/uploads/common/placeholder.jpg';
}
