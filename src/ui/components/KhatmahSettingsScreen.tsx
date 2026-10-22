import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { THEME } from '../theme';
import { KhatmahTrackerService, KhatmahPlan } from '../../core/khatmah/khatmahTracker';
import { Prayer } from '../../core/astronomy';

export const KhatmahSettingsScreen: React.FC = () => {
  const [plan, setPlan] = useState<KhatmahPlan>(() => KhatmahTrackerService.createPlan(30, 1));

  const handleLogPage = (pages: number = 4) => {
    const updated = KhatmahTrackerService.recordPrayerReading(plan, Prayer.FAJR, pages);
    setPlan({ ...updated });
    Alert.alert('تقبل الله طاعتكم', `تم تسجيل قراءة ${pages} صفحات بنجاح. الصفحة الحالية: ${updated.currentPage}`);
  };

  const progressPercent = Math.min(100, (plan.currentPage / 604) * 100);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
      className="p-4"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Khatmah Progress Master Card */}
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
      >
        <View className="flex-row justify-between items-center mb-2">
          <View
            style={{ backgroundColor: THEME.colors.goldGlass }}
            className="px-3 py-1 rounded-full border border-amber-500/30"
          >
            <Text style={{ color: THEME.colors.goldLight }} className="text-xs font-bold">
              الختمة الذكية المتكيفة
            </Text>
          </View>

          <Text style={{ color: THEME.colors.textMuted }} className="text-xs">
            الهدف: {plan.targetDays} يوماً
          </Text>
        </View>

        <Text style={{ color: THEME.colors.textPrimary, fontFamily: THEME.fonts.arabicBold }} className="text-xl mt-2 mb-1">
          متابعة الختمة القرآنية المباركة
        </Text>

        <Text style={{ color: THEME.colors.textSecondary }} className="text-xs mb-4">
          توزيع متوازن ({plan.dailyTargetPages} صفحات يومياً · مقسمة دبر كل صلاة) لإنهاء المصحف بسكينة وبلا انقطاع.
        </Text>

        {/* Progress Bar */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text style={{ color: THEME.colors.gold }} className="text-xs font-bold font-mono">
              {progressPercent.toFixed(1)}%
            </Text>
            <Text style={{ color: THEME.colors.textSecondary }} className="text-xs">
              الصفحة {plan.currentPage} من ٦٠٤
            </Text>
          </View>

          <View
            style={{ backgroundColor: THEME.colors.surfaceElevated, height: 8, borderRadius: 4 }}
            className="overflow-hidden"
          >
            <View
              style={{
                backgroundColor: THEME.colors.gold,
                width: `${progressPercent}%`,
                height: '100%',
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        {/* Action Button: Log Reading */}
        <TouchableOpacity
          onPress={() => handleLogPage(4)}
          style={{
            backgroundColor: THEME.colors.emerald,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
            marginTop: 14,
            ...THEME.shadows.glowEmerald,
          }}
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-sm">
            تسجيل قراءة ٤ صفحات (دبر الصلاة) +
          </Text>
        </TouchableOpacity>
      </View>

      {/* Astronomical & Fiqh Configuration Card */}
      <View
        style={{
          backgroundColor: THEME.colors.surface,
          borderColor: THEME.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
          ...THEME.shadows.card,
        }}
      >
        <Text style={{ color: THEME.colors.goldLight }} className="text-base font-bold mb-3">
          الضبط والمعايير الفلكية والفقهية
        </Text>

        <View className="py-2.5 border-b border-white/5 flex-row justify-between items-center">
          <View>
            <Text style={{ color: THEME.colors.textPrimary }} className="text-sm font-semibold">
              معيار حساب الفجر والعشاء
            </Text>
            <Text style={{ color: THEME.colors.textMuted }} className="text-[11px]">
              زاوية الفجر الصادق 18.0° · زاوية العشاء 17.0°
            </Text>
          </View>
          <Text style={{ color: THEME.colors.gold }} className="text-xs font-bold">
            وزارة الشؤون الدينية (الجزائر)
          </Text>
        </View>

        <View className="py-2.5 border-b border-white/5 flex-row justify-between items-center">
          <View>
            <Text style={{ color: THEME.colors.textPrimary }} className="text-sm font-semibold">
              مذهب وقت صلاة العصر
            </Text>
            <Text style={{ color: THEME.colors.textMuted }} className="text-[11px]">
              ظل القامة المفرد (s = 1) المعتمد في المغرب العربي
            </Text>
          </View>
          <Text style={{ color: THEME.colors.gold }} className="text-xs font-bold">
            المذهب المالكي
          </Text>
        </View>

        <View className="py-2.5 flex-row justify-between items-center">
          <View>
            <Text style={{ color: THEME.colors.textPrimary }} className="text-sm font-semibold">
              منبه الأذان واختراق خمول الأندرويد
            </Text>
            <Text style={{ color: THEME.colors.textMuted }} className="text-[11px]">
              Exact Alarm (setExactAndAllowWhileIdle)
            </Text>
          </View>
          <Text style={{ color: THEME.colors.emeraldLight }} className="text-xs font-bold">
            مفعّل بنجاح ✓
          </Text>
        </View>
      </View>

      {/* Sovereign Charity Dedication Card */}
      <View
        style={{
          backgroundColor: THEME.colors.surfaceElevated,
          borderColor: THEME.colors.goldBorder,
          borderWidth: 1,
          borderRadius: 24,
          padding: 20,
          ...THEME.shadows.card,
        }}
      >
        <View className="items-center mb-2">
          <Text style={{ color: THEME.colors.goldLight }} className="text-lg font-bold font-uthmani">
            « صَدَقَةٌ جَارِيَةٌ لِوَجْهِ اللَّهِ تَعَالَى »
          </Text>
        </View>

        <Text
          style={{ color: THEME.colors.textSecondary, lineHeight: 24 }}
          className="text-xs text-center mb-3"
        >
          هذا التطبيق وُقف خالص لوجه الله تعالى. خالٍ تماماً وللأبد من أي إعلانات تجارية، وخالٍ 100% من أي برمجيات تتبع أو جمع بيانات، ومصمم ليعمل بدون إنترنت للأبد.
        </Text>

        <View className="flex-row justify-center items-center">
          <View
            style={{ backgroundColor: THEME.colors.emeraldGlass }}
            className="px-3 py-1 rounded-full border border-emerald-500/30"
          >
            <Text style={{ color: THEME.colors.emeraldLight }} className="text-[11px] font-bold">
              100% Ad-Free · 100% Offline-First · 100% Tracker-Free
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
