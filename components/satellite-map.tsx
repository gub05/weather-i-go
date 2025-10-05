
// components/satellite-map.tsx
// Interactive satellite map component that works in Expo Go

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, AppState, Image, PanResponder } from 'react-native';
import { initializeSatelliteImagery, getSatelliteData } from '@/api/satelliteImagery';
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 30,
  minTimeBetweenRequests: 2000, // 2 seconds
  requestWindow: 60000, // 1 minute
};

class RateLimiter {
  private requests: number[] = [];
  private lastRequestTime: number = 0;

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check minimum time between requests
    if (now - this.lastRequestTime < RATE_LIMIT_CONFIG.minTimeBetweenRequests) {
      return false;
    }

    // Clean old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < RATE_LIMIT_CONFIG.requestWindow
    );

    // Check if we've exceeded the rate limit
    if (this.requests.length >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
      return false;
    }

    return true;
  }

  recordRequest(): void {
    const now = Date.now();
    this.requests.push(now);
    this.lastRequestTime = now;
  }

  reset(): void {
    this.requests = [];
    this.lastRequestTime = 0;
  }
}

// Define Region interface for type safety
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface SatelliteMapProps {
  onLocationSelect?: (latitude: number, longitude: number) => void;
  selectedDate?: Date;
  weatherCondition?: string | null;
  tempRange?: { min: number; max: number };
}

// Web Interactive Satellite Map Component
const WebSatelliteMap = ({
  colors,
  theme,
  serviceStatus,
  onLocationSelect,
  selectedDate,
  weatherCondition,
  tempRange,
  selectedLocation,
  setSelectedLocation,
  satelliteData,
  setSatelliteData,
  mapType,
  setMapType
}: any) => {
  const [webMapCenter, setWebMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [zoomLevel, setZoomLevel] = useState(8);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{x: number, y: number} | null>(null);
  const mapContainerRef = useRef<any>(null);

  // Pan responder for proper drag handling
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start pan for movements larger than threshold to avoid conflicts with clicks
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        const { locationX, locationY } = evt.nativeEvent;
        setLastPanPoint({ x: locationX, y: locationY });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!lastPanPoint) return;
        
        const { dx, dy } = gestureState;
        const rect = mapContainerRef.current?.getBoundingClientRect?.();
        if (!rect) return;
        
        // Reduced sensitivity for less sensitive dragging
        const sensitivity = 0.4 / Math.pow(2, zoomLevel - 8);
        const latMovement = (dy / rect.height) * 90 * sensitivity;
        const lngMovement = (dx / rect.width) * 180 * sensitivity;
        
        // Apply movement immediately for smooth visual feedback
        setWebMapCenter(prev => {
          const newLat = Math.max(-85, Math.min(85, prev.lat - latMovement));
          const newLng = Math.max(-180, Math.min(180, prev.lng - lngMovement));
          return { lat: newLat, lng: newLng };
        });
      },
      onPanResponderRelease: () => {
        setTimeout(() => setIsDragging(false), 50); // Reduced timeout for faster reset
        setLastPanPoint(null);
      },
    })
  ).current;

  const mapLayers = [
    { id: 'satellite', name: '🛰️ Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { id: 'terrain', name: '🏔️ Terrain', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}' },
    { id: 'street', name: '🗺️ Street Map', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}' },
    { id: 'modis', name: '🌍 MODIS', url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg' },
  ];

  // Calculate tile coordinates from lat/lng using Web Mercator projection
  const getTileCoordinates = (lat: number, lng: number, zoom: number) => {
    const x = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  // Convert lat/lng to pixel coordinates within the map container
  const latLngToPixel = (lat: number, lng: number, mapRect: DOMRect) => {
    const centerTile = getTileCoordinates(webMapCenter.lat, webMapCenter.lng, zoomLevel);
    const targetTile = getTileCoordinates(lat, lng, zoomLevel);
    
    const tileSize = 256;
    const mapCenterX = mapRect.width / 2;
    const mapCenterY = mapRect.height / 2;
    
    // Calculate pixel offset from center
    const pixelX = mapCenterX + ((targetTile.x - centerTile.x) * tileSize);
    const pixelY = mapCenterY + ((targetTile.y - centerTile.y) * tileSize);
    
    return { x: pixelX, y: pixelY };
  };

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number, mapRect: DOMRect) => {
    const tileSize = 256;
    const mapCenterX = mapRect.width / 2;
    const mapCenterY = mapRect.height / 2;
    
    // Calculate offset from center in tiles
    const tileOffsetX = (x - mapCenterX) / tileSize;
    const tileOffsetY = (y - mapCenterY) / tileSize;
    
    const centerTile = getTileCoordinates(webMapCenter.lat, webMapCenter.lng, zoomLevel);
    const targetTileX = centerTile.x + tileOffsetX;
    const targetTileY = centerTile.y + tileOffsetY;
    
    // Convert tile coordinates back to lat/lng
    const lng = (targetTileX / Math.pow(2, zoomLevel)) * 360 - 180;
    const n = Math.PI - 2 * Math.PI * targetTileY / Math.pow(2, zoomLevel);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    
    return { lat, lng };
  };

  // Get expanded tile grid for seamless display with improved coverage
  const getTilesForView = () => {
    const tiles: any[] = [];
    const centerTile = getTileCoordinates(webMapCenter.lat, webMapCenter.lng, zoomLevel);
    const tileSize = 256;
    
    // Calculate how many tiles we need to cover the viewport
    if (!mapContainerRef.current) return [];
    
    const mapRect = mapContainerRef.current.getBoundingClientRect();
    // Increase tile coverage to ensure map is always visible
    const tilesX = Math.ceil(mapRect.width / tileSize) + 4;
    const tilesY = Math.ceil(mapRect.height / tileSize) + 4;
    
    const startX = Math.floor(-tilesX / 2);
    const endX = Math.ceil(tilesX / 2);
    const startY = Math.floor(-tilesY / 2);
    const endY = Math.ceil(tilesY / 2);
    
    for (let dx = startX; dx <= endX; dx++) {
      for (let dy = startY; dy <= endY; dy++) {
        const tileX = centerTile.x + dx;
        const tileY = centerTile.y + dy;
        
        // Ensure tiles are within valid bounds
        if (tileX >= 0 && tileY >= 0 && tileX < Math.pow(2, zoomLevel) && tileY < Math.pow(2, zoomLevel)) {
          const currentLayer = mapLayers.find(l => l.id === mapType) || mapLayers[0];
          let tileUrl = currentLayer.url
            .replace('{z}', zoomLevel.toString())
            .replace('{x}', tileX.toString())
            .replace('{y}', tileY.toString());
            
          // Handle MODIS time parameter
          if (mapType === 'modis') {
            const today = new Date().toISOString().split('T')[0];
            tileUrl = tileUrl.replace('{time}', today);
          }
          
          tiles.push({
            url: tileUrl,
            dx: dx,
            dy: dy,
            tileX: tileX,
            tileY: tileY,
            key: `${tileX}-${tileY}-${zoomLevel}-${mapType}`
          });
        }
      }
    }
    return tiles;
  };

  const handleWebMapClick = async (event: any) => {
    try {
      // Reset dragging state immediately on click to prevent false positives
      if (isDragging) {
        setIsDragging(false);
      }
      
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Fix pin placement accuracy by using more precise coordinate calculation
      const { lat: clickLat, lng: clickLng } = pixelToLatLng(x, y, rect);
      
      // Round coordinates to prevent floating point precision issues
      const roundedLat = Math.round(clickLat * 10000) / 10000;
      const roundedLng = Math.round(clickLng * 10000) / 10000;
      
      setSelectedLocation({ latitude: roundedLat, longitude: roundedLng });
      
      if (onLocationSelect) {
        await onLocationSelect(roundedLat, roundedLng);
      }

      // Get satellite data for this location
      try {
        const { getSatelliteData } = await import('@/api/satelliteImagery');
        const data = await getSatelliteData(roundedLat, roundedLng, selectedDate);
        setSatelliteData(data);
      } catch (error) {
        console.error('Error getting satellite data:', error);
      }
    } catch (error) {
      console.error('Error in handleWebMapClick:', error);
    }
  };

  // Mouse event handlers for web with improved dragging
  const handleMouseDown = (event: any) => {
    if (Platform.OS !== 'web') return;
    setIsDragging(true);
    setLastPanPoint({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  };

  const handleMouseMove = (event: any) => {
    if (Platform.OS !== 'web' || !isDragging || !lastPanPoint || !mapContainerRef.current) return;
    
    const deltaX = event.clientX - lastPanPoint.x;
    const deltaY = event.clientY - lastPanPoint.y;
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    
    // Reduced sensitivity for less sensitive dragging
    const sensitivity = 0.3 / Math.pow(2, zoomLevel - 8);
    
    const latMovement = (deltaY / rect.height) * 90 * sensitivity;
    const lngMovement = (deltaX / rect.width) * 180 * sensitivity;
    
    // Apply movement with immediate state update for smooth dragging
    setWebMapCenter(prev => {
      const newLat = Math.max(-85, Math.min(85, prev.lat - latMovement));
      const newLng = Math.max(-180, Math.min(180, prev.lng - lngMovement));
      return { lat: newLat, lng: newLng };
    });
    
    setLastPanPoint({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    if (Platform.OS !== 'web') return;
    setTimeout(() => setIsDragging(false), 50); // Reduced timeout for faster reset
    setLastPanPoint(null);
  };

  // Add global mouse event listeners for web
  useEffect(() => {
    if (Platform.OS === 'web' && isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => handleMouseMove(event);
      const handleGlobalMouseUp = () => handleMouseUp();

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, lastPanPoint, zoomLevel]);

  const toggleMapType = () => {
    const currentIndex = mapLayers.findIndex(l => l.id === mapType);
    const nextIndex = (currentIndex + 1) % mapLayers.length;
    setMapType(mapLayers[nextIndex].id);
  };

  const getMarkerPosition = () => {
    if (!selectedLocation || !mapContainerRef.current) return { left: '50%', top: '50%' };
    
    const rect = mapContainerRef.current.getBoundingClientRect();
    const pixel = latLngToPixel(selectedLocation.latitude, selectedLocation.longitude, rect);
    
    return {
      left: `${pixel.x}px`,
      top: `${pixel.y}px`
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: theme === 'dark' ? '#2b2b2b' : '#e8f5e8' }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>{serviceStatus}</Text>
      </View>

      {/* Web Map Controls */}
      <View style={[styles.controls, { backgroundColor: theme === 'dark' ? '#1e1f20' : '#f5f5f5', borderBottomColor: theme === 'dark' ? '#555' : '#ddd' }]}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: colors.tint,
              minWidth: 120,
              paddingHorizontal: 12
            }
          ]}
          onPress={toggleMapType}
          activeOpacity={0.7}
        >
          <Text style={[styles.controlButtonText, { fontSize: 13 }]}>
            {mapLayers.find(l => l.id === mapType)?.name || '🛰️ Satellite'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[
              styles.zoomButton,
              {
                backgroundColor: theme === 'dark' ? '#2b2b2b' : '#fff',
                borderWidth: 1,
                borderColor: theme === 'dark' ? '#555' : '#ddd'
              }
            ]}
            onPress={() => setZoomLevel(Math.min(18, zoomLevel + 1))}
            activeOpacity={0.7}
          >
            <Text style={[styles.zoomButtonText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.zoomButton,
              {
                backgroundColor: theme === 'dark' ? '#2b2b2b' : '#fff',
                borderWidth: 1,
                borderColor: theme === 'dark' ? '#555' : '#ddd'
              }
            ]}
            onPress={() => setZoomLevel(Math.max(3, zoomLevel - 1))}
            activeOpacity={0.7}
          >
            <Text style={[styles.zoomButtonText, { color: colors.text }]}>-</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme === 'dark' ? '#444' : '#ddd',
              marginLeft: 10,
              minWidth: 44,
              borderWidth: 1,
              borderColor: theme === 'dark' ? '#555' : '#bbb'
            }
          ]}
          onPress={() => {
            setWebMapCenter({ lat: 37.7749, lng: -122.4194 });
            setZoomLevel(8);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.controlButtonText, { color: colors.text, fontSize: 16 }]}>🏠</Text>
        </TouchableOpacity>
        
        {selectedLocation && (
          <View style={styles.locationInfo}>
            <Text style={[styles.locationText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
              📍 {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Real Satellite Map */}
      <View
        ref={mapContainerRef}
        style={[styles.webMapContainer, { backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f0f0f0' }]}
        {...(Platform.OS === 'web' ? {
          onMouseDown: handleMouseDown,
        } : panResponder.panHandlers)}
      >
        <TouchableOpacity
          style={styles.mapTileContainer}
          onPress={handleWebMapClick}
          activeOpacity={1}
        >
          {/* Satellite Tiles */}
          {getTilesForView().map((tile) => {
            const tileSize = 256;
            const mapRect = mapContainerRef.current?.getBoundingClientRect();
            const centerX = mapRect ? mapRect.width / 2 : 400;
            const centerY = mapRect ? mapRect.height / 2 : 300;
            
            return (
              <View
                key={tile.key}
                style={[
                  styles.mapTile,
                  {
                    left: centerX + (tile.dx * tileSize) - tileSize/2,
                    top: centerY + (tile.dy * tileSize) - tileSize/2,
                    width: tileSize,
                    height: tileSize,
                  }
                ]}
              >
              <Image
                source={{ uri: tile.url }}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: theme === 'dark' ? '#2a2a2a' : '#f0f0f0'
                }}
                resizeMode="cover"
                onLoad={() => {
                  // Tile loaded successfully
                }}
                onError={() => {
                  // Fallback handled by React Native Image component
                  if (__DEV__) {
                    console.warn('Failed to load tile:', tile.url);
                  }
                }}
                defaultSource={undefined}
                fadeDuration={0}
              />
              </View>
            );
          })}
        </TouchableOpacity>

        {/* Overlay Information */}
        <View style={styles.mapOverlayInfo}>
          <Text style={[styles.mapOverlayText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
            🛰️ Live Satellite View
          </Text>
          <Text style={[styles.mapInstructions, { color: theme === 'dark' ? '#ccc' : '#666' }]}>
            Click to pin • Drag to pan • Zoom: {zoomLevel}
          </Text>
          <Text style={[styles.mapInstructions, { color: theme === 'dark' ? '#ccc' : '#666', fontSize: 12 }]}>
            Lat: {webMapCenter.lat.toFixed(4)}, Lng: {webMapCenter.lng.toFixed(4)}
          </Text>
        </View>

        {/* Weather condition overlay */}
        {weatherCondition && (
          <View style={[styles.weatherOverlay, { backgroundColor: colors.tint + '20' }]}>
            <Text style={[styles.weatherOverlayText, { color: colors.tint }]}>
              {weatherCondition === 'Sunny' ? '☀️' :
               weatherCondition === 'Cloudy' ? '☁️' :
               weatherCondition === 'Rainy' ? '🌧️' :
               weatherCondition === 'Stormy' ? '⛈️' : '🌤️'}
            </Text>
          </View>
        )}

        {/* Selected location marker with logo */}
        {selectedLocation && (() => {
          const mapRect = mapContainerRef.current?.getBoundingClientRect?.();
          if (!mapRect) return null;
          
          const pixel = latLngToPixel(selectedLocation.latitude, selectedLocation.longitude, mapRect);
          
          return (
            <View key="location-marker" style={[styles.locationMarker, {
              left: pixel.x,
              top: pixel.y,
              backgroundColor: 'transparent'
            }]}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.markerLogo}
                resizeMode="contain"
              />
            </View>
          );
        })()}
      </View>

      {/* Enhanced Satellite Data Panel */}
      {satelliteData && (
        <View style={[styles.infoPanel, { backgroundColor: theme === 'dark' ? '#1e1f20' : 'white' }]}>
          <Text style={[styles.infoPanelTitle, { color: colors.text }]}>🛰️ Satellite Analysis</Text>
          
          <View style={styles.dataRow}>
            <View style={styles.dataRow}>
              <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
                ☁️ Cloud Cover: {satelliteData.cloudCover?.toFixed(1)}%{' '}
                <Text style={[styles.qualityBadge, {
                  color: satelliteData.quality === 'High' ? '#4caf50' :
                         satelliteData.quality === 'Medium' ? '#ff9800' : '#f44336'
                }]}>
                  ({satelliteData.quality})
                </Text>
              </Text>
            </View>
          </View>
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
            🌡️ Surface Temp: {satelliteData.surfaceTemperature?.toFixed(1)}°C
          </Text>
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
            🌱 Vegetation Index: {satelliteData.vegetation?.toFixed(1)}%
          </Text>
          
          {satelliteData.humidity && (
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              💧 Humidity: {satelliteData.humidity?.toFixed(1)}%
            </Text>
          )}
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#666' : '#888', fontSize: 12 }]}>
            📡 Source: {satelliteData.source}
          </Text>
          
          {satelliteData.metadata && (
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#666' : '#888', fontSize: 12 }]}>
              🌍 {satelliteData.metadata.climateZone} • {satelliteData.metadata.season} • {satelliteData.metadata.isCoastal ? 'Coastal' : 'Inland'}
            </Text>
          )}
          
          {weatherCondition && (
            <Text style={[styles.infoText, { color: colors.tint, marginTop: 8 }]}>
              🌤️ Weather: {weatherCondition}
            </Text>
          )}
          {tempRange && (
            <Text style={[styles.infoText, { color: colors.tint }]}>
              🎯 Target Temp: {tempRange.min}°C - {tempRange.max}°C
            </Text>
          )}
        </View>
      )}

      {/* Map Information */}
      <View style={[styles.mapInfo, { backgroundColor: theme === 'dark' ? '#1e1f20' : 'white' }]}>
        <Text style={[styles.mapInfoTitle, { color: colors.text }]}>🗺️ Map Information</Text>
        <Text style={[styles.mapInfoText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {'\u2022'} Click on the map to select a location
        </Text>
        <Text style={[styles.mapInfoText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {'\u2022'} Drag to pan around the map (smooth movement)
        </Text>
        <Text style={[styles.mapInfoText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {'\u2022'} Use zoom controls to change detail level
        </Text>
        <Text style={[styles.mapInfoText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {'\u2022'} Switch between satellite, terrain, and street views
        </Text>
        <Text style={[styles.mapInfoText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
          {'\u2022'} Use 🏠 button to return to default location
        </Text>
      </View>
    </View>
  );
};

// Platform-specific implementation to optimize performance
export default function SatelliteMap(props: SatelliteMapProps) {
  // On Android, use the optimized version for better performance
  if (Platform.OS === 'android') {
    const SatelliteMapAndroid = require('./satellite-map-android').default;
    return <SatelliteMapAndroid {...props} />;
  }

  // For web and iOS, use the original implementation
  return <SatelliteMapOriginal {...props} />;
}

// Original satellite map component for web and iOS
function SatelliteMapOriginal({
  onLocationSelect,
  selectedDate,
  weatherCondition,
  tempRange
}: SatelliteMapProps) {
  const { theme } = useTheme();
  const colors = theme === "dark" ? Colors.dark : Colors.light;
  
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('satellite');
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [satelliteData, setSatelliteData] = useState<any>(null);
  const [serviceStatus, setServiceStatus] = useState<string>('Initializing...');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Memory and performance management
  const mapRef = useRef<any>(null);
  const rateLimiter = useRef(new RateLimiter());
  const mounted = useRef(true);
  const dataCache = useRef(new Map<string, any>());

  // App state management for memory optimization
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background') {
        // Clear cache and reset rate limiter when app goes to background
        dataCache.current.clear();
        rateLimiter.current.reset();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      mounted.current = false;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    const initializeService = async () => {
      try {
        const result = await initializeSatelliteImagery();
        if (result.status === 'success') {
          setServiceStatus(`✅ ${result.provider} connected`);
        } else {
          setServiceStatus(`⚠️ ${result.message}`);
        }
      } catch (error) {
        setServiceStatus('❌ Satellite service unavailable');
      }
    };
    
    initializeService();
  }, []);

  const generateCacheKey = (lat: number, lng: number, date?: Date): string => {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `${lat.toFixed(4)}_${lng.toFixed(4)}_${dateStr}`;
  };

  const handleMapPress = useCallback(async (event: any) => {
    if (!mounted.current || isLoading) return;
    
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    // Check rate limiting
    if (!rateLimiter.current.canMakeRequest()) {
      Alert.alert(
        'Please Wait',
        'Too many requests. Please wait a moment before selecting another location.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedLocation({ latitude, longitude });
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Check cache first
      const cacheKey = generateCacheKey(latitude, longitude, selectedDate);
      let data = dataCache.current.get(cacheKey);
      
      if (!data) {
        // Record the request for rate limiting
        rateLimiter.current.recordRequest();
        
        // Make API call
        data = await getSatelliteData(latitude, longitude, selectedDate);
        
        if (!mounted.current) return;
        
        // Cache the result (limit cache size to prevent memory issues)
        if (dataCache.current.size > 50) {
          // Remove oldest entries
          const keys = Array.from(dataCache.current.keys());
          for (let i = 0; i < 10; i++) {
            dataCache.current.delete(keys[i]);
          }
        }
        dataCache.current.set(cacheKey, data);
      }
      
      if (!mounted.current) return;
      
      setSatelliteData(data);
      
      if (onLocationSelect) {
        onLocationSelect(latitude, longitude);
      }
      
      // Show optimized location info for mobile
      Alert.alert(
        'Location Selected',
        `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}\n` +
        `☁️ Cloud Cover: ${data.cloudCover?.toFixed(1)}%\n` +
        `🌡️ Surface Temp: ${data.surfaceTemperature?.toFixed(1)}°C`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      if (!mounted.current) return;
      console.error('Error getting satellite data:', error);
      setErrorMessage('Failed to load satellite data. Please try again.');
      Alert.alert(
        'Data Error',
        'Unable to fetch satellite data. This may be due to network issues or service limitations.',
        [{ text: 'OK' }]
      );
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [selectedDate, onLocationSelect, isLoading]);

  const toggleMapType = useCallback(() => {
    if (mapType === 'standard') {
      setMapType('satellite');
    } else if (mapType === 'satellite') {
      setMapType('hybrid');
    } else {
      setMapType('standard');
    }
  }, [mapType]);

  // Optimized region change handler with debouncing
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    if (mounted.current) {
      setRegion(newRegion);
    }
  }, []);

  // Check if we're on web or if react-native-maps is not available
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    // Enhanced Web Interactive Map Component
    return <WebSatelliteMap
      colors={colors}
      theme={theme}
      serviceStatus={serviceStatus}
      onLocationSelect={onLocationSelect}
      selectedDate={selectedDate}
      weatherCondition={weatherCondition}
      tempRange={tempRange}
      selectedLocation={selectedLocation}
      setSelectedLocation={setSelectedLocation}
      satelliteData={satelliteData}
      setSatelliteData={setSatelliteData}
      mapType={mapType}
      setMapType={setMapType}
    />;
  }

  // Native implementation with dynamic import
  const NativeMapComponent = () => {
    const [MapView, setMapView] = useState<any>(null);
    const [PROVIDER_GOOGLE, setProviderGoogle] = useState<any>(null);
    const [Marker, setMarker] = useState<any>(null);

    useEffect(() => {
      const loadMaps = async () => {
        try {
          const RNMaps = await import('react-native-maps');
          setMapView(() => RNMaps.default);
          setProviderGoogle(() => RNMaps.PROVIDER_GOOGLE);
          setMarker(() => RNMaps.Marker);
        } catch (error) {
          console.warn('Failed to load react-native-maps:', error);
        }
      };

      loadMaps();
    }, []);

    if (!MapView) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme === 'dark' ? '#1e1f20' : '#f5f5f5' }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading map...</Text>
        </View>
      );
    }

    return (
      <>
        {/* Map Controls */}
        <View style={[styles.controls, { backgroundColor: theme === 'dark' ? '#1e1f20' : '#f5f5f5', borderBottomColor: theme === 'dark' ? '#555' : '#ddd' }]}>
          <TouchableOpacity style={[styles.controlButton, { backgroundColor: colors.tint }]} onPress={toggleMapType}>
            <Text style={styles.controlButtonText}>
              {mapType === 'standard' ? '🗺️ Map' : mapType === 'satellite' ? '🛰️ Satellite' : '🌍 Hybrid'}
            </Text>
          </TouchableOpacity>
          
          {selectedLocation && (
            <View style={styles.locationInfo}>
              <Text style={[styles.locationText, { color: theme === 'dark' ? '#aaa' : '#666' }]}>
                📍 {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Interactive Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          // Memory optimization settings
          maxZoomLevel={18}
          minZoomLevel={2}
          loadingEnabled={true}
          loadingIndicatorColor={colors.tint}
          loadingBackgroundColor={theme === 'dark' ? '#1e1f20' : '#f5f5f5'}
          moveOnMarkerPress={false}
          pitchEnabled={false}
          rotateEnabled={false}
          // Performance optimizations for Android
          toolbarEnabled={false}
          cacheEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          // Reduce memory usage - prevent excessive logging
          onMapReady={(() => {
            let hasLogged = false;
            return () => {
              if (!hasLogged && __DEV__) {
                hasLogged = true;
                console.log('Map ready - optimized for iOS performance');
              }
            };
          })()}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={`Weather: ${weatherCondition || 'Unknown'} | Temp: ${tempRange?.min}°-${tempRange?.max}°C`}
              pinColor="red"
            />
          )}
        </MapView>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: errorMessage ? '#ffebee' : theme === 'dark' ? '#2b2b2b' : '#e8f5e8' }]}>
        <Text style={[styles.statusText, { color: errorMessage ? '#c62828' : theme === 'dark' ? '#4caf50' : '#2e7d32' }]}>
          {errorMessage || serviceStatus}
        </Text>
        {isLoading && (
          <Text style={[styles.statusText, { fontSize: 12, marginTop: 4 }]}>
            ⏳ Loading satellite data...
          </Text>
        )}
      </View>

      {/* Native Map Component */}
      <NativeMapComponent />

      {/* Enhanced Info Panel for Native */}
      {satelliteData && (
        <View style={[styles.infoPanel, { backgroundColor: theme === 'dark' ? '#1e1f20' : 'white' }]}>
          <Text style={[styles.infoPanelTitle, { color: colors.text }]}>🛰️ Satellite Analysis</Text>
          
          <View style={styles.dataRow}>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              ☁️ Cloud Cover: {satelliteData.cloudCover?.toFixed(1)}%{' '}
              <Text style={[styles.qualityBadge, {
                color: satelliteData.quality === 'High' ? '#4caf50' :
                       satelliteData.quality === 'Medium' ? '#ff9800' : '#f44336'
              }]}>
                ({satelliteData.quality})
              </Text>
            </Text>
          </View>
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
            🌡️ Surface Temp: {satelliteData.surfaceTemperature?.toFixed(1)}°C
          </Text>
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
            🌱 Vegetation Index: {satelliteData.vegetation?.toFixed(1)}%
          </Text>
          
          {satelliteData.humidity && (
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              💧 Humidity: {satelliteData.humidity?.toFixed(1)}%
            </Text>
          )}
          
          <Text style={[styles.infoText, { color: theme === 'dark' ? '#666' : '#888', fontSize: 12 }]}>
            📡 {satelliteData.source} • Cached: {dataCache.current.size} items
          </Text>
          
          {satelliteData.metadata && (
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#666' : '#888', fontSize: 12 }]}>
              🌍 {satelliteData.metadata.climateZone} • {satelliteData.metadata.season} • {satelliteData.metadata.isCoastal ? 'Coastal' : 'Inland'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBanner: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  controlButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  infoPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  // Web Map Styles
  zoomControls: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  zoomButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  zoomButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  webMapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  mapTileContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  mapTile: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  mapOverlayInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  mapOverlayText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#fff',
  },
  mapInstructions: {
    fontSize: 14,
    textAlign: 'left',
    marginBottom: 4,
  },
  weatherOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 8,
  },
  weatherOverlayText: {
    fontSize: 20,
  },
  locationMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -15,
    marginTop: -15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  markerText: {
    fontSize: 16,
  },
  markerLogo: {
    width: 30,
    height: 30,
  },
  mapInfo: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  mapInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mapInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  qualityBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});