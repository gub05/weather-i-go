// components/satellite-map-android.tsx
// Optimized satellite map component for Android with memory management

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform, AppState, PanResponder } from 'react-native';
import { initializeSatelliteImagery, getSatelliteData } from '@/api/satelliteImagery';
import { useTheme } from "@/context/theme-context";
import { Colors } from "@/constants/theme";

// Define Region interface for type safety
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Conditionally import MapView only on native platforms
let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    PROVIDER_GOOGLE = RNMaps.PROVIDER_GOOGLE;
    Marker = RNMaps.Marker;
  } catch (error) {
    console.warn('React Native Maps not available on this platform');
  }
}

interface SatelliteMapProps {
  onLocationSelect?: (latitude: number, longitude: number) => void;
  selectedDate?: Date;
  weatherCondition?: string | null;
  tempRange?: { min: number; max: number };
}

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

export default function SatelliteMapAndroid({ 
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
  const [isDragging, setIsDragging] = useState(false);
  const [tempRegion, setTempRegion] = useState<Region | null>(null);
  
  // Memory and performance management
  const mapRef = useRef<any>(null);
  const rateLimiter = useRef(new RateLimiter());
  const mounted = useRef(true);
  const dataCache = useRef(new Map<string, any>());

  // Pan responder for real-time visual feedback during dragging
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only start pan for movements larger than threshold to avoid conflicts with taps
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        // Store current region as temp for real-time updates
        setTempRegion(region);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!tempRegion) return;
        
        // Calculate movement based on gesture state
        const { dx, dy } = gestureState;
        
        // Convert pixel movement to lat/lng delta with reduced sensitivity
        const sensitivity = 0.0001; // Much smaller sensitivity for mobile
        const latDelta = dy * sensitivity;
        const lngDelta = -dx * sensitivity; // Negative to match natural movement
        
        // Apply movement immediately for smooth visual feedback
        const newRegion = {
          ...tempRegion,
          latitude: Math.max(-85, Math.min(85, tempRegion.latitude + latDelta)),
          longitude: Math.max(-180, Math.min(180, tempRegion.longitude + lngDelta)),
        };
        
        // Update region in real-time for immediate visual feedback
        setRegion(newRegion);
      },
      onPanResponderRelease: () => {
        setTimeout(() => setIsDragging(false), 150);
        setTempRegion(null);
      },
    })
  ).current;

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
        setErrorMessage(null);
        const result = await initializeSatelliteImagery();
        if (!mounted.current) return;
        
        if (result.status === 'success') {
          setServiceStatus(`✅ ${result.provider} connected`);
        } else {
          setServiceStatus(`⚠️ ${result.message || 'Limited connectivity'}`);
        }
      } catch (error) {
        if (!mounted.current) return;
        setServiceStatus('❌ Satellite service unavailable');
        setErrorMessage('Unable to connect to satellite services');
      }
    };
    
    initializeService();
  }, []);

  const generateCacheKey = (lat: number, lng: number, date?: Date): string => {
    const dateStr = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `${lat.toFixed(4)}_${lng.toFixed(4)}_${dateStr}`;
  };

  const handleMapPress = useCallback(async (event: any) => {
    if (!mounted.current || isLoading || isDragging) return; // Don't process taps during dragging
    
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

  const handleWebLocationClick = useCallback(() => {
    // Simulate location selection for web
    const mockLat = 37.7749 + (Math.random() - 0.5) * 0.1;
    const mockLng = -122.4194 + (Math.random() - 0.5) * 0.1;
    
    setSelectedLocation({ latitude: mockLat, longitude: mockLng });
    
    if (onLocationSelect) {
      onLocationSelect(mockLat, mockLng);
    }

    // Generate mock satellite data
    getSatelliteData(mockLat, mockLng, selectedDate).then(data => {
      if (mounted.current) {
        setSatelliteData(data);
      }
    }).catch(error => {
      console.error('Error generating mock data:', error);
    });
  }, [onLocationSelect, selectedDate]);

  // Optimized region change handler with debouncing
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    if (mounted.current) {
      setRegion(newRegion);
    }
  }, []);

  // Check if we're on web
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    // Web fallback component
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.statusBanner, { backgroundColor: theme === 'dark' ? '#2b2b2b' : '#e8f5e8' }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>{serviceStatus}</Text>
        </View>
        
        <View style={[styles.webFallback, { 
          borderColor: colors.tint,
          backgroundColor: theme === 'dark' ? '#1e1f20' : '#f9f9f9'
        }]}>
          <Text style={[styles.webFallbackTitle, { color: colors.text }]}>🛰️ Satellite Map</Text>
          <Text style={[styles.webFallbackText, { color: colors.text }]}>
            Interactive satellite map available on mobile devices
          </Text>
          
          <TouchableOpacity
            style={[styles.webButton, { 
              backgroundColor: colors.tint,
              opacity: isLoading ? 0.6 : 1 
            }]}
            onPress={handleWebLocationClick}
            disabled={isLoading}
          >
            <Text style={styles.webButtonText}>
              {isLoading ? '⏳ Loading...' : '📍 Simulate Location Selection'}
            </Text>
          </TouchableOpacity>

          {errorMessage && (
            <Text style={[styles.webFallbackText, { color: '#f44336', marginTop: 16 }]}>
              ⚠️ {errorMessage}
            </Text>
          )}

          {weatherCondition && (
            <Text style={[styles.webFallbackText, { marginTop: 16, color: colors.text }]}>
              Weather: {weatherCondition}
            </Text>
          )}
          {tempRange && (
            <Text style={[styles.webFallbackText, { color: colors.text }]}>
              Temperature: {tempRange.min}°C - {tempRange.max}°C
            </Text>
          )}
          {selectedLocation && (
            <Text style={[styles.webFallbackText, { color: colors.text }]}>
              Location: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
            </Text>
          )}
        </View>

        {/* Info Panel for Web */}
        {satelliteData && (
          <View style={[styles.infoPanel, { backgroundColor: theme === 'dark' ? '#1e1f20' : 'white' }]}>
            <Text style={[styles.infoPanelTitle, { color: colors.text }]}>🛰️ Satellite Data</Text>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              ☁️ Cloud Cover: {satelliteData.cloudCover?.toFixed(1)}%
            </Text>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              🌡️ Surface Temp: {satelliteData.surfaceTemperature?.toFixed(1)}°C
            </Text>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              🌱 Vegetation: {satelliteData.vegetation?.toFixed(1)}%
            </Text>
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              📡 Source: {satelliteData.source}
            </Text>
          </View>
        )}
      </View>
    );
  }

  // Native map implementation
  if (!MapView) {
    return (
      <View style={[styles.container, { 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>📱 Map not available on this platform</Text>
        <Text style={[styles.statusText, { 
          fontSize: 12, 
          marginTop: 8, 
          color: theme === 'dark' ? '#aaa' : '#666' 
        }]}>
          Please ensure react-native-maps is properly configured
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { 
        backgroundColor: errorMessage ? '#ffebee' : theme === 'dark' ? '#2b2b2b' : '#e8f5e8' 
      }]}>
        <Text style={[styles.statusText, { 
          color: errorMessage ? '#c62828' : theme === 'dark' ? '#4caf50' : '#2e7d32' 
        }]}>
          {errorMessage || serviceStatus}
        </Text>
        {isLoading && (
          <Text style={[styles.statusText, { 
            fontSize: 12, 
            marginTop: 4,
            color: theme === 'dark' ? '#aaa' : '#666'
          }]}>
            ⏳ Loading satellite data...
          </Text>
        )}
      </View>

      {/* Map Controls */}
      <View style={[styles.controls, { 
        backgroundColor: theme === 'dark' ? '#1e1f20' : '#f5f5f5',
        borderBottomColor: theme === 'dark' ? '#555' : '#ddd'
      }]}>
        <TouchableOpacity 
          style={[styles.controlButton, { 
            backgroundColor: colors.tint,
            opacity: isLoading ? 0.6 : 1 
          }]} 
          onPress={toggleMapType}
          disabled={isLoading}
        >
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

      {/* Optimized Interactive Map with Real-time Dragging */}
      <View style={styles.map} {...panResponder.panHandlers}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
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
          scrollEnabled={!isDragging} // Disable scroll during pan gesture
          zoomEnabled={!isDragging} // Disable zoom during pan gesture
          // Reduce memory usage - single log only
          onMapReady={(() => {
            let hasLogged = false;
            return () => {
              if (!hasLogged && __DEV__) {
                hasLogged = true;
                console.log('Android Map ready - optimized for performance with real-time dragging');
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
      </View>

      {/* Enhanced Info Panel */}
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
            🌱 Vegetation: {satelliteData.vegetation?.toFixed(1)}%
          </Text>
          {satelliteData.humidity && (
            <Text style={[styles.infoText, { color: theme === 'dark' ? '#aaa' : '#555' }]}>
              💧 Humidity: {satelliteData.humidity?.toFixed(1)}%
            </Text>
          )}
          <Text style={[styles.infoText, { 
            fontSize: 12, 
            color: theme === 'dark' ? '#666' : '#888' 
          }]}>
            📡 {satelliteData.source} • Cached: {dataCache.current.size} items
          </Text>
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
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  webButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  webButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
  },
});