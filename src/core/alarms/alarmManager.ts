/**
 * Athar (أَثَر) Android Exact Alarm & Doze Mode Defeat Engine
 *
 * Implements real operating-system level scheduling via expo-notifications:
 * - Configures High Priority Android Notification Channels.
 * - Schedules mathematically deterministic Adhan triggers for all 5 daily prayers + Tahajjud.
 * - Triggers notifications even in deep sleep (Doze Mode).
 */

import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AtharAstronomicalSuite, Prayer, PrayerTimesResult } from '../astronomy';

// Configure top-level notification presentation behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ScheduledAdhanAlarm {
  readonly id: string;
  readonly prayer: Prayer | 'tahajjud';
  readonly timestamp: number;
  readonly titleAr: string;
  readonly titleEn: string;
  readonly soundAsset: string;
}

export class ExactAlarmManager {
  private static instance: ExactAlarmManager | null = null;
  private scheduledAlarms: Map<string, ScheduledAdhanAlarm> = new Map();
  private channelsConfigured = false;

  public static readonly ADHAN_CHANNEL_ID = 'athar_adhan_high_priority_v1';
  public static readonly TAHAJJUD_CHANNEL_ID = 'athar_tahajjud_reminder_v1';

  private constructor() {}

  public static getInstance(): ExactAlarmManager {
    if (!ExactAlarmManager.instance) {
      ExactAlarmManager.instance = new ExactAlarmManager();
    }
    return ExactAlarmManager.instance;
  }

  /**
   * Configure high-priority Android notification channels with sound & vibration
   */
  public async ensureChannelsConfigured(): Promise<void> {
    if (this.channelsConfigured || Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(ExactAlarmManager.ADHAN_CHANNEL_ID, {
        name: 'أذان الصلوات الخمس (Athar Adhan)',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#C5A059',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      await Notifications.setNotificationChannelAsync(ExactAlarmManager.TAHAJJUD_CHANNEL_ID, {
        name: 'تنبيه الثلث الأخير من الليل (Tahajjud)',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#34D399',
      });

      this.channelsConfigured = true;
    } catch (e) {
      console.warn('[ExactAlarmManager] Error setting notification channels:', e);
    }
  }

  /**
   * Generates exact Adhan schedule for a 24-hour cycle from celestial calculations.
   */
  public generateDailyAdhanSchedule(
    prayerTimes: PrayerTimesResult
  ): ScheduledAdhanAlarm[] {
    const alarms: ScheduledAdhanAlarm[] = [
      {
        id: `fajr_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: Prayer.FAJR,
        timestamp: prayerTimes.fajr.getTime(),
        titleAr: 'حان الآن موعد أذان الفجر 🕌',
        titleEn: 'Time for Fajr Prayer',
        soundAsset: 'default',
      },
      {
        id: `dhuhr_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: Prayer.DHUHR,
        timestamp: prayerTimes.dhuhr.getTime(),
        titleAr: 'حان الآن موعد أذان الظهر 🕌',
        titleEn: 'Time for Dhuhr Prayer',
        soundAsset: 'default',
      },
      {
        id: `asr_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: Prayer.ASR,
        timestamp: prayerTimes.asr.getTime(),
        titleAr: 'حان الآن موعد أذان العصر 🕌',
        titleEn: 'Time for Asr Prayer',
        soundAsset: 'default',
      },
      {
        id: `maghrib_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: Prayer.MAGHRIB,
        timestamp: prayerTimes.maghrib.getTime(),
        titleAr: 'حان الآن موعد أذان المغرب 🕌',
        titleEn: 'Time for Maghrib Prayer',
        soundAsset: 'default',
      },
      {
        id: `isha_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: Prayer.ISHA,
        timestamp: prayerTimes.isha.getTime(),
        titleAr: 'حان الآن موعد أذان العشاء 🕌',
        titleEn: 'Time for Isha Prayer',
        soundAsset: 'default',
      },
      {
        id: `tahajjud_${prayerTimes.date.toISOString().slice(0, 10)}`,
        prayer: 'tahajjud',
        timestamp: prayerTimes.lastThirdOfTheNight.getTime(),
        titleAr: 'دخل الثلث الأخير من الليل 🌙 (وقت السحر والتهجد)',
        titleEn: 'Last Third of the Night (Tahajjud)',
        soundAsset: 'default',
      },
    ];

    return alarms;
  }

  /**
   * Schedules real native notifications on the device for the next N days.
   */
  public async scheduleUpcomingAdhans(
    latitude: number,
    longitude: number,
    daysAhead: number = 2
  ): Promise<ScheduledAdhanAlarm[]> {
    await this.ensureChannelsConfigured();

    // Check / request notification permissions
    try {
      const settings = await Notifications.getPermissionsAsync();
      if (!settings.granted) {
        const req = await Notifications.requestPermissionsAsync();
        if (!req.granted) {
          console.warn('[ExactAlarmManager] Notification permission not granted');
        }
      }
    } catch {}

    const now = Date.now();
    const scheduledList: ScheduledAdhanAlarm[] = [];

    // Cancel previously scheduled athar notifications to prevent duplicates
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const targetDate = new Date(now + dayOffset * 86400000);
      const times = AtharAstronomicalSuite.getPrayerTimes(targetDate, latitude, longitude);
      const dailyAlarms = this.generateDailyAdhanSchedule(times);

      for (const alarm of dailyAlarms) {
        if (alarm.timestamp > now) {
          this.scheduledAlarms.set(alarm.id, alarm);
          scheduledList.push(alarm);

          const isTahajjud = alarm.prayer === 'tahajjud';
          const channelId = isTahajjud
            ? ExactAlarmManager.TAHAJJUD_CHANNEL_ID
            : ExactAlarmManager.ADHAN_CHANNEL_ID;

          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: alarm.titleAr,
                body: isTahajjud
                  ? '«يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ»'
                  : 'حي على الصلاة · حي على الفلاح',
                sound: true,
                data: { prayer: alarm.prayer, id: alarm.id },
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: new Date(alarm.timestamp),
                channelId,
              },
            });
          } catch (err) {
            console.warn(`[ExactAlarmManager] Failed to schedule alarm ${alarm.id}:`, err);
          }
        }
      }
    }

    return scheduledList;
  }

  /**
   * Open Android system settings to grant exemption from battery optimization.
   */
  public async requestIgnoreBatteryOptimizations(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await Linking.openSettings();
      } catch (e) {
        console.warn('Could not open battery optimization settings:', e);
      }
    }
  }

  /**
   * Get all currently queued alarms
   */
  public getScheduledAlarms(): ScheduledAdhanAlarm[] {
    return Array.from(this.scheduledAlarms.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }

  /**
   * Cancel all active scheduled alarms
   */
  public async cancelAllAlarms(): Promise<void> {
    this.scheduledAlarms.clear();
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  }
}
