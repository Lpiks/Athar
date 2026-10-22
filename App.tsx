import './global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import { THEME } from './src/ui/theme';
import {
  AtharAstronomicalSuite,
  Prayer,
  PrayerTimeCalculator,
} from './src/core/astronomy';
import { ExactAlarmManager } from './src/core/alarms/alarmManager';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('prayer');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [coords, setCoords] = useState(DEFAULT_COORDS);

  // Load authentic Quranic and Arabic calligraphy fonts
  const [fontsLoaded] = useFonts({
    AmiriRegular: require('./assets/fonts/Amiri-Regular.ttf'),
    AmiriBold: require('./assets/fonts/Amiri-Bold.ttf'),
    AmiriQuran: require('./assets/fonts/AmiriQuran-Regular.ttf'),
  });

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
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: THEME.colors.goldGlass,
            borderColor: THEME.colors.gold,
            borderWidth: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            ...THEME.shadows.glowGold,
          }}
        >
          <Text style={{ color: THEME.colors.goldLight, fontSize: 32, fontWeight: 'bold' }}>أَ</Text>
        </View>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
      <StatusBar style="light" />

      {/* Top Sovereign App Header */}
      <View
        style={{
          backgroundColor: THEME.colors.canvas,
          borderBottomColor: THEME.colors.cardBorder,
          borderBottomWidth: 1,
          paddingHorizontal: 20,
          paddingVertical: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View className="flex-row items-center">
          <View
            style={{
              backgroundColor: THEME.colors.goldGlass,
              borderColor: THEME.colors.goldBorder,
              borderWidth: 1,
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ color: THEME.colors.goldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 16 }}>
              أَ
            </Text>
          </View>
          <View>
            <Text style={{ color: THEME.colors.goldLight, fontSize: 19, fontFamily: THEME.fonts.arabicBold }}>
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
            contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
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

      {/* Bottom Floating Glassmorphic Navigation Dock */}
      <View
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: THEME.colors.surfaceGlass,
          borderColor: THEME.colors.cardBorder,
          borderWidth: 1.5,
          borderRadius: 26,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 6,
          ...THEME.shadows.card,
        }}
      >
        {/* Tab 1: Prayer */}
        <TouchableOpacity
          onPress={() => setActiveTab('prayer')}
          style={{
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: activeTab === 'prayer' ? THEME.colors.goldGlass : 'transparent',
            borderColor: activeTab === 'prayer' ? THEME.colors.goldBorder : 'transparent',
            borderWidth: activeTab === 'prayer' ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: activeTab === 'prayer' ? THEME.colors.goldLight : THEME.colors.textMuted, fontSize: 14, fontFamily: THEME.fonts.arabicBold }}>
            🕌 الصلاة
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Quran */}
        <TouchableOpacity
          onPress={() => setActiveTab('quran')}
          style={{
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: activeTab === 'quran' ? THEME.colors.goldGlass : 'transparent',
            borderColor: activeTab === 'quran' ? THEME.colors.goldBorder : 'transparent',
            borderWidth: activeTab === 'quran' ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: activeTab === 'quran' ? THEME.colors.goldLight : THEME.colors.textMuted, fontSize: 14, fontFamily: THEME.fonts.arabicBold }}>
            📖 المصحف
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Qibla & Adhkar */}
        <TouchableOpacity
          onPress={() => setActiveTab('qibla')}
          style={{
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: activeTab === 'qibla' ? THEME.colors.goldGlass : 'transparent',
            borderColor: activeTab === 'qibla' ? THEME.colors.goldBorder : 'transparent',
            borderWidth: activeTab === 'qibla' ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: activeTab === 'qibla' ? THEME.colors.goldLight : THEME.colors.textMuted, fontSize: 14, fontFamily: THEME.fonts.arabicBold }}>
            🧭 القبلة
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Khatmah & Settings */}
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={{
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 14,
            borderRadius: 18,
            backgroundColor: activeTab === 'settings' ? THEME.colors.goldGlass : 'transparent',
            borderColor: activeTab === 'settings' ? THEME.colors.goldBorder : 'transparent',
            borderWidth: activeTab === 'settings' ? 1 : 0,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: activeTab === 'settings' ? THEME.colors.goldLight : THEME.colors.textMuted, fontSize: 14, fontFamily: THEME.fonts.arabicBold }}>
            ⚙️ الختمة
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
