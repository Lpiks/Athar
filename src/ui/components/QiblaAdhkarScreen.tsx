import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { THEME } from '../theme';
import { ADHKAR_LIST, DhikrItem } from '../../core/adhkar/adhkarData';
import { AtharAstronomicalSuite } from '../../core/astronomy';

export const QiblaAdhkarScreen: React.FC = () => {
  // Active Category: morning | evening | after_prayer | sleep
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep'>('morning');

  // Adhkar Counters Map (id -> currentCount)
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Compute Qibla for Algiers (or device coords)
  const qibla = AtharAstronomicalSuite.getQibla(36.7538, 3.0588);
  const qiblaAngle = qibla.bearingDegrees;
  const qiblaDistanceKm = Math.round(qibla.distanceKm);

  const incrementCount = (item: DhikrItem) => {
    setCounts((prev) => {
      const current = prev[item.id] || 0;
      if (current >= item.targetCount) {
        return { ...prev, [item.id]: 0 }; // reset on overflow
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
          borderColor: THEME.colors.goldBorder,
          borderWidth: 1,
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          ...THEME.shadows.card,
        }}
        className="items-center"
      >
        <Text style={{ color: THEME.colors.textSecondary }} className="text-xs font-semibold mb-1">
          اتجاه القبلة المشرفة (الكعبة المكرمة)
        </Text>

        <Text style={{ color: THEME.colors.goldLight }} className="text-2xl font-bold font-uthmani mb-3">
          مكة المكرمة · {qiblaAngle.toFixed(1)}°
        </Text>

        {/* Visual Compass Needle & Dial */}
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: THEME.colors.surfaceElevated,
            borderColor: THEME.colors.gold,
            borderWidth: 2,
            alignItems: 'center',
            justifyContent: 'center',
            marginVertical: 10,
            position: 'relative',
          }}
        >
          {/* North Marker */}
          <Text style={{ position: 'absolute', top: 6, color: '#EF4444', fontWeight: 'bold', fontSize: 11 }}>
            N
          </Text>

          {/* Compass Needle pointing to Mecca */}
          <View
            style={{
              width: 4,
              height: 100,
              backgroundColor: 'transparent',
              alignItems: 'center',
              transform: [{ rotate: `${qiblaAngle}deg` }],
            }}
          >
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderBottomWidth: 35,
                borderStyle: 'solid',
                backgroundColor: 'transparent',
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: THEME.colors.gold,
              }}
            />
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.gold, marginTop: 10 }} />
          </View>

          {/* Center Kaaba Icon Badge */}
          <View
            style={{
              position: 'absolute',
              backgroundColor: '#000',
              borderColor: THEME.colors.gold,
              borderWidth: 1,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: THEME.colors.gold, fontSize: 10, fontWeight: 'bold' }}>🕋 القبلة</Text>
          </View>
        </View>

        <Text style={{ color: THEME.colors.textMuted }} className="text-[11px] text-center mt-2">
          المسافة المباشرة: ~{qiblaDistanceKm} كم · حساب دقيق بالدائرة العظمى (Great-Circle Bearing)
        </Text>
      </View>

      {/* Adhkar Section Header */}
      <View className="mb-3">
        <Text style={{ color: THEME.colors.textPrimary }} className="text-base font-bold mb-3 px-1">
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
                  borderRadius: 14,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? '#000' : THEME.colors.textSecondary,
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontSize: 12,
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Dhikr Cards List */}
      {currentList.map((item) => {
        const count = counts[item.id] || 0;
        const isCompleted = count >= item.targetCount;

        return (
          <View
            key={item.id}
            style={{
              backgroundColor: THEME.colors.surface,
              borderColor: isCompleted ? THEME.colors.emeraldBorder : THEME.colors.cardBorder,
              borderWidth: 1,
              borderRadius: 20,
              padding: 18,
              marginBottom: 12,
              ...THEME.shadows.card,
            }}
          >
            {/* Arabic Dhikr Text */}
            <Text
              style={{
                color: THEME.colors.textPrimary,
                fontSize: 16,
                lineHeight: 32,
                textAlign: 'right',
                writingDirection: 'rtl',
                marginBottom: 10,
              }}
              className="font-uthmani"
            >
              {item.arabic}
            </Text>

            {/* Virtue & Reward Note */}
            <View
              style={{ backgroundColor: THEME.colors.surfaceElevated }}
              className="p-3 rounded-xl mb-4 border border-white/5"
            >
              <Text style={{ color: THEME.colors.goldLight }} className="text-xs text-right">
                ✨ {item.rewardAr}
              </Text>
            </View>

            {/* Bottom Row: Counter & Progress */}
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Text style={{ color: THEME.colors.textMuted }} className="text-xs">
                  العدد المطلوب:{' '}
                </Text>
                <Text style={{ color: THEME.colors.gold, fontWeight: 'bold', fontSize: 13 }}>
                  {item.targetCount}
                </Text>
              </View>

              {/* Tap to Count Button */}
              <TouchableOpacity
                onPress={() => incrementCount(item)}
                style={{
                  backgroundColor: isCompleted ? THEME.colors.emerald : THEME.colors.goldGlass,
                  borderColor: isCompleted ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
                  borderWidth: 1.5,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: isCompleted ? '#FFF' : THEME.colors.goldLight,
                    fontWeight: 'bold',
                    fontSize: 14,
                  }}
                >
                  {isCompleted ? 'تم الإنجاز ✓' : `سبّح (${count} / ${item.targetCount})`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};
