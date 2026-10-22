import './global.css';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  AtharAstronomicalSuite,
  PRAYER_NAMES,
  Prayer,
  PrayerTimeCalculator,
} from './src/core/astronomy';
import { ExactAlarmManager } from './src/core/alarms/alarmManager';
import { ArcOfTheDayDial } from './src/ui/components/ArcOfTheDayDial';
import { KhatmahTrackerCard } from './src/ui/components/KhatmahTrackerCard';
import { MushafReader } from './src/ui/components/MushafReader';

// Default Coordinates: Algiers, Algeria (الجزائر العاصمة)
const DEFAULT_COORDINATES = {
  latitude: 36.7538,
  longitude: 3.0588,
  cityAr: 'الجزائر العاصمة',
  cityEn: 'Algiers',
};

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'home' | 'mushaf' | 'qibla'>('home');

  // Clock tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prayerTimes = AtharAstronomicalSuite.getPrayerTimes(
    currentTime,
    DEFAULT_COORDINATES.latitude,
    DEFAULT_COORDINATES.longitude
  );

  const prayerState = PrayerTimeCalculator.getCurrentPrayerState(
    prayerTimes,
    currentTime
  );

  const qibla = AtharAstronomicalSuite.getQibla(
    DEFAULT_COORDINATES.latitude,
    DEFAULT_COORDINATES.longitude
  );

  const alarmManager = ExactAlarmManager.getInstance();

  const handleRequestBatteryExemption = () => {
    alarmManager.requestIgnoreBatteryOptimizations();
  };

  const prayersList: Array<{ key: Prayer; time: Date }> = [
    { key: Prayer.FAJR, time: prayerTimes.fajr },
    { key: Prayer.SUNRISE, time: prayerTimes.sunrise },
    { key: Prayer.DHUHR, time: prayerTimes.dhuhr },
    { key: Prayer.ASR, time: prayerTimes.asr },
    { key: Prayer.MAGHRIB, time: prayerTimes.maghrib },
    { key: Prayer.ISHA, time: prayerTimes.isha },
  ];

  return (
    <SafeAreaView className="flex-1 bg-void-pure">
      <StatusBar style="light" />

      {/* Main Container */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 60, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Sovereign Identity Bar */}
        <View className="items-center mb-5">
          <Text className="text-gold text-3xl font-bold tracking-widest">
            أَثَــر
          </Text>
          <Text className="text-spiritual-muted text-[11px] tracking-widest uppercase mt-0.5">
            ATHAR · SOVEREIGN ISLAMIC SUITE
          </Text>
          <View className="flex-row items-center mt-2 px-3 py-1 rounded-full bg-void-card border border-void-border">
            <View className="w-2 h-2 rounded-full bg-emerald-light mr-2" />
            <Text className="text-spiritual-text text-xs">
              {DEFAULT_COORDINATES.cityAr} · المعيار الجزائري (الفجر 18° · العشاء 17° · مالكي)
            </Text>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="flex-row bg-void-card p-1 rounded-2xl border border-void-border mb-5">
          <TouchableOpacity
            onPress={() => setActiveTab('home')}
            className={`flex-1 py-2 items-center rounded-xl ${
              activeTab === 'home' ? 'bg-gold' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'home' ? 'text-void-pure' : 'text-spiritual-muted'
              }`}
            >
              المواقيت والأثر
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('mushaf')}
            className={`flex-1 py-2 items-center rounded-xl ${
              activeTab === 'mushaf' ? 'bg-gold' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'mushaf' ? 'text-void-pure' : 'text-spiritual-muted'
              }`}
            >
              المصحف والتفاسير
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('qibla')}
            className={`flex-1 py-2 items-center rounded-xl ${
              activeTab === 'qibla' ? 'bg-gold' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === 'qibla' ? 'text-void-pure' : 'text-spiritual-muted'
              }`}
            >
              اتجاه القبلة
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: HOME & PRAYER ARC */}
        {activeTab === 'home' && (
          <>
            {/* The Arc of the Day Dial */}
            <ArcOfTheDayDial
              prayerTimes={prayerTimes}
              prayerState={prayerState}
              onPressAlarmSettings={handleRequestBatteryExemption}
            />

            {/* Adaptive Khatmah Tracker Card */}
            <KhatmahTrackerCard
              currentPrayer={
                prayerState.currentPrayer !== 'none'
                  ? prayerState.currentPrayer
                  : undefined
              }
            />

            {/* Daily Prayers Schedule */}
            <View className="bg-void-card border border-void-border rounded-3xl p-4 mb-6">
              <Text className="text-spiritual-muted text-xs font-semibold px-2 mb-3">
                مواقيت الصلاة اليوم · ALGIERS MALIKI STANDARD (s=1)
              </Text>

              {prayersList.map(({ key, time }) => {
                const isNext = prayerState.nextPrayer === key;
                const isCurrent = prayerState.currentPrayer === key;
                const itemBg = isNext
                  ? 'bg-emerald-deep/70 border border-emerald-light/50'
                  : isCurrent
                  ? 'bg-void-surface border border-gold/40'
                  : 'border border-transparent';

                return (
                  <View
                    key={key}
                    className={`flex-row justify-between items-center px-4 py-3.5 my-1 rounded-2xl ${itemBg}`}
                  >
                    <View className="flex-row items-center">
                      <View
                        className={`w-2 h-2 rounded-full mr-3 ${
                          isNext ? 'bg-emerald-light' : isCurrent ? 'bg-gold' : 'bg-void-border'
                        }`}
                      />
                      <Text
                        className={`text-base font-medium ${
                          isNext
                            ? 'text-emerald-light font-bold'
                            : isCurrent
                            ? 'text-gold'
                            : 'text-spiritual-text'
                        }`}
                      >
                        {PRAYER_NAMES[key].ar}
                      </Text>
                      <Text className="text-spiritual-subtle text-xs ml-2">
                        ({PRAYER_NAMES[key].en})
                      </Text>
                    </View>

                    <Text
                      className={`text-lg font-mono font-semibold ${
                        isNext
                          ? 'text-emerald-light'
                          : isCurrent
                          ? 'text-gold-light'
                          : 'text-spiritual-text'
                      }`}
                    >
                      {AtharAstronomicalSuite.formatTime24(time)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* TAB 2: MUSHAF & TAFSIR VAULT */}
        {activeTab === 'mushaf' && <MushafReader />}

        {/* TAB 3: QIBLA GEODESIC NAVIGATION */}
        {activeTab === 'qibla' && (
          <View className="bg-void-card border border-void-border rounded-3xl p-6 items-center">
            <Text className="text-gold text-lg font-bold mb-1">
              اتجاه القبلة نحو الكعبة المشرفة
            </Text>
            <Text className="text-spiritual-subtle text-xs mb-8">
              حسابات الدائرة العظمى الدقيقة (Great-Circle Spherical Azimuth)
            </Text>

            {/* Big Compass Outer Ring */}
            <View className="w-64 h-64 rounded-full border-2 border-gold/30 items-center justify-center bg-void-surface/50 mb-6 relative">
              {/* North Marker */}
              <Text className="absolute top-3 text-gold-light font-bold text-xs">
                N 0°
              </Text>
              {/* East Marker */}
              <Text className="absolute right-3 text-spiritual-subtle font-bold text-xs">
                E 90°
              </Text>
              {/* South Marker */}
              <Text className="absolute bottom-3 text-spiritual-subtle font-bold text-xs">
                S 180°
              </Text>
              {/* West Marker */}
              <Text className="absolute left-3 text-spiritual-subtle font-bold text-xs">
                W 270°
              </Text>

              {/* Center Needle Bearing Display */}
              <View className="items-center">
                <Text className="text-spiritual-muted text-[11px] uppercase tracking-wider mb-1">
                  زاوية القبلة
                </Text>
                <Text className="text-gold text-4xl font-extrabold font-mono">
                  {qibla.bearingDegrees}°
                </Text>
                <Text className="text-emerald-light text-sm font-bold mt-1">
                  {qibla.cardinalDirection} (شرق-جنوب-شرق)
                </Text>
              </View>
            </View>

            {/* Geodesic Distance */}
            <View className="w-full bg-void-surface p-4 rounded-2xl border border-void-border">
              <View className="flex-row justify-between items-center py-1">
                <Text className="text-spiritual-muted text-xs">المسافة المستقيمة نحو مكة:</Text>
                <Text className="text-spiritual-text font-mono text-sm font-semibold">
                  {qibla.distanceKm} كم
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-1 border-t border-void-border/50 mt-1">
                <Text className="text-spiritual-muted text-xs">إحداثيات الكعبة المشرفة:</Text>
                <Text className="text-spiritual-text font-mono text-xs">
                  21.4225° N, 39.8262° E
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Ongoing Charity Sacred Footer */}
        <View className="items-center mt-6 pt-4 border-t border-void-border/30">
          <Text className="text-spiritual-subtle text-[11px] text-center">
            تطبيق أَثَــر · صَدَقَةٌ جَارِيَةٌ لِوَجْهِ اللَّهِ تَعَالَى
          </Text>
          <Text className="text-spiritual-subtle text-[10px] text-center mt-0.5">
            100% خالي من الإعلانات والتتبع · 100% يعمل دون اتصال دائمًا
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
