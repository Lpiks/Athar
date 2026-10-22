import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { THEME } from '../theme';
import { getHijriDate } from '../../core/astronomy/hijriDate';
import { PRAYER_NAMES, Prayer } from '../../core/astronomy';

interface PrayerHeroCardProps {
  currentPrayer: Prayer;
  nextPrayer: Prayer;
  nextPrayerTime: Date | null;
  city?: string;
  country?: string;
}

export const PrayerHeroCard: React.FC<PrayerHeroCardProps> = ({
  currentPrayer,
  nextPrayer,
  nextPrayerTime,
  city = 'الجزائر العاصمة',
  country = 'الجمهورية الجزائرية',
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [hijri, setHijri] = useState(getHijriDate());

  useEffect(() => {
    const updateCountdown = () => {
      if (!nextPrayerTime) {
        setTimeLeft('--:--:--');
        return;
      }

      const now = new Date().getTime();
      const diff = nextPrayerTime.getTime() - now;

      if (diff <= 0) {
        setTimeLeft('حان وقت الصلاة');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPrayerTime]);

  const nextPrayerNameAr = PRAYER_NAMES[nextPrayer]?.ar || 'الصلاة القادمة';
  const currentPrayerNameAr = PRAYER_NAMES[currentPrayer]?.ar || 'الوقت الحالي';

  return (
    <View
      style={{
        backgroundColor: THEME.colors.surface,
        borderColor: THEME.colors.goldBorder,
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        ...THEME.shadows.card,
      }}
      className="mb-5 overflow-hidden relative"
    >
      {/* Subtle decorative background watermarks */}
      <View
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: THEME.colors.goldGlass,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: THEME.colors.emeraldGlass,
        }}
      />

      {/* Top Header: Location & Hijri Date */}
      <View className="flex-row justify-between items-center mb-4">
        {/* Location Badge */}
        <View
          style={{
            backgroundColor: THEME.colors.surfaceElevated,
            borderColor: THEME.colors.cardBorder,
            borderWidth: 1,
          }}
          className="px-3 py-1.5 rounded-full flex-row items-center"
        >
          <View
            style={{ backgroundColor: THEME.colors.emerald }}
            className="w-2 h-2 rounded-full mr-1.5"
          />
          <Text
            style={{ color: THEME.colors.textPrimary }}
            className="text-xs font-semibold"
          >
            {city} 🇩🇿
          </Text>
        </View>

        {/* Hijri Date */}
        <Text
          style={{ color: THEME.colors.gold }}
          className="text-xs font-medium text-right"
        >
          {hijri.formattedAr}
        </Text>
      </View>

      {/* Next Prayer Focal Info */}
      <View className="items-center py-2">
        <Text
          style={{ color: THEME.colors.textSecondary }}
          className="text-xs font-medium uppercase tracking-wider mb-1"
        >
          الصلاة القادمة
        </Text>

        <Text
          style={{ color: THEME.colors.goldLight }}
          className="text-3xl font-bold mb-2 font-uthmani"
        >
          {nextPrayerNameAr}
        </Text>

        {/* Big Live Countdown Timer */}
        <View
          style={{
            backgroundColor: THEME.colors.surfaceElevated,
            borderColor: THEME.colors.goldBorder,
            borderWidth: 1,
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
          }}
          className="flex-row items-center justify-center my-2"
        >
          <Text
            style={{ color: THEME.colors.textPrimary }}
            className="text-2xl font-mono font-bold tracking-widest"
          >
            {timeLeft}
          </Text>
        </View>

        <Text
          style={{ color: THEME.colors.textMuted }}
          className="text-[11px] mt-1"
        >
          الوقت الحالي: <Text style={{ color: THEME.colors.emeraldLight }}>{currentPrayerNameAr}</Text> · المذهب المالكي (ظل القامة s=1)
        </Text>
      </View>

      {/* Footer Standards Banner */}
      <View
        style={{
          borderTopColor: THEME.colors.cardBorder,
          borderTopWidth: 1,
          marginTop: 12,
          paddingTop: 10,
        }}
        className="flex-row justify-between items-center"
      >
        <Text
          style={{ color: THEME.colors.textMuted }}
          className="text-[10px]"
        >
          معيار وزارة الشؤون الدينية والأوقاف (فجر 18° · عشاء 17°)
        </Text>
        <View
          style={{ backgroundColor: THEME.colors.emeraldGlass }}
          className="px-2 py-0.5 rounded border border-emerald-500/30"
        >
          <Text
            style={{ color: THEME.colors.emeraldLight }}
            className="text-[10px] font-bold"
          >
            دقة فلكية 100%
          </Text>
        </View>
      </View>
    </View>
  );
};
