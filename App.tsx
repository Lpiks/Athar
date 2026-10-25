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
  Platform,
} from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
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
import { MosqueSilentModeManager } from './src/core/alarms/silentModeManager';
import { QuranVaultService } from './src/core/database';
import * as Notifications from 'expo-notifications';

// Screens
import { PrayerHeroCard } from './src/ui/components/PrayerHeroCard';
import { PrayerScheduleList } from './src/ui/components/PrayerScheduleList';
import { MushafScreen } from './src/ui/components/MushafScreen';
import { QiblaAdhkarScreen } from './src/ui/components/QiblaAdhkarScreen';
import { SettingsScreen } from './src/ui/components/SettingsScreen';
import { SovereignTabBar, AppTab } from './src/ui/components/SovereignTabBar';
import { SettingsService } from './src/core/settings/settingsService';

// Default Coordinates: Algiers, Algeria (الجزائر العاصمة)
const DEFAULT_COORDS = {
  latitude: 36.7538,
  longitude: 3.0588,
  cityAr: 'الجزائر العاصمة',
};

function AtharMainContent() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AppTab>('prayer');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [coords, setCoords] = useState(DEFAULT_COORDS);

  // Smooth Scroll-to-Hide Animation for Bottom Navigation Bar and Android System Buttons
  const navAnim = useRef(new Animated.Value(0)).current;
  const isNavHiddenRef = useRef(false);
  const [isNavHidden, setIsNavHidden] = useState(false);

  // Configure Android System Navigation Bar (immersive dark style)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setStyle('dark');
      } catch {}
    }
  }, []);

  const hideNav = useCallback(() => {
    if (!isNavHiddenRef.current) {
      isNavHiddenRef.current = true;
      setIsNavHidden(true);
      Animated.timing(navAnim, {
        toValue: 120,
        duration: 220,
        useNativeDriver: true,
      }).start();

      if (Platform.OS === 'android') {
        try {
          NavigationBar.setHidden(true);
        } catch {}
      }
    }
  }, [navAnim]);

  const showNav = useCallback(() => {
    if (isNavHiddenRef.current) {
      isNavHiddenRef.current = false;
      setIsNavHidden(false);
      Animated.timing(navAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();

      if (Platform.OS === 'android') {
        try {
          NavigationBar.setHidden(false);
        } catch {}
      }
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

  // Subscribe to offline user settings (Wilaya, School, Calculation)
  useEffect(() => {
    const unsub = SettingsService.getInstance().subscribe((settings) => {
      setCoords({
        latitude: settings.location.latitude,
        longitude: settings.location.longitude,
        cityAr: settings.location.cityAr,
      });
    });
    return unsub;
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

  // Automatic Mosque Silent Mode Trigger on Prayer Notification
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data;
      if (data && data.prayer && data.prayer !== 'tahajjud') {
        const currentSettings = SettingsService.getInstance().getSettings();
        if (currentSettings.mosqueSilentMode.enabled) {
          const isFridayDhuhr = new Date().getDay() === 5 && data.prayer === Prayer.DHUHR;
          const duration = isFridayDhuhr
            ? currentSettings.mosqueSilentMode.fridayDurationMinutes
            : currentSettings.mosqueSilentMode.durationMinutes;

          MosqueSilentModeManager.getInstance().activateMosqueSilence(
            duration,
            currentSettings.mosqueSilentMode.mode
          );
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
      <NavigationBar hidden={isNavHidden} style="dark" />

      {/* Top Sovereign App Header with Brand Logo (RTL Arabic Layout) */}
      <View
        style={{
          backgroundColor: THEME.colors.canvas,
          borderBottomColor: THEME.colors.cardBorder,
          borderBottomWidth: 1,
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: 10,
          paddingHorizontal: 16,
          flexDirection: 'row-reverse',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand Identity on Right Side (RTL) */}
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
          <Image
            source={require('./assets/icon.png')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              borderWidth: 1.2,
              borderColor: THEME.colors.goldBorder,
              marginLeft: 10,
            }}
            resizeMode="cover"
          />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: THEME.colors.goldLight, fontSize: 18, fontFamily: THEME.fonts.arabicBold, textAlign: 'right' }}>
              أَثَــر
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 8.5, letterSpacing: 0.5, textAlign: 'right' }}>
              ATHAR · SOVEREIGN ISLAMIC SUITE
            </Text>
          </View>
        </View>

        {/* Status Indicator on Left Side (RTL) */}
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
            onScroll={handleScroll}
          />
        )}

        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Floating Sovereign Islamic Luxury Navigation Dock */}
      <SovereignTabBar
        activeTab={activeTab}
        onTabPress={switchTab}
        translateY={navAnim}
        insets={insets}
      />
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
