import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { THEME } from '../theme';
import { ADHKAR_LIST, DhikrItem } from '../../core/adhkar/adhkarData';
import { AtharAstronomicalSuite } from '../../core/astronomy';

interface QiblaAdhkarScreenProps {
  latitude?: number;
  longitude?: number;
}

export const QiblaAdhkarScreen: React.FC<QiblaAdhkarScreenProps> = ({
  latitude = 36.7538,
  longitude = 3.0588,
}) => {
  // Active Category: morning | evening | after_prayer | sleep
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep'>('morning');

  // Adhkar Counters Map (id -> currentCount)
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Device Heading from Magnetometer (0° - 360° relative to Magnetic North)
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(true);

  // Compute Qibla for coordinates
  const qibla = AtharAstronomicalSuite.getQibla(latitude, longitude);
  const qiblaBearing = qibla.bearingDegrees;
  const qiblaDistanceKm = Math.round(qibla.distanceKm);

  // Real-time Magnetometer listener
  useEffect(() => {
    let subscription: any = null;

    Magnetometer.isAvailableAsync().then((available) => {
      setHasSensor(available);
      if (available) {
        Magnetometer.setUpdateInterval(80); // Smooth 12.5 FPS update
        subscription = Magnetometer.addListener((data) => {
          let { x, y } = data;
          // Calculate heading in degrees from magnetic north
          let angle = Math.atan2(-x, y) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          setHeading(angle);
        });
      }
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Needle angle relative to current phone orientation
  // If phone faces North (heading=0), needle points at qiblaBearing.
  // When phone points straight at Kaaba (heading=qiblaBearing), needle angle is 0° (straight up).
  const rawNeedleAngle = (qiblaBearing - heading + 360) % 360;
  // Normalized delta: 0 means pointing straight at Kaaba
  const isAlignedWithQibla = Math.abs(rawNeedleAngle < 180 ? rawNeedleAngle : rawNeedleAngle - 360) <= 5.0;

  const incrementCount = (item: DhikrItem) => {
    setCounts((prev) => {
      const current = prev[item.id] || 0;
      if (current >= item.targetCount) {
        return { ...prev, [item.id]: 0 }; // reset on complete
      }
      return { ...prev, [item.id]: current + 1 };
    });
  };

  const currentList = ADHKAR_LIST.filter((d) => d.category === activeCategory);

  const categories = [
    { key: 'morning', label: 'أذكار الصباح' },
    { key: 'evening', label: 'أذكار المساء' },
    { key: 'after_prayer', label: 'بعد الصلاة' },
    { key: 'sleep', label: 'أذكار النوم' },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
      className="p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Qibla Direction Master Card */}
      <View
        style={{
          backgroundColor: THEME.colors.surface,
          borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
          borderWidth: 1.5,
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          ...THEME.shadows.card,
        }}
        className="items-center"
      >
        <Text style={{ color: THEME.colors.textSecondary }} className="text-xs font-semibold mb-1">
          بوصلة القبلة المشرفة (الحرم المكي)
        </Text>

        <Text
          style={{
            color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
            fontFamily: THEME.fonts.arabicBold,
            fontSize: 22,
          }}
          className="mb-1"
        >
          {isAlignedWithQibla ? 'أنت باتجاه القبلة الآن ✓' : `مكة المكرمة · ${qiblaBearing.toFixed(1)}°`}
        </Text>

        <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }} className="mb-2">
          {hasSensor ? `زاوية الهاتف الحالية: ${heading.toFixed(0)}°` : 'وضع البوصلة الثابت (لا يوجد حساس مغناطيسي)'}
        </Text>

        {/* Dynamic Compass Needle & Dial */}
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: THEME.colors.surfaceElevated,
            borderColor: isAlignedWithQibla ? THEME.colors.emerald : THEME.colors.gold,
            borderWidth: 2.5,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 10,
            position: 'relative',
            ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : THEME.shadows.glowGold),
          }}
        >
          {/* North Marker */}
          <Text style={{ position: 'absolute', top: 6, color: '#EF4444', fontWeight: 'bold', fontSize: 11 }}>
            N
          </Text>
          <Text style={{ position: 'absolute', bottom: 6, color: THEME.colors.textMuted, fontSize: 10 }}>
            S
          </Text>
          <Text style={{ position: 'absolute', right: 8, color: THEME.colors.textMuted, fontSize: 10 }}>
            E
          </Text>
          <Text style={{ position: 'absolute', left: 8, color: THEME.colors.textMuted, fontSize: 10 }}>
            W
          </Text>

          {/* Dynamic Compass Needle pointing strictly towards Qibla */}
          <View
            style={{
              width: 6,
              height: 120,
              backgroundColor: 'transparent',
              alignItems: 'center',
              transform: [{ rotate: `${rawNeedleAngle.toFixed(1)}deg` }],
            }}
          >
            {/* North-facing Kaaba arrowhead */}
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 10,
                borderRightWidth: 10,
                borderBottomWidth: 45,
                borderStyle: 'solid',
                backgroundColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
              }}
            />
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
                marginTop: 15,
              }}
            />
          </View>

          {/* Center Kaaba Icon Badge */}
          <View
            style={{
              position: 'absolute',
              backgroundColor: '#000',
              borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
              borderWidth: 1.5,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: THEME.colors.gold, fontSize: 10, fontWeight: 'bold' }}>🕋 الكعبة</Text>
          </View>
        </View>

        <Text style={{ color: THEME.colors.textMuted }} className="text-[11px] text-center mt-2">
          المسافة المباشرة: ~{qiblaDistanceKm} كم · حساب دقيق بالدائرة العظمى (Great-Circle)
        </Text>
      </View>

      {/* Adhkar Section Header */}
      <View className="mb-3">
        <Text style={{ color: THEME.colors.textPrimary, fontFamily: THEME.fonts.arabicBold }} className="text-lg mb-3 px-1">
          حصن المسلم والأذكار المأثورة
        </Text>

        {/* Category Selector Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
          {categories.map((c) => {
            const isSelected = activeCategory === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setActiveCategory(c.key as any)}
                style={{
                  backgroundColor: isSelected ? THEME.colors.gold : THEME.colors.surface,
                  borderColor: isSelected ? THEME.colors.goldLight : THEME.colors.cardBorder,
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? '#000' : THEME.colors.textSecondary,
                    fontFamily: isSelected ? THEME.fonts.arabicBold : THEME.fonts.arabic,
                    fontSize: 13,
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Adhkar List with Interactive Tap Counters */}
      {currentList.map((dhikr) => {
        const count = counts[dhikr.id] || 0;
        const isDone = count >= dhikr.targetCount;

        return (
          <TouchableOpacity
            key={dhikr.id}
            activeOpacity={0.85}
            onPress={() => incrementCount(dhikr)}
            style={{
              backgroundColor: isDone ? 'rgba(5, 150, 105, 0.12)' : THEME.colors.surface,
              borderColor: isDone ? THEME.colors.emeraldBorder : THEME.colors.cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 16,
              marginBottom: 12,
              ...THEME.shadows.card,
            }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <View
                style={{
                  backgroundColor: isDone ? THEME.colors.emeraldDeep : THEME.colors.surfaceElevated,
                  borderColor: isDone ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: isDone ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 12,
                  }}
                >
                  {count} / {dhikr.targetCount}
                </Text>
              </View>

              {isDone && (
                <Text style={{ color: THEME.colors.emeraldLight, fontSize: 12, fontWeight: 'bold' }}>
                  اكتمل الذكر ✓
                </Text>
              )}
            </View>

            {/* Dhikr Arabic Body with authentic typography */}
            <Text
              style={{
                color: THEME.colors.textPrimary,
                fontFamily: THEME.fonts.quran,
                fontSize: 19,
                lineHeight: 38,
                textAlign: 'right',
                marginBottom: 8,
              }}
            >
              {dhikr.arabic}
            </Text>

            {/* Benefit / Reference Footnote */}
            {dhikr.rewardAr ? (
              <Text style={{ color: THEME.colors.gold, fontFamily: THEME.fonts.arabic, fontSize: 12, textAlign: 'right' }}>
                ⭐ {dhikr.rewardAr}
              </Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
