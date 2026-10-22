import './global.css';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  AtharAstronomicalSuite,
  PRAYER_NAMES,
  NIGHT_EVENT_NAMES,
  Prayer,
  PrayerTimeCalculator,
} from './src/core/astronomy';

// Default coordinates: Algiers, Algeria (الجزائر العاصمة)
const DEFAULT_COORDINATES = {
  latitude: 36.7538,
  longitude: 3.0588,
  cityAr: 'الجزائر العاصمة',
  cityEn: 'Algiers',
};

export default function App() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update clock every second
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

  const prayersList: Array<{ key: Prayer; time: Date }> = [
    { key: Prayer.FAJR, time: prayerTimes.fajr },
    { key: Prayer.SUNRISE, time: prayerTimes.sunrise },
    { key: Prayer.DHUHR, time: prayerTimes.dhuhr },
    { key: Prayer.ASR, time: prayerTimes.asr },
    { key: Prayer.MAGHRIB, time: prayerTimes.maghrib },
    { key: Prayer.ISHA, time: prayerTimes.isha },
  ];

  const nextPrayerNameAr =
    prayerState.nextPrayer === Prayer.FAJR
      ? 'الفجر'
      : PRAYER_NAMES[prayerState.nextPrayer]?.ar ?? '';

  return (
    <SafeAreaView className="flex-1 bg-void-pure">
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Sovereign Banner */}
        <View className="items-center mb-6">
          <Text className="text-gold text-2xl font-bold tracking-widest">
            أَثَــر
          </Text>
          <Text className="text-spiritual-muted text-xs tracking-wider uppercase mt-1">
            Athar · Sovereign Islamic Suite
          </Text>
          <View className="flex-row items-center mt-2 px-3 py-1 rounded-full bg-void-card border border-void-border">
            <View className="w-2 h-2 rounded-full bg-emerald-light mr-2" />
            <Text className="text-spiritual-text text-xs">
              {DEFAULT_COORDINATES.cityAr} ({DEFAULT_COORDINATES.cityEn}) · وزارة الشؤون الدينية
            </Text>
          </View>
        </View>

        {/* The Arc of the Day Hero Dial Card */}
        <View className="bg-void-card border border-gold-muted/30 rounded-3xl p-6 mb-6 shadow-2xl">
          <View className="items-center">
            <Text className="text-spiritual-muted text-xs uppercase tracking-widest mb-1">
              الصلاة القادمة · NEXT PRAYER
            </Text>
            <Text className="text-gold-light text-3xl font-extrabold mb-1">
              {nextPrayerNameAr}
            </Text>
            <Text className="text-spiritual-text text-4xl font-mono font-bold tracking-wider my-2">
              {AtharAstronomicalSuite.formatCountdown(prayerState.remainingMs)}
            </Text>
            <Text className="text-spiritual-subtle text-xs">
              المتبقي حتى أذان {nextPrayerNameAr}
            </Text>
          </View>

          {/* Interval Progression Bar */}
          <View className="mt-5">
            <View className="h-1.5 w-full bg-void-surface rounded-full overflow-hidden">
              <View
                className="h-full bg-gold rounded-full"
                style={{ width: `${Math.round(prayerState.intervalProgress * 100)}%` }}
              />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-spiritual-subtle text-[11px]">
                {prayerState.currentPrayer !== 'none'
                  ? PRAYER_NAMES[prayerState.currentPrayer]?.ar
                  : ''}
              </Text>
              <Text className="text-gold-light text-[11px] font-mono">
                {Math.round(prayerState.intervalProgress * 100)}%
              </Text>
              <Text className="text-spiritual-subtle text-[11px]">
                {nextPrayerNameAr}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily Prayer Times List */}
        <View className="bg-void-card border border-void-border rounded-3xl p-4 mb-6">
          <Text className="text-spiritual-muted text-xs font-semibold px-2 mb-3">
            مواقيت الصلاة اليوم · MALIKI STANDARD (s=1)
          </Text>

          {prayersList.map(({ key, time }) => {
            const isNext = prayerState.nextPrayer === key;
            const isCurrent = prayerState.currentPrayer === key;
            const itemBg = isNext
              ? 'bg-emerald-deep/60 border border-emerald-light/40'
              : isCurrent
              ? 'bg-void-surface/80 border border-gold/30'
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
                      isNext ? 'text-emerald-light font-bold' : isCurrent ? 'text-gold' : 'text-spiritual-text'
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
                    isNext ? 'text-emerald-light' : isCurrent ? 'text-gold-light' : 'text-spiritual-text'
                  }`}
                >
                  {AtharAstronomicalSuite.formatTime24(time)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Night Subdivisions (Midnight & Tahajjud) */}
        <View className="bg-void-card border border-void-border rounded-3xl p-5 mb-6">
          <Text className="text-spiritual-muted text-xs font-semibold mb-3">
            أوقات قيام الليل والثلث الأخير · TAHAJJUD & NIGHT
          </Text>

          <View className="flex-row justify-between items-center py-2 border-b border-void-border/50">
            <Text className="text-spiritual-text text-sm">
              {NIGHT_EVENT_NAMES.midnight.ar}
            </Text>
            <Text className="text-spiritual-muted font-mono text-sm">
              {AtharAstronomicalSuite.formatTime24(prayerTimes.midnight)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-2.5">
            <View>
              <Text className="text-gold-light text-sm font-semibold">
                {NIGHT_EVENT_NAMES.lastThird.ar}
              </Text>
              <Text className="text-spiritual-subtle text-[11px]">
                وقت التنزل الإلهي وإجابة الدعاء
              </Text>
            </View>
            <Text className="text-gold-light font-mono text-base font-bold">
              {AtharAstronomicalSuite.formatTime24(prayerTimes.lastThirdOfTheNight)}
            </Text>
          </View>
        </View>

        {/* Qibla Direction Card */}
        <View className="bg-void-card border border-void-border rounded-3xl p-5">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-spiritual-muted text-xs uppercase tracking-wider">
                اتجاه القبلة نحو الكعبة المشرفة
              </Text>
              <Text className="text-gold text-lg font-bold mt-1">
                {qibla.bearingDegrees}° {qibla.cardinalDirection}
              </Text>
              <Text className="text-spiritual-subtle text-xs mt-0.5">
                المسافة المباشرة: {qibla.distanceKm} كم
              </Text>
            </View>
            <View className="w-14 h-14 rounded-full bg-void-surface border border-gold/40 items-center justify-center">
              <Text className="text-gold text-xs font-mono font-bold">
                {Math.round(qibla.bearingDegrees)}°
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
