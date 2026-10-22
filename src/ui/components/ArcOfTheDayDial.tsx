import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  AtharAstronomicalSuite,
  CurrentPrayerState,
  NIGHT_EVENT_NAMES,
  Prayer,
  PRAYER_NAMES,
  PrayerTimesResult,
} from '../../core/astronomy';

interface Props {
  prayerTimes: PrayerTimesResult;
  prayerState: CurrentPrayerState;
  onPressAlarmSettings?: () => void;
}

export const ArcOfTheDayDial: React.FC<Props> = ({
  prayerTimes,
  prayerState,
  onPressAlarmSettings,
}) => {
  const nextPrayerNameAr =
    prayerState.nextPrayer === Prayer.FAJR
      ? 'الفجر'
      : PRAYER_NAMES[prayerState.nextPrayer]?.ar ?? '';

  const progressPercent = Math.round(prayerState.intervalProgress * 100);

  return (
    <View className="bg-void-card border border-gold-muted/30 rounded-3xl p-6 mb-6 shadow-2xl">
      {/* Top Meta Status */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center px-2.5 py-1 rounded-full bg-emerald-deep border border-emerald-light/30">
          <View className="w-2 h-2 rounded-full bg-emerald-light mr-1.5" />
          <Text className="text-emerald-light text-[11px] font-medium">
            منبه الأذان الحتمي نشط · Exact Alarm Active
          </Text>
        </View>

        {onPressAlarmSettings && (
          <TouchableOpacity
            onPress={onPressAlarmSettings}
            className="px-2 py-1 rounded-lg bg-void-surface border border-void-border"
          >
            <Text className="text-spiritual-subtle text-[11px]">إعدادات Doze</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Countdown Center */}
      <View className="items-center my-2">
        <Text className="text-spiritual-muted text-xs uppercase tracking-widest mb-1">
          الصلاة القادمة · NEXT PRAYER
        </Text>
        <Text className="text-gold-light text-4xl font-bold mb-2">
          {nextPrayerNameAr}
        </Text>
        <Text className="text-spiritual-text text-4xl font-mono font-extrabold tracking-wider my-1">
          {AtharAstronomicalSuite.formatCountdown(prayerState.remainingMs)}
        </Text>
        <Text className="text-spiritual-subtle text-xs mt-1">
          المتبقي حتى أذان {nextPrayerNameAr} بتوقيت الجزائر (UTC+1)
        </Text>
      </View>

      {/* Arc of the Day Celestial Interval Progress */}
      <View className="mt-6">
        <View className="h-2 w-full bg-void-surface rounded-full overflow-hidden">
          <View
            className="h-full bg-gradient-to-r bg-gold rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-spiritual-subtle text-xs">
            {prayerState.currentPrayer !== 'none'
              ? PRAYER_NAMES[prayerState.currentPrayer]?.ar
              : 'الليل'}
          </Text>
          <Text className="text-gold-light text-xs font-mono font-semibold">
            {progressPercent}%
          </Text>
          <Text className="text-spiritual-subtle text-xs">
            {nextPrayerNameAr}
          </Text>
        </View>
      </View>

      {/* Last Third of the Night / Tahajjud Golden Banner */}
      <View className="mt-5 pt-4 border-t border-void-border/60 flex-row justify-between items-center">
        <View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-gold mr-2" />
            <Text className="text-gold-light text-xs font-bold">
              {NIGHT_EVENT_NAMES.lastThird.ar}
            </Text>
          </View>
          <Text className="text-spiritual-subtle text-[11px] mt-0.5">
            وقت التنزل الإلهي وإجابة الدعاء
          </Text>
        </View>
        <Text className="text-gold font-mono text-base font-bold">
          {AtharAstronomicalSuite.formatTime24(prayerTimes.lastThirdOfTheNight)}
        </Text>
      </View>
    </View>
  );
};
