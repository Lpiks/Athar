/**
 * Athar (أَثَر) Adaptive Khatmah Tracker Tests
 */

import { KhatmahTrackerService } from '../khatmahTracker';
import { Prayer } from '../../astronomy';

describe('Adaptive Khatmah Tracker Service', () => {
  test('creates 30-day Khatmah plan with 5-prayer distribution', () => {
    const plan = KhatmahTrackerService.createPlan(30, 1);
    expect(plan.targetDays).toBe(30);
    expect(plan.totalPages).toBe(604);
    expect(plan.dailyTargetPages).toBe(21); // ceil(604/30) = 21 pages/day

    const quotas = plan.todayQuotas;
    expect(quotas[Prayer.FAJR].targetPages).toBeGreaterThanOrEqual(4);
    expect(quotas[Prayer.ISHA].targetPages).toBeGreaterThanOrEqual(4);

    const sumPages =
      quotas[Prayer.FAJR].targetPages +
      quotas[Prayer.DHUHR].targetPages +
      quotas[Prayer.ASR].targetPages +
      quotas[Prayer.MAGHRIB].targetPages +
      quotas[Prayer.ISHA].targetPages;

    expect(sumPages).toBe(plan.dailyTargetPages);
  });

  test('records reading and marks prayer completed', () => {
    let plan = KhatmahTrackerService.createPlan(30, 1);
    const fajrTarget = plan.todayQuotas[Prayer.FAJR].targetPages;

    plan = KhatmahTrackerService.recordPrayerReading(plan, Prayer.FAJR, fajrTarget);
    expect(plan.todayQuotas[Prayer.FAJR].completed).toBe(true);
    expect(plan.currentPage).toBe(1 + fajrTarget);
  });

  test('guilt-free auto-rebalancing redistributes remaining pages', () => {
    let plan = KhatmahTrackerService.createPlan(30, 1);
    // User could only read 1 page at Fajr instead of 5
    plan = KhatmahTrackerService.recordPrayerReading(plan, Prayer.FAJR, 1);

    // Rebalance at Dhuhr
    plan = KhatmahTrackerService.autoRebalanceToday(plan, Prayer.DHUHR);

    // Remaining 4 prayers should absorb the deficit evenly
    const sumRemaining =
      plan.todayQuotas[Prayer.DHUHR].targetPages +
      plan.todayQuotas[Prayer.ASR].targetPages +
      plan.todayQuotas[Prayer.MAGHRIB].targetPages +
      plan.todayQuotas[Prayer.ISHA].targetPages;

    expect(sumRemaining).toBe(plan.dailyTargetPages - 1);
  });

  test('progress percentage calculates accurately', () => {
    const plan = KhatmahTrackerService.createPlan(30, 302); // Halfway
    const progress = KhatmahTrackerService.getOverallProgressPercentage(plan);
    expect(progress).toBeCloseTo(50.0, 1);
  });
});
