/**
 * Expo Config Plugin: withExactAlarm
 *
 * Injects hardened Android Doze Mode defeat permissions and AlarmManager configurations
 * into AndroidManifest.xml:
 * - SCHEDULE_EXACT_ALARM & USE_EXACT_ALARM
 * - WAKE_LOCK
 * - RECEIVE_BOOT_COMPLETED
 * - REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
 */

const { withAndroidManifest } = require('@expo/config-plugins');

function withExactAlarm(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Ensure permissions array exists
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.WAKE_LOCK',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ];

    for (const perm of permissions) {
      const exists = androidManifest['uses-permission'].some(
        (p) => p.$['android:name'] === perm
      );
      if (!exists) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    }

    return config;
  });
}

module.exports = withExactAlarm;
