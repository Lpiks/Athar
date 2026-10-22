import './global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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

  // 1-second clock heartbeat
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live deterministic prayer times
  const prayerTimes = AtharAstronomicalSuite.getPrayerTimes(
    currentTime,
    DEFAULT_COORDS.latitude,
    DEFAULT_COORDS.longitude
  );

  const prayerState = PrayerTimeCalculator.getCurrentPrayerState(
    prayerTimes,
    currentTime
  );

  // Exact alarms initialization
  useEffect(() => {
    const alarmManager = ExactAlarmManager.getInstance();
    alarmManager.scheduleUpcomingAdhans(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude);
  }, []);

  const activeCurrentPrayer = prayerState.currentPrayer === 'none' ? Prayer.FAJR : prayerState.currentPrayer;

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
            <Text style={{ color: THEME.colors.goldLight, fontWeight: 'bold', fontSize: 16 }}>
              أَ
            </Text>
          </View>
          <View>
            <Text style={{ color: THEME.colors.goldLight, fontSize: 18, fontWeight: 'bold' }}>
              أَثَــر
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 9, letterSpacing: 1 }}>
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
          <Text style={{ color: THEME.colors.emeraldLight, fontSize: 10, fontWeight: 'bold' }}>
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
              city={DEFAULT_COORDS.cityAr}
            />
            <PrayerScheduleList
              prayerTimes={prayerTimes}
              currentPrayer={activeCurrentPrayer}
            />
          </ScrollView>
        )}

        {activeTab === 'quran' && <MushafScreen />}

        {activeTab === 'qibla' && <QiblaAdhkarScreen />}

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
          paddingVertical: 10,
          paddingHorizontal: 6,
          ...THEME.shadows.card,
        }}
      >
        {/* Tab 1: Prayer */}
        <TouchableOpacity
          onPress={() => setActiveTab('prayer')}
          style={{
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: activeTab === 'prayer' ? THEME.colors.goldGlass : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, marginBottom: 2 }}>🕌</Text>
          <Text
            style={{
              color: activeTab === 'prayer' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 11,
              fontWeight: activeTab === 'prayer' ? 'bold' : 'normal',
            }}
          >
            الصلاة
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Quran */}
        <TouchableOpacity
          onPress={() => setActiveTab('quran')}
          style={{
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: activeTab === 'quran' ? THEME.colors.goldGlass : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, marginBottom: 2 }}>📖</Text>
          <Text
            style={{
              color: activeTab === 'quran' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 11,
              fontWeight: activeTab === 'quran' ? 'bold' : 'normal',
            }}
          >
            المصحف
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Qibla & Adhkar */}
        <TouchableOpacity
          onPress={() => setActiveTab('qibla')}
          style={{
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: activeTab === 'qibla' ? THEME.colors.goldGlass : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, marginBottom: 2 }}>🧭</Text>
          <Text
            style={{
              color: activeTab === 'qibla' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 11,
              fontWeight: activeTab === 'qibla' ? 'bold' : 'normal',
            }}
          >
            الأذكار
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Khatmah & Settings */}
        <TouchableOpacity
          onPress={() => setActiveTab('settings')}
          style={{
            alignItems: 'center',
            paddingVertical: 4,
            paddingHorizontal: 12,
            borderRadius: 16,
            backgroundColor: activeTab === 'settings' ? THEME.colors.goldGlass : 'transparent',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, marginBottom: 2 }}>⚙️</Text>
          <Text
            style={{
              color: activeTab === 'settings' ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontSize: 11,
              fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
            }}
          >
            الضبط
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
