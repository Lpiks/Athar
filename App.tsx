import './global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // Android Full Screen Immersive Mode (Safely guarded for current & future builds)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        const navBar = require('expo-navigation-bar');
        if (navBar && typeof navBar.setVisibilityAsync === 'function') {
          navBar.setVisibilityAsync('hidden').catch(() => {});
        }
      } catch (err) {
        // ExpoNavigationBar native module not compiled into current dev APK binary yet
      }
    }
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

      {/* Top Sovereign App Header with Brand Logo (Respects System Status Bar & Camera Notch) */}
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

        {activeTab === 'quran' && <MushafScreen />}

        {activeTab === 'qibla' && (
          <QiblaAdhkarScreen
            latitude={coords.latitude}
            longitude={coords.longitude}
          />
        )}

        {activeTab === 'settings' && <KhatmahSettingsScreen />}
      </View>

      {/* Bottom Floating Glassmorphic Navigation Dock (Respects Android Gesture Bar) */}
      <View
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
          ...THEME.shadows.card,
        }}
      >
        {/* Tab 1: Prayer */}
        <TouchableOpacity
          onPress={() => setActiveTab('prayer')}
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
          onPress={() => setActiveTab('quran')}
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
          onPress={() => setActiveTab('qibla')}
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
          onPress={() => setActiveTab('settings')}
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
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AtharMainContent />
    </SafeAreaProvider>
  );
}
