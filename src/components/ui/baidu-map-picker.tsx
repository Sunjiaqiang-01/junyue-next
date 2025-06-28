'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Search, MapPin, Check } from 'lucide-react';
import { useToast } from './toast';

interface BaiduMapPickerProps {
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
    area: string;
  }) => void;
  defaultLocation?: {
    address: string;
    latitude: number;
    longitude: number;
    area: string;
  };
  className?: string;
}

// 搜索结果项接口
interface SearchResultItem {
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  area: string;
  uid?: string;
}

// 声明百度地图相关类型
declare global {
  interface Window {
    BMap: any;
    BMapLib: any;
    initBaiduMap?: () => void;
    BMAP_STATUS_SUCCESS: any;
  }
}

export function BaiduMapPicker({ onLocationSelect, defaultLocation, className }: BaiduMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [localSearch, setLocalSearch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResultItem | null>(null);
  const [currentLocation, setCurrentLocation] = useState(defaultLocation || null);
  const [isSearching, setIsSearching] = useState(false);
  const toastMethods = useToast();

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.BMap) return;

      const baiduMap = new window.BMap.Map(mapRef.current);
      const defaultPoint = defaultLocation 
        ? new window.BMap.Point(defaultLocation.longitude, defaultLocation.latitude)
        : new window.BMap.Point(118.743836, 32.035561); // 南京默认坐标

      baiduMap.centerAndZoom(defaultPoint, 15);
      baiduMap.enableScrollWheelZoom(true);
      baiduMap.addControl(new window.BMap.NavigationControl());
      baiduMap.addControl(new window.BMap.ScaleControl());

      // 添加默认标记
      if (defaultLocation) {
        const baiduMarker = new window.BMap.Marker(defaultPoint);
        baiduMap.addOverlay(baiduMarker);
        setMarker(baiduMarker);
        setCurrentLocation(defaultLocation);
      }

      // 创建LocalSearch实例
      const search = new window.BMap.LocalSearch(baiduMap, {
        renderOptions: { map: baiduMap, autoViewport: false },
        onSearchComplete: (results: any) => {
          if (search.getStatus() === window.BMAP_STATUS_SUCCESS) {
            const searchResultItems: SearchResultItem[] = [];
            
            for (let i = 0; i < results.getCurrentNumPois(); i++) {
              const poi = results.getPoi(i);
              searchResultItems.push({
                title: poi.title,
                address: poi.title,
                area: poi.address || poi.title,
                latitude: poi.point.lat,
                longitude: poi.point.lng
              });
            }
            
            setSearchResults(searchResultItems);
            setShowSearchResults(true);
            setIsSearching(false);
            
            // 自动选择第一个结果
            if (searchResultItems.length > 0) {
              setSelectedResult(searchResultItems[0]);
              updateLocation(searchResultItems[0].latitude, searchResultItems[0].longitude, searchResultItems[0].address, searchResultItems[0].area, baiduMap);
            }
          } else {
            setIsSearching(false);
            toastMethods.error('搜索失败', '请检查网络连接或重试');
          }
        }
      });

      setMap(baiduMap);
      setLocalSearch(search);
      
      // 地图点击事件
      baiduMap.addEventListener('click', (e: any) => {
        updateLocation(e.point.lat, e.point.lng, '点击位置', '用户选择的位置', baiduMap);
      });
      
      setIsLoading(false);
    };

    // 加载百度地图API
    if (typeof window !== 'undefined') {
      if (window.BMap) {
        initMap();
      } else {
        const script = document.createElement('script');
        script.src = `https://api.map.baidu.com/api?v=3.0&ak=qX0HXOj8pLLi0QdvvMpfScXdh6SllUqd&callback=initBaiduMap`;
        script.async = true;
        
        window.initBaiduMap = () => {
          initMap();
        };
        
        document.head.appendChild(script);
      }
    }

    return () => {
      if (map) {
        // 百度地图没有destroy方法，改为清空地图
        map.clearOverlays();
      }
    };
  }, [defaultLocation]);

  // 更新位置信息
  const updateLocation = (lat: number, lng: number, address: string, area: string, mapInstance: any) => {
    if (marker) {
      marker.setPosition(new window.BMap.Point(lng, lat));
    } else if (mapInstance) {
      const newMarker = new window.BMap.Marker(new window.BMap.Point(lng, lat));
      mapInstance.addOverlay(newMarker);
      setMarker(newMarker);
    }

    const newLocation = {
      address,
      area,
      latitude: lat,
      longitude: lng
    };
    
    setCurrentLocation(newLocation);
    
    if (mapInstance) {
      mapInstance.panTo(new window.BMap.Point(lng, lat));
    }
  };

  // 处理搜索
  const handleSearch = () => {
    if (!searchValue.trim() || !localSearch) {
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setShowSearchResults(false);
    
    // 使用真实的百度地图搜索
    localSearch.search(searchValue.trim());
  };

  // 选择搜索结果
  const handleSelectSearchResult = (result: SearchResultItem) => {
    if (!map) return;

    const point = new window.BMap.Point(result.longitude, result.latitude);
    
    // 清除之前的标记
    if (marker) {
      map.removeOverlay(marker);
    }

    // 添加新标记
    const newMarker = new window.BMap.Marker(point);
    map.addOverlay(newMarker);
    setMarker(newMarker);

    // 设置地图中心
    map.panTo(point);

    // 设置选中的结果
    setSelectedResult(result);
    setCurrentLocation({
      address: result.address,
      latitude: result.latitude,
      longitude: result.longitude,
      area: result.area
    });
  };

  // 确认位置选择
  const handleConfirmLocation = () => {
    if (currentLocation) {
      onLocationSelect({
        address: currentLocation.address,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        area: currentLocation.area
      });
      // 关闭搜索结果列表
      setShowSearchResults(false);
      toastMethods.success('位置已确认并更新到表单！', '新的位置信息已保存');
    }
  };

  // 获取当前位置
  const getCurrentLocation = () => {
    if (!map) return;
    
    // 使用浏览器地理位置API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const point = new window.BMap.Point(position.coords.longitude, position.coords.latitude);
          updateLocation(position.coords.latitude, position.coords.longitude, '当前位置', '您的当前位置', map);
          map.panTo(point);
        },
        () => {
          toastMethods.error('无法获取当前位置', '请手动选择位置');
        }
      );
    } else {
      toastMethods.error('浏览器不支持地理位置功能', '请手动选择位置');
    }
  };

  // 格式化地址显示
  const formatAddress = (address: string, title?: string) => {
    if (title && title !== address) {
      return {
        main: title,
        detail: address
      };
    }
    
    // 尝试分离地名和详细地址
    const parts = address.split(/[市区县]/);
    if (parts.length >= 2) {
      const cityPart = parts[0] + (address.includes('市') ? '市' : address.includes('区') ? '区' : '县');
      const detailPart = address.replace(cityPart, '');
      return {
        main: cityPart,
        detail: detailPart || address
      };
    }
    
    return {
      main: address,
      detail: ''
    };
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="p-4">
        <div className="space-y-4">
          {/* 搜索栏 */}
          <div className="flex space-x-2">
            <div className="flex-1 flex space-x-2">
              <Input
                placeholder="搜索地址或地点名称..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button type="button" onClick={handleSearch} size="sm" disabled={isSearching}>
                {isSearching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button type="button" onClick={getCurrentLocation} variant="outline" size="sm">
              <MapPin className="w-4 h-4 mr-1" />
              当前位置
            </Button>
          </div>

          {/* 搜索结果列表 */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="bg-white border rounded-lg shadow-sm max-h-60 overflow-y-auto">
              <div className="p-3 border-b bg-gray-50">
                <h4 className="font-medium text-gray-900">搜索结果</h4>
              </div>
              <div className="divide-y">
                {searchResults.map((result, index) => {
                  const addressFormat = formatAddress(result.address, result.title);
                  return (
                    <div
                      key={index}
                      className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                        selectedResult?.uid === result.uid ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{addressFormat.main}</div>
                          {addressFormat.detail && (
                            <div className="text-sm text-gray-600 mt-1">{addressFormat.detail}</div>
                          )}
                        </div>
                        {selectedResult?.uid === result.uid && (
                          <Check className="w-5 h-5 text-blue-500 ml-2 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 地图容器 */}
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-96 rounded-lg border"
              style={{ minHeight: '400px' }}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">加载地图中...</p>
                </div>
              </div>
            )}
          </div>

          {/* 当前选择的位置信息 */}
          {currentLocation && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">已选择位置：</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {(() => {
                      const addressFormat = formatAddress(currentLocation.address, selectedResult?.title);
                      return (
                        <>
                          <div className="font-medium text-gray-900">{addressFormat.main}</div>
                          {addressFormat.detail && (
                            <div className="text-gray-600">{addressFormat.detail}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            坐标：{currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <Button 
                  type="button"
                  onClick={handleConfirmLocation}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  确认位置
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            💡 提示：搜索地址后选择具体位置，或点击地图上的任意位置来选择技师位置。
          </div>
        </div>
      </div>
    </div>
  );
} 