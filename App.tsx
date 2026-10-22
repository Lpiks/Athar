import './global.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from './src/ui/theme';
import {
  AtharAstronomicalSuite,
  Prayer,
  PrayerTimeCalculator,
} from './src/core/astronomy';
import { ExactAlarmManager } from './src/core/alarms/alarmManager';
import { QuranVaultService } from './src/core/database';

// Screens
import { PrayerHeroCard } from './src/ui/components/PrayerHeroCard';
import { PrayerScheduleList } from './src/ui/components/PrayerScheduleList';
import { MushafScreen } from './src/ui/components/MushafScreen';
import { QiblaAdhkarScreen } from './src/ui/components/QiblaAdhkarScreen';
import { KhatmahSettingsScreen } from './src/ui/components/KhatmahSettingsScreen';

// Default Coordinates: Algiers, Algeria (الجزائر العاصمة)
const DEFAULT_COORDS = {
  latitude: 36.7538,
  longitude: 3.0588,
  cityAr: 'الجزائر العاصمة',
};

type AppTab = 'prayer' | 'quran' | 'qibla' | 'settings';

function AtharMainContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppTab>('prayer');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [coords, setCoords] = useState(DEFAULT_COORDS);

  // Smooth Scroll-to-Hide Animation for Bottom Navigation Dock
  const navAnim = useRef(new Animated.Value(0)).current;
  const isNavHiddenRef = useRef(false);

  const hideNav = useCallback(() => {
    if (!isNavHiddenRef.current) {
      isNavHiddenRef.current = true;
      Animated.timing(navAnim, {
        toValue: 120,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [navAnim]);

  const showNav = useCallback(() => {
    if (isNavHiddenRef.current) {
      isNavHiddenRef.current = false;
      Animated.timing(navAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [navAnim]);

  const lastScrollY = useRef(0);
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const diff = y - lastScrollY.current;

      if (y <= 12) {
        showNav();
      } else if (diff > 10) {
        // Scrolling down -> smoothly hide the navigation dock for full-screen reading
        hideNav();
      } else if (diff < -10) {
        // Scrolling up -> smoothly restore navigation dock
        showNav();
      }
      lastScrollY.current = y;
    },
    [hideNav, showNav]
  );

  // Tab switcher with instant nav restoration
  const switchTab = (tab: AppTab) => {
    showNav();
    setActiveTab(tab);
  };

  // Load authentic Quranic and Arabic calligraphy fonts
  const [fontsLoaded] = useFonts({
    AmiriRegular: require('./assets/fonts/Amiri-Regular.ttf'),
    AmiriBold: require('./assets/fonts/Amiri-Bold.ttf'),
    AmiriQuran: require('./assets/fonts/AmiriQuran-Regular.ttf'),
  });

  // Pre-warm Quran & Tafsir SQLite database in the background on startup
  useEffect(() => {
    QuranVaultService.getInstance().initialize().catch(() => {});
  }, []);

  // 1-second clock heartbeat
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Request & Auto-Detect Location (GPS) with seamless fallback
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const [place] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          const cityName = place?.city || place?.region || place?.subregion || 'موقعك الحالي';
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            cityAr: cityName,
          });
        }
      } catch (err) {
        // Fallback to Algiers coordinates
      }
    })();
  }, []);

  // Compute live deterministic prayer times for current location
  const prayerTimes = AtharAstronomicalSuite.getPrayerTimes(
    currentTime,
    coords.latitude,
    coords.longitude
  );

  const prayerState = PrayerTimeCalculator.getCurrentPrayerState(
    prayerTimes,
    currentTime
  );

  // Exact alarms initialization on startup
  useEffect(() => {
    const alarmManager = ExactAlarmManager.getInstance();
    alarmManager.scheduleUpcomingAdhans(coords.latitude, coords.longitude);
  }, [coords.latitude, coords.longitude]);

  const activeCurrentPrayer = prayerState.currentPrayer === 'none' ? Prayer.FAJR : prayerState.currentPrayer;

  // Render high-end sacred splash screen while fonts mount
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="light" />
        <Image
          source={require('./assets/icon.png')}
          style={{
            width: 88,
            height: 88,
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: THEME.colors.gold,
            marginBottom: 20,
            ...THEME.shadows.glowGold,
          }}
          resizeMode="cover"
        />
        <Text style={{ color: THEME.colors.goldLight, fontSize: 24, fontWeight: 'bold', letterSpacing: 2 }}>
          أَثَــر
        </Text>
        <Text style={{ color: THEME.colors.textMuted, fontSize: 11, letterSpacing: 2, marginTop: 4, marginBottom: 24 }}>
          ATHAR · SOVEREIGN ISLAMIC SUITE
        </Text>
        <ActivityIndicator color={THEME.colors.gold} size="small" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
      <StatusBar style="light" />

      {/* Top Sovereign App Header with Brand Logo */}
      <View
        style={{
          backgroundColor: THEME.colors.canvas,
          borderBottomColor: THEME.colors.cardBorder,
          borderBottomWidth: 1,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View className="flex-row items-center">
          <Image
            source={require('./assets/icon.png')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              borderWidth: 1.2,
              borderColor: THEME.colors.goldBorder,
              marginRight: 10,
            }}
            resizeMode="cover"
          />
          <View>
            <Text style={{ color: THEME.colors.goldLight, fontSize: 18, fontFamily: THEME.fonts.arabicBold }}>
              أَثَــر
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 8.5, letterSpacing: 1 }}>
              ATHAR · SOVEREIGN ISLAMIC SUITE
            </Text>
          </View>
        </View>

        {/* Status Indicator */}
        <View
          style={{
            backgroundColor: THEME.colors.emeraldGlass,
            borderColor: THEME.colors.emeraldBorder,
            borderWidth: 1,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: THEME.colors.emeraldLight, fontSize: 11, fontFamily: THEME.fonts.arabicBold }}>
            صدقة جارية 🕊️
          </Text>
        </View>
      </View>

      {/* Main Screen Content Body */}
      <View style={{ flex: 1 }}>
        {activeTab === 'prayer' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 90 }}
          >
            <PrayerHeroCard
              currentPrayer={activeCurrentPrayer}
              nextPrayer={prayerState.nextPrayer}
              nextPrayerTime={prayerState.nextPrayerTime}
              city={coords.cityAr}
            />
            <PrayerScheduleList
              prayerTimes={prayerTimes}
              currentPrayer={activeCurrentPrayer}
            />
          </ScrollView>
        )}

        {activeTab === 'quran' && <MushafScreen onScroll={handleScroll} />}

        {activeTab === 'qibla' && (
          <QiblaAdhkarScreen
            latitude={coords.latitude}
            longitude={coords.longitude}
          />
        )}

        {activeTab === 'settings' && <KhatmahSettingsScreen />}
      </View>

      {/* Bottom Floating Glassmorphic Navigation Dock with Scroll-to-Hide Animation */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: Math.max(insets.bottom, 10),
          left: 14,
          right: 14,
          height: 64,
          backgroundColor: 'rgba(5, 13, 11, 0.95)',
          borderColor: 'rgba(197, 160, 89, 0.28)',
          borderWidth: 1.2,
          borderRadius: 24,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingHorizontal: 6,
          transform: [{ translateY: navAnim }],
          ...THEME.shadows.card,
        }}
      >
        {/* Tab 1: Prayer */}
        <TouchableOpacity
          onPress={() => switchTab('prayer')}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
            borderRadius: 16,
            backgroundColor: activeTab === 'prayer' ? 'rgba(197, 160, 89, 0.14)' : 'transparent',
            borderColor: activeTab === 'prayer' ? 'rgba(197, 160, 89, 0.35)' : 'transparent',
            borderWidth: activeTab === 'prayer' ? 1 : 0,
            marginHorizontal: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'prayer' ? 'time' : 'time-outline'}
            size={20}
            color={activeTab === 'prayer' ? THEME.colors.goldLight : THEME.colors.textMuted}
          />
          <Text
            style={{
              color: activeTab === 'prayer' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 10.5,
              fontFamily: THEME.fonts.arabicBold,
              marginTop: 1,
            }}
          >
            الصلاة
          </Text>
          {activeTab === 'prayer' && (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: THEME.colors.gold,
                marginTop: 2,
              }}
            />
          )}
        </TouchableOpacity>

        {/* Tab 2: Quran */}
        <TouchableOpacity
          onPress={() => switchTab('quran')}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
            borderRadius: 16,
            backgroundColor: activeTab === 'quran' ? 'rgba(197, 160, 89, 0.14)' : 'transparent',
            borderColor: activeTab === 'quran' ? 'rgba(197, 160, 89, 0.35)' : 'transparent',
            borderWidth: activeTab === 'quran' ? 1 : 0,
            marginHorizontal: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'quran' ? 'book' : 'book-outline'}
            size={20}
            color={activeTab === 'quran' ? THEME.colors.goldLight : THEME.colors.textMuted}
          />
          <Text
            style={{
              color: activeTab === 'quran' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 10.5,
              fontFamily: THEME.fonts.arabicBold,
              marginTop: 1,
            }}
          >
            المصحف
          </Text>
          {activeTab === 'quran' && (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: THEME.colors.gold,
                marginTop: 2,
              }}
            />
          )}
        </TouchableOpacity>

        {/* Tab 3: Qibla & Adhkar */}
        <TouchableOpacity
          onPress={() => switchTab('qibla')}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
            borderRadius: 16,
            backgroundColor: activeTab === 'qibla' ? 'rgba(197, 160, 89, 0.14)' : 'transparent',
            borderColor: activeTab === 'qibla' ? 'rgba(197, 160, 89, 0.35)' : 'transparent',
            borderWidth: activeTab === 'qibla' ? 1 : 0,
            marginHorizontal: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'qibla' ? 'compass' : 'compass-outline'}
            size={20}
            color={activeTab === 'qibla' ? THEME.colors.goldLight : THEME.colors.textMuted}
          />
          <Text
            style={{
              color: activeTab === 'qibla' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 10.5,
              fontFamily: THEME.fonts.arabicBold,
              marginTop: 1,
            }}
          >
            القبلة
          </Text>
          {activeTab === 'qibla' && (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: THEME.colors.gold,
                marginTop: 2,
              }}
            />
          )}
        </TouchableOpacity>

        {/* Tab 4: Khatmah & Settings */}
        <TouchableOpacity
          onPress={() => switchTab('settings')}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 4,
            borderRadius: 16,
            backgroundColor: activeTab === 'settings' ? 'rgba(197, 160, 89, 0.14)' : 'transparent',
            borderColor: activeTab === 'settings' ? 'rgba(197, 160, 89, 0.35)' : 'transparent',
            borderWidth: activeTab === 'settings' ? 1 : 0,
            marginHorizontal: 2,
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'shield-checkmark' : 'shield-checkmark-outline'}
            size={20}
            color={activeTab === 'settings' ? THEME.colors.goldLight : THEME.colors.textMuted}
          />
          <Text
            style={{
              color: activeTab === 'settings' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 10.5,
              fontFamily: THEME.fonts.arabicBold,
              marginTop: 1,
            }}
          >
            الختمة
          </Text>
          {activeTab === 'settings' && (
            <View
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: THEME.colors.gold,
                marginTop: 2,
              }}
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics}
      style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
    >
      <AtharMainContent />
    </SafeAreaProvider>
  );
}
