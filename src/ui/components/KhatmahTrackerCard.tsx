import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  KhatmahPlan,
  KhatmahTrackerService,
} from '../../core/khatmah/khatmahTracker';
import { Prayer, PRAYER_NAMES } from '../../core/astronomy';

interface Props {
  currentPrayer?: Prayer;
}

export const KhatmahTrackerCard: React.FC<Props> = ({ currentPrayer }) => {
  const [plan, setPlan] = useState<KhatmahPlan>(() =>
    KhatmahTrackerService.createPlan(30, 1)
  );

  const prayers: Prayer[] = [
    Prayer.FAJR,
    Prayer.DHUHR,
    Prayer.ASR,
    Prayer.MAGHRIB,
    Prayer.ISHA,
  ];

  const handleTogglePrayer = (p: Prayer) => {
    const quota = plan.todayQuotas[p];
    if (quota.completed) {
      // Revert
      const updated = {
        ...plan,
        currentPage: Math.max(1, plan.currentPage - quota.targetPages),
        todayQuotas: {
          ...plan.todayQuotas,
          [p]: { ...quota, completed: false, actualPagesRead: 0 },
        },
      };
      setPlan(updated);
    } else {
      // Mark as completed
      const updated = KhatmahTrackerService.recordPrayerReading(
        plan,
        p,
        quota.targetPages
      );
      setPlan(updated);
    }
  };

  const handleRebalance = () => {
    if (currentPrayer) {
      const rebalanced = KhatmahTrackerService.autoRebalanceToday(
        plan,
        currentPrayer
      );
      setPlan(rebalanced);
    }
  };

  const progressPercent = KhatmahTrackerService.getOverallProgressPercentage(plan);

  return (
    <View className="bg-void-card border border-void-border rounded-3xl p-5 mb-6">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-spiritual-muted text-xs uppercase tracking-wider">
            ختمة القرآن التكيفية · ADAPTIVE KHATMAH
          </Text>
          <Text className="text-gold-light text-base font-bold mt-0.5">
            الصفحة {plan.currentPage} من {plan.totalPages} ({progressPercent}%)
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRebalance}
          className="px-3 py-1.5 rounded-xl bg-void-surface border border-gold/30"
        >
          <Text className="text-gold text-xs font-medium">موازنة تلقائية</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View className="h-1.5 w-full bg-void-surface rounded-full overflow-hidden my-2">
        <View
          className="h-full bg-gold rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>

      {/* Subtitle / Philosophy */}
      <Text className="text-spiritual-subtle text-[11px] mb-4">
        توزيع مرن بمعدل {plan.dailyTargetPages} صفحة يومياً دون لوم أو تقصير · لا يكلف الله نفساً إلا وسعها
      </Text>

      {/* 5-Prayer Distribution Checklist */}
      <View className="flex-row justify-between items-center">
        {prayers.map((p) => {
          const quota = plan.todayQuotas[p];
          const isCurrent = currentPrayer === p;
          const bg = quota.completed
            ? 'bg-emerald-deep border-emerald-light/50'
            : isCurrent
            ? 'bg-void-surface border-gold'
            : 'bg-void-surface/50 border-void-border';

          return (
            <TouchableOpacity
              key={p}
              onPress={() => handleTogglePrayer(p)}
              className={`items-center px-2 py-3 rounded-2xl border flex-1 mx-1 ${bg}`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-[11px] mb-1 font-medium ${
                  quota.completed
                    ? 'text-emerald-light'
                    : isCurrent
                    ? 'text-gold'
                    : 'text-spiritual-muted'
                }`}
              >
                {PRAYER_NAMES[p].ar}
              </Text>

              <Text
                className={`text-sm font-bold font-mono ${
                  quota.completed
                    ? 'text-emerald-light'
                    : isCurrent
                    ? 'text-gold-light'
                    : 'text-spiritual-text'
                }`}
              >
                {quota.targetPages}ص
              </Text>

              <View
                className={`w-3.5 h-3.5 rounded-full mt-2 items-center justify-center ${
                  quota.completed ? 'bg-emerald-light' : 'bg-void-border'
                }`}
              >
                {quota.completed && (
                  <Text className="text-void-pure text-[9px] font-bold">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
