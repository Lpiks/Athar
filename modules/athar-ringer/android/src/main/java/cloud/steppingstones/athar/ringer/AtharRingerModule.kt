package cloud.steppingstones.athar.ringer

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AtharRingerModule : Module() {
  private val tag = "AtharRingerModule"

  override fun definition() = ModuleDefinition {
    Name("AtharRinger")

    AsyncFunction("isDndAccessGranted") {
      try {
        val context = appContext.reactContext ?: return@AsyncFunction false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
          return@AsyncFunction notificationManager?.isNotificationPolicyAccessGranted ?: false
        }
        return@AsyncFunction true
      } catch (e: Throwable) {
        Log.e(tag, "Error checking DND policy access: ${e.message}")
        return@AsyncFunction false
      }
    }

    AsyncFunction("openDndSettings") {
      try {
        val context = appContext.reactContext ?: return@AsyncFunction false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
          return@AsyncFunction true
        }
        return@AsyncFunction false
      } catch (e: Throwable) {
        Log.e(tag, "Error opening DND settings: ${e.message}")
        return@AsyncFunction false
      }
    }

    AsyncFunction("setRingerMode") { mode: String ->
      try {
        val context = appContext.reactContext ?: return@AsyncFunction false
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
          ?: return@AsyncFunction false
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

        when (mode) {
          "silent" -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
              if (notificationManager?.isNotificationPolicyAccessGranted == true) {
                audioManager.ringerMode = AudioManager.RINGER_MODE_SILENT
                Log.d(tag, "Device set to RINGER_MODE_SILENT")
                return@AsyncFunction true
              } else {
                // If DND permission is not granted, fall back to vibrate
                Log.w(tag, "DND permission not granted. Falling back to RINGER_MODE_VIBRATE")
                audioManager.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                return@AsyncFunction true
              }
            } else {
              audioManager.ringerMode = AudioManager.RINGER_MODE_SILENT
              return@AsyncFunction true
            }
          }
          "vibrate" -> {
            audioManager.ringerMode = AudioManager.RINGER_MODE_VIBRATE
            Log.d(tag, "Device set to RINGER_MODE_VIBRATE")
            return@AsyncFunction true
          }
          "normal" -> {
            audioManager.ringerMode = AudioManager.RINGER_MODE_NORMAL
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                notificationManager?.isNotificationPolicyAccessGranted == true) {
              notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
            }
            Log.d(tag, "Device set to RINGER_MODE_NORMAL")
            return@AsyncFunction true
          }
          else -> {
            Log.w(tag, "Unknown ringer mode: $mode")
            return@AsyncFunction false
          }
        }
      } catch (e: Throwable) {
        Log.e(tag, "Error changing ringer mode: ${e.message}")
        return@AsyncFunction false
      }
    }

    AsyncFunction("getRingerMode") {
      try {
        val context = appContext.reactContext ?: return@AsyncFunction "unknown"
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
          ?: return@AsyncFunction "unknown"
        when (audioManager.ringerMode) {
          AudioManager.RINGER_MODE_SILENT -> "silent"
          AudioManager.RINGER_MODE_VIBRATE -> "vibrate"
          AudioManager.RINGER_MODE_NORMAL -> "normal"
          else -> "unknown"
        }
      } catch (e: Throwable) {
        Log.e(tag, "Error getting ringer mode: ${e.message}")
        return@AsyncFunction "unknown"
      }
    }
  }
}
