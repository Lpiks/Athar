import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { THEME } from '../theme';
import { Prayer, PrayerTimesResult } from '../../core/astronomy';

interface PrayerScheduleListProps {
  prayerTimes: PrayerTimesResult;
  currentPrayer: Prayer;
  onToggleAdhan?: (prayer: Prayer) => void;
}

export const PrayerScheduleList: React.FC<PrayerScheduleListProps> = ({
  prayerTimes,
  currentPrayer,
  onToggleAdhan,
}) => {
  // Prayer tracking state for today (Fajr, Dhuhr, Asr, Maghrib, Isha)
  const [loggedPrayers, setLoggedPrayers] = useState<Record<string, boolean>>({
    [Prayer.FAJR]: false,
    [Prayer.DHUHR]: false,
    [Prayer.ASR]: false,
    [Prayer.MAGHRIB]: false,
    [Prayer.ISHA]: false,
  });

  // Alarm enabled state per prayer
  const [activeAlarms, setActiveAlarms] = useState<Record<string, boolean>>({
    [Prayer.FAJR]: true,
    [Prayer.DHUHR]: true,
    [Prayer.ASR]: true,
    [Prayer.MAGHRIB]: true,
    [Prayer.ISHA]: true,
  });

  const toggleLog = (prayer: Prayer) => {
    setLoggedPrayers((prev) => ({
      ...prev,
      [prayer]: !prev[prayer],
    }));
  };

  const toggleAlarm = (prayer: Prayer) => {
    setActiveAlarms((prev) => ({
      ...prev,
      [prayer]: !prev[prayer],
    }));
    if (onToggleAdhan) onToggleAdhan(prayer);
  };

  const formatTime = (d?: Date) => {
    if (!d) return '--:--';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const prayersSequence = [
    { key: Prayer.FAJR, time: prayerTimes.fajr, name: 'الفجر', isObligatory: true, desc: 'فجر صادق 18°' },
    { key: Prayer.SUNRISE, time: prayerTimes.sunrise, name: 'الشروق', isObligatory: false, desc: 'طلوع قرص الشمس' },
    { key: Prayer.DHUHR, time: prayerTimes.dhuhr, name: 'الظهر', isObligatory: true, desc: 'زوال الشمس عن كبد السماء' },
    { key: Prayer.ASR, time: prayerTimes.asr, name: 'العصر', isObligatory: true, desc: 'المذهب المالكي (ظل القامة)' },
    { key: Prayer.MAGHRIB, time: prayerTimes.maghrib, name: 'المغرب', isObligatory: true, desc: 'غروب كامل القرص' },
    { key: Prayer.ISHA, time: prayerTimes.isha, name: 'العشاء', isObligatory: true, desc: 'مغيب الشفق الأحمر 17°' },
    { key: 'lastThird' as any, time: prayerTimes.lastThirdOfTheNight, name: 'الثلث الأخير (قيام الليل)', isObligatory: false, desc: 'وقت التنزل الإلهي وإجابة الدعاء' },
  ];

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3 px-1">
        <Text
          style={{ color: THEME.colors.textPrimary }}
          className="text-base font-bold"
        >
          مواقيت الصلاة لليوم
        </Text>
        <Text
          style={{ color: THEME.colors.gold }}
          className="text-xs font-medium"
        >
          المواقيت محددة فلكياً
        </Text>
      </View>

      {/* Prayer Rows */}
      {prayersSequence.map((p) => {
        const time = p.time;
        const isCurrent = currentPrayer === p.key;
        const isLogged = loggedPrayers[p.key];
        const isAlarmOn = activeAlarms[p.key];

        return (
          <View
            key={p.key}
            style={{
              backgroundColor: isCurrent ? THEME.colors.surfaceElevated : THEME.colors.surface,
              borderColor: isCurrent ? THEME.colors.gold : THEME.colors.cardBorder,
              borderWidth: isCurrent ? 1.5 : 1,
              borderRadius: 18,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 8,
              ...(isCurrent ? THEME.shadows.glowGold : {}),
            }}
            className="flex-row items-center justify-between"
          >
            {/* Left Section: Checkbox / Log Button (for obligatory prayers) */}
            <View className="flex-row items-center">
              {p.isObligatory ? (
                <TouchableOpacity
                  onPress={() => toggleLog(p.key)}
                  style={{
                    backgroundColor: isLogged ? THEME.colors.emerald : THEME.colors.surfaceGlass,
                    borderColor: isLogged ? THEME.colors.emeraldLight : THEME.colors.cardBorder,
                    borderWidth: 1.5,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                  activeOpacity={0.7}
                >
                  {isLogged && (
                    <Text className="text-white text-xs font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={{ width: 28, marginRight: 12 }} />
              )}

              {/* Prayer Name & Description */}
              <View>
                <View className="flex-row items-center">
                  <Text
                    style={{
                      color: isCurrent ? THEME.colors.goldLight : THEME.colors.textPrimary,
                      fontFamily: isCurrent ? THEME.fonts.arabicBold : THEME.fonts.arabic,
                      fontSize: 18,
                    }}
                  >
                    {p.name}
                  </Text>
                  {isCurrent && (
                    <View
                      style={{ backgroundColor: THEME.colors.goldGlass }}
                      className="px-2 py-0.5 rounded-full ml-2 border border-amber-500/30"
                    >
                      <Text
                        style={{ color: THEME.colors.goldLight, fontFamily: THEME.fonts.arabicBold }}
                        className="text-[10px]"
                      >
                        الصلاة الحالية
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={{ color: THEME.colors.textMuted, fontFamily: THEME.fonts.arabic, fontSize: 11 }}
                  className="mt-0.5"
                >
                  {p.desc}
                </Text>
              </View>
            </View>

            {/* Right Section: Time & Adhan Bell Toggle */}
            <View className="flex-row items-center">
              <Text
                style={{
                  color: isCurrent ? THEME.colors.goldLight : THEME.colors.textPrimary,
                  fontWeight: 'bold',
                }}
                className="text-lg font-mono tracking-wider ml-4"
              >
                {formatTime(time)}
              </Text>

              {p.isObligatory && (
                <TouchableOpacity
                  onPress={() => toggleAlarm(p.key)}
                  style={{
                    backgroundColor: isAlarmOn ? THEME.colors.goldGlass : THEME.colors.surfaceElevated,
                    borderColor: isAlarmOn ? THEME.colors.goldBorder : THEME.colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 10,
                    marginLeft: 10,
                  }}
                  activeOpacity={0.6}
                >
                  <Text
                    style={{
                      color: isAlarmOn ? THEME.colors.gold : THEME.colors.textMuted,
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    {isAlarmOn ? 'أذان 🔔' : 'صامت 🔕'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};
