/**
 * Athar (أَثَر) Adaptive Khatmah Tracker (ختمة القرآن التكيفية)
 *
 * Distributes reading goals across the 5 daily prayer times
 * with guilt-free, real-time auto-rebalancing.
 */

import { Prayer } from '../astronomy';

export interface DailyPrayerQuota {
  readonly prayer: Prayer;
  readonly prayerNameAr: string;
  readonly targetPages: number;
  completed: boolean;
  actualPagesRead: number;
}

export interface KhatmahPlan {
  readonly id: string;
  readonly title: string;
  readonly targetDays: number;
  readonly totalPages: number; // Standard 604 pages
  currentPage: number;
  startDate: string; // ISO
  targetDate: string; // ISO
  dailyTargetPages: number;
  todayQuotas: Record<Prayer, DailyPrayerQuota>;
}

export class KhatmahTrackerService {
  public static readonly TOTAL_MUSHAF_PAGES = 604;

  /**
   * Initializes a new adaptive Khatmah plan.
   * Default: 30 days (1 Juz / 20 pages per day, 4 pages after each of the 5 prayers).
   *
   * @param targetDays Duration in days (e.g. 30, 15, 60)
   * @param startPage Current page offset (defaults to 1)
   */
  public static createPlan(
    targetDays: number = 30,
    startPage: number = 1
  ): KhatmahPlan {
    const remainingPages = this.TOTAL_MUSHAF_PAGES - startPage + 1;
    const dailyTarget = Math.max(1, Math.ceil(remainingPages / targetDays));

    const now = new Date();
    const targetDate = new Date(now.getTime() + targetDays * 86400000);

    const quotas = this.distributeDailyPages(dailyTarget);

    return {
      id: `khatmah_${Date.now()}`,
      title: 'ختمة الأثر الروحانية',
      targetDays,
      totalPages: this.TOTAL_MUSHAF_PAGES,
      currentPage: startPage,
      startDate: now.toISOString(),
      targetDate: targetDate.toISOString(),
      dailyTargetPages: dailyTarget,
      todayQuotas: quotas,
    };
  }

  /**
   * Distributes daily pages symmetrically across the 5 daily prayers.
   * E.g. 20 pages -> 4 pages per prayer.
   */
  public static distributeDailyPages(dailyPages: number): Record<Prayer, DailyPrayerQuota> {
    const prayers: Array<{ key: Prayer; nameAr: string }> = [
      { key: Prayer.FAJR, nameAr: 'بعد الفجر' },
      { key: Prayer.DHUHR, nameAr: 'بعد الظهر' },
      { key: Prayer.ASR, nameAr: 'بعد العصر' },
      { key: Prayer.MAGHRIB, nameAr: 'بعد المغرب' },
      { key: Prayer.ISHA, nameAr: 'بعد العشاء' },
    ];

    const basePerPrayer = Math.floor(dailyPages / 5);
    let remainder = dailyPages % 5;

    const result = {} as Record<Prayer, DailyPrayerQuota>;

    for (const p of prayers) {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;

      result[p.key] = {
        prayer: p.key,
        prayerNameAr: p.nameAr,
        targetPages: basePerPrayer + extra,
        completed: false,
        actualPagesRead: 0,
      };
    }

    return result;
  }

  /**
   * Guilt-Free Auto-Rebalance:
   * If a worshipper reads less (or more) than planned during earlier prayers,
   * dynamically re-calculates the remaining target for the day across remaining prayers,
   * or gently stretches the timeline without punitive warnings.
   */
  public static autoRebalanceToday(
    plan: KhatmahPlan,
    currentPrayer: Prayer
  ): KhatmahPlan {
    const prayerOrder: Prayer[] = [
      Prayer.FAJR,
      Prayer.DHUHR,
      Prayer.ASR,
      Prayer.MAGHRIB,
      Prayer.ISHA,
    ];

    const currentIndex = prayerOrder.indexOf(currentPrayer);
    if (currentIndex === -1) return plan;

    // Sum pages read so far today
    let totalReadToday = 0;
    const remainingPrayers: Prayer[] = [];

    for (let i = 0; i < prayerOrder.length; i++) {
      const p = prayerOrder[i];
      const quota = plan.todayQuotas[p];
      if (i < currentIndex) {
        totalReadToday += quota.actualPagesRead;
      } else {
        remainingPrayers.push(p);
      }
    }

    const pagesLeftToday = Math.max(0, plan.dailyTargetPages - totalReadToday);

    if (remainingPrayers.length > 0) {
      const perRemaining = Math.floor(pagesLeftToday / remainingPrayers.length);
      let rem = pagesLeftToday % remainingPrayers.length;

      for (const p of remainingPrayers) {
        const extra = rem > 0 ? 1 : 0;
        if (rem > 0) rem--;

        plan.todayQuotas[p] = {
          ...plan.todayQuotas[p],
          targetPages: perRemaining + extra,
        };
      }
    }

    return { ...plan };
  }

  /**
   * Log pages read after a prayer
   */
  public static recordPrayerReading(
    plan: KhatmahPlan,
    prayer: Prayer,
    pagesRead: number
  ): KhatmahPlan {
    const quota = plan.todayQuotas[prayer];
    if (!quota) return plan;

    const newActual = quota.actualPagesRead + pagesRead;
    const completed = newActual >= quota.targetPages;

    const updatedQuota: DailyPrayerQuota = {
      ...quota,
      actualPagesRead: newActual,
      completed,
    };

    const newCurrentPage = Math.min(
      this.TOTAL_MUSHAF_PAGES,
      plan.currentPage + pagesRead
    );

    return {
      ...plan,
      currentPage: newCurrentPage,
      todayQuotas: {
        ...plan.todayQuotas,
        [prayer]: updatedQuota,
      },
    };
  }

  /**
   * Calculate overall Khatmah progression percentage (0.0 to 100.0)
   */
  public static getOverallProgressPercentage(plan: KhatmahPlan): number {
    return Number(((plan.currentPage / plan.totalPages) * 100).toFixed(1));
  }
}
