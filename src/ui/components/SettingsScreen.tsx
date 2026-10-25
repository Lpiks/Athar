import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { THEME } from '../theme';
import { SettingsService, AtharSettings } from '../../core/settings/settingsService';
import { ALGERIA_58_WILAYAS, AlgeriaWilaya } from '../../core/astronomy/algeriaWilayas';
import { MosqueSilentModeManager } from '../../core/alarms/silentModeManager';

export const SettingsScreen: React.FC = () => {
  const settingsService = SettingsService.getInstance();
  const silentManager = MosqueSilentModeManager.getInstance();

  const [settings, setSettings] = useState<AtharSettings>(() => settingsService.getSettings());
  const [isWilayaModalOpen, setIsWilayaModalOpen] = useState<boolean>(false);
  const [wilayaSearchQuery, setWilayaSearchQuery] = useState<string>('');
  const [isCurrentlyMuted, setIsCurrentlyMuted] = useState<boolean>(() => silentManager.getIsMuted());
  const [hasDndPermission, setHasDndPermission] = useState<boolean>(false);

  useEffect(() => {
    silentManager.hasDndAccess().then(setHasDndPermission);
  }, []);

  useEffect(() => {
    const unsubscribe = settingsService.subscribe((fresh) => {
      setSettings(fresh);
    });
    return unsubscribe;
  }, []);

  const handleUpdateMosqueSilent = (updates: Partial<AtharSettings['mosqueSilentMode']>) => {
    settingsService.updateSettings({
      mosqueSilentMode: {
        ...settings.mosqueSilentMode,
        ...updates,
      },
    });
  };

  const handleUpdatePrayerCalc = (updates: Partial<AtharSettings['prayerCalculation']>) => {
    settingsService.updateSettings({
      prayerCalculation: {
        ...settings.prayerCalculation,
        ...updates,
      },
    });
  };

  const handleSelectWilaya = (wilaya: AlgeriaWilaya) => {
    settingsService.updateSettings({
      location: {
        wilayaCode: wilaya.code,
        cityAr: wilaya.nameAr,
        latitude: wilaya.latitude,
        longitude: wilaya.longitude,
        useGps: false,
      },
    });
    setIsWilayaModalOpen(false);
    setWilayaSearchQuery('');
    Alert.alert('تم تحديث الموقع', `تم ضبط مواقيت الصلاة تلقائياً وفق إحداثيات ولاية ${wilaya.nameAr} (${wilaya.code}).`);
  };

  const handleManualMosqueMute = () => {
    if (isCurrentlyMuted) {
      silentManager.restoreRinger();
      setIsCurrentlyMuted(false);
      Alert.alert('تمت إعادة الصوت 🔔', 'تم استرجاع الوضع العام للصوت بنجاح.');
    } else {
      const res = silentManager.activateMosqueSilence(60, settings.mosqueSilentMode.mode);
      setIsCurrentlyMuted(true);
      const timeStr = res.unmuteAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      Alert.alert(
        'تم تفعيل وضع المسجد 🔕',
        `تم كتم الهاتف لساعة واحدة (${settings.mosqueSilentMode.mode === 'silent' ? 'صامت تام' : 'اهتزاز'}). سيعود الصوت تلقائياً الساعة ${timeStr}. تقبل الله صلاتكم.`
      );
    }
  };

  const handleOpenDndSettings = async () => {
    await silentManager.requestNotificationPolicyAccess();
    setTimeout(async () => {
      const granted = await silentManager.hasDndAccess();
      setHasDndPermission(granted);
    }, 2000);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message:
          'تطبيق أَثَر (Athar) — جناح الصلاة والمصحف الشريف الفلكي السيادي.\n100% مجاني، 100% بدون إعلانات، 100% بدون تتبع.\nصدقة جارية لوجه الله تعالى.',
      });
    } catch {}
  };

  const filteredWilayas = ALGERIA_58_WILAYAS.filter(
    (w) =>
      w.nameAr.includes(wilayaSearchQuery) ||
      w.nameEn.toLowerCase().includes(wilayaSearchQuery.toLowerCase()) ||
      String(w.code) === wilayaSearchQuery.trim()
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
      className="p-4"
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Top Header */}
      <View className="mb-4 items-center">
        <Text style={{ color: THEME.colors.goldLight }} className="text-2xl font-bold font-uthmani">
          الإعدادات والضبط الشامل
        </Text>
        <Text style={{ color: THEME.colors.textMuted }} className="text-xs mt-0.5">
          تحكم سيادي كامل في جميع معايير وميزات التطبيق
        </Text>
      </View>

      {/* SECTION 1: وضع الصامت التلقائي في المسجد وأثناء الصلاة */}
      <View
        style={{
          backgroundColor: THEME.colors.surface,
          borderColor: THEME.colors.goldBorder,
          borderWidth: 1.5,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          ...THEME.shadows.card,
        }}
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center">
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔕</Text>
            <View>
              <Text style={{ color: THEME.colors.goldLight, fontSize: 16, fontWeight: 'bold' }}>
                وضع الصامت في المسجد وأثناء الصلاة
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                كتم الهاتف تلقائياً عند دخول وقت الصلاة وإعادته بعد انتهائها
              </Text>
            </View>
          </View>
        </View>

        {/* Master Toggle */}
        <View
          style={{ backgroundColor: THEME.colors.surfaceElevated, borderColor: THEME.colors.cardBorder, borderWidth: 1 }}
          className="p-3 rounded-xl flex-row justify-between items-center my-2"
        >
          <View>
            <Text style={{ color: THEME.colors.textPrimary, fontWeight: 'bold', fontSize: 13 }}>
              تفعيل الكتم التلقائي
            </Text>
            <Text style={{ color: THEME.colors.emeraldLight, fontSize: 11 }}>
              {settings.mosqueSilentMode.enabled ? 'مفعّل تلقائياً دبر كل أذان' : 'معطّل حالياً'}
            </Text>
          </View>
          <Switch
            value={settings.mosqueSilentMode.enabled}
            onValueChange={(val) => handleUpdateMosqueSilent({ enabled: val })}
            trackColor={{ false: '#334155', true: THEME.colors.emerald }}
            thumbColor={settings.mosqueSilentMode.enabled ? THEME.colors.goldLight : '#94A3B8'}
          />
        </View>

        {settings.mosqueSilentMode.enabled && (
          <View className="mt-2">
            {/* Mode: Silent vs Vibrate */}
            <Text style={{ color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
              نوع الكتم أثناء الصلاة:
            </Text>
            <View className="flex-row bg-white/5 p-1 rounded-xl mb-3">
              <TouchableOpacity
                onPress={() => handleUpdateMosqueSilent({ mode: 'silent' })}
                style={{
                  flex: 1,
                  backgroundColor: settings.mosqueSilentMode.mode === 'silent' ? THEME.colors.gold : 'transparent',
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: settings.mosqueSilentMode.mode === 'silent' ? '#000' : THEME.colors.textSecondary,
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  صامت تام (Silent) 🔇
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleUpdateMosqueSilent({ mode: 'vibrate' })}
                style={{
                  flex: 1,
                  backgroundColor: settings.mosqueSilentMode.mode === 'vibrate' ? THEME.colors.gold : 'transparent',
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: settings.mosqueSilentMode.mode === 'vibrate' ? '#000' : THEME.colors.textSecondary,
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  اهتزاز فقط (Vibrate) 📳
                </Text>
              </TouchableOpacity>
            </View>

            {/* Duration Selector for Regular Prayers */}
            <Text style={{ color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
              مدة الكتم للصلوات اليومية:
            </Text>
            <View className="flex-row justify-between mb-3">
              {[15, 20, 25, 30].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => handleUpdateMosqueSilent({ durationMinutes: mins })}
                  style={{
                    flex: 1,
                    backgroundColor:
                      settings.mosqueSilentMode.durationMinutes === mins
                        ? THEME.colors.goldGlass
                        : THEME.colors.surfaceElevated,
                    borderColor:
                      settings.mosqueSilentMode.durationMinutes === mins
                        ? THEME.colors.gold
                        : THEME.colors.cardBorder,
                    borderWidth: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginHorizontal: 3,
                  }}
                >
                  <Text
                    style={{
                      color:
                        settings.mosqueSilentMode.durationMinutes === mins
                          ? THEME.colors.goldLight
                          : THEME.colors.textSecondary,
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {mins} دقيقة
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration for Friday Prayer */}
            <Text style={{ color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
              مدة الكتم لصلاة الجمعة (خطبة وصلاة):
            </Text>
            <View className="flex-row justify-between mb-4">
              {[35, 45, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  onPress={() => handleUpdateMosqueSilent({ fridayDurationMinutes: mins })}
                  style={{
                    flex: 1,
                    backgroundColor:
                      settings.mosqueSilentMode.fridayDurationMinutes === mins
                        ? THEME.colors.goldGlass
                        : THEME.colors.surfaceElevated,
                    borderColor:
                      settings.mosqueSilentMode.fridayDurationMinutes === mins
                        ? THEME.colors.gold
                        : THEME.colors.cardBorder,
                    borderWidth: 1,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginHorizontal: 3,
                  }}
                >
                  <Text
                    style={{
                      color:
                        settings.mosqueSilentMode.fridayDurationMinutes === mins
                          ? THEME.colors.goldLight
                          : THEME.colors.textSecondary,
                      fontWeight: 'bold',
                      fontSize: 12,
                    }}
                  >
                    {mins} دقيقة
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons: DND Permission & Test Mute */}
            <View className="flex-row justify-between items-center pt-2 border-t border-white/10">
              <TouchableOpacity
                onPress={handleOpenDndSettings}
                style={{
                  backgroundColor: hasDndPermission ? THEME.colors.emeraldGlass : THEME.colors.surfaceElevated,
                  borderColor: hasDndPermission ? THEME.colors.emeraldBorder : THEME.colors.goldBorder,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: hasDndPermission ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                    fontSize: 11,
                    fontWeight: 'bold',
                  }}
                >
                  {hasDndPermission ? 'إذن DND مفعّل ✓' : '⚙️ تفعيل إذن عدم الإزعاج'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleManualMosqueMute}
                style={{
                  backgroundColor: isCurrentlyMuted ? THEME.colors.goldGlass : THEME.colors.emeraldGlass,
                  borderColor: isCurrentlyMuted ? THEME.colors.goldBorder : THEME.colors.emeraldBorder,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    color: isCurrentlyMuted ? THEME.colors.goldLight : THEME.colors.emeraldLight,
                    fontWeight: 'bold',
                    fontSize: 11,
                  }}
                >
                  {isCurrentlyMuted ? 'إلغاء الكتم 🔔' : 'تجربة الكتم الآن 🔕'}
                </Text>
              </TouchableOpacity>
            </View>

            {!hasDndPermission && (
              <Text style={{ color: THEME.colors.textMuted, fontSize: 10, marginTop: 8, textAlign: 'center' }}>
                💡 يتطلب الصامت التام منح إذن عدم الإزعاج للتطبيق من إعدادات النظام.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* SECTION 2: الموقع الجغرافي والولايات الـ 58 */}
      <View
        style={{
          backgroundColor: THEME.colors.surface,
          borderColor: THEME.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          ...THEME.shadows.card,
        }}
      >
        <Text style={{ color: THEME.colors.goldLight, fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
          الموقع الجغرافي والولاية (أوفلاين 100%)
        </Text>
        <Text style={{ color: THEME.colors.textMuted, fontSize: 11, marginBottom: 12 }}>
          قاعدة بيانات مدمجة لجميع ولايات الجزائر الـ 58 بدون الحاجة لتشغيل الإنترنت
        </Text>

        <TouchableOpacity
          onPress={() => setIsWilayaModalOpen(true)}
          style={{
            backgroundColor: THEME.colors.surfaceElevated,
            borderColor: THEME.colors.goldBorder,
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View className="flex-row items-center">
            <View
              style={{
                backgroundColor: THEME.colors.goldGlass,
                width: 36,
                height: 36,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text style={{ color: THEME.colors.goldLight, fontWeight: 'bold', fontSize: 13 }}>
                {settings.location.wilayaCode}
              </Text>
            </View>
            <View>
              <Text style={{ color: THEME.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>
                ولاية {settings.location.cityAr} 🇩🇿
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                خط عرض {settings.location.latitude.toFixed(2)}° · خط طول {settings.location.longitude.toFixed(2)}°
              </Text>
            </View>
          </View>
          <Text style={{ color: THEME.colors.gold, fontSize: 13, fontWeight: 'bold' }}>
            تغيير ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECTION 3: معايير الحساب الفلكي والفقهي */}
      <View
        style={{
          backgroundColor: THEME.colors.surface,
          borderColor: THEME.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 22,
          padding: 18,
          marginBottom: 16,
          ...THEME.shadows.card,
        }}
      >
        <Text style={{ color: THEME.colors.goldLight, fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
          المعايير الفلكية والمذاهب الفقهية
        </Text>
        <Text style={{ color: THEME.colors.textMuted, fontSize: 11, marginBottom: 12 }}>
          الضبط الدقيق لزوايا الفجر والعشاء وظل صلاة العصر
        </Text>

        {/* Asr Juristic School Toggle */}
        <Text style={{ color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
          مذهب صلاة العصر (ظل القامة):
        </Text>
        <View className="flex-row bg-white/5 p-1 rounded-xl mb-4">
          <TouchableOpacity
            onPress={() => handleUpdatePrayerCalc({ juristicSchool: 'maliki' })}
            style={{
              flex: 1,
              backgroundColor: settings.prayerCalculation.juristicSchool === 'maliki' ? THEME.colors.gold : 'transparent',
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: settings.prayerCalculation.juristicSchool === 'maliki' ? '#000' : THEME.colors.textSecondary,
                fontWeight: 'bold',
                fontSize: 12,
              }}
            >
              المالكي والشافعي (s=1) ✓
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleUpdatePrayerCalc({ juristicSchool: 'hanafi' })}
            style={{
              flex: 1,
              backgroundColor: settings.prayerCalculation.juristicSchool === 'hanafi' ? THEME.colors.gold : 'transparent',
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: settings.prayerCalculation.juristicSchool === 'hanafi' ? '#000' : THEME.colors.textSecondary,
                fontWeight: 'bold',
                fontSize: 12,
              }}
            >
              الحنفي (s=2)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pre-Adhan Alert */}
        <Text style={{ color: THEME.colors.textSecondary, fontSize: 12, marginBottom: 6 }}>
          التنبيه قبل دخول وقت الصلاة:
        </Text>
        <View className="flex-row justify-between">
          {[0, 5, 10, 15].map((mins) => (
            <TouchableOpacity
              key={mins}
              onPress={() => handleUpdatePrayerCalc({ preAdhanAlertMinutes: mins })}
              style={{
                flex: 1,
                backgroundColor:
                  settings.prayerCalculation.preAdhanAlertMinutes === mins
                    ? THEME.colors.goldGlass
                    : THEME.colors.surfaceElevated,
                borderColor:
                  settings.prayerCalculation.preAdhanAlertMinutes === mins
                    ? THEME.colors.gold
                    : THEME.colors.cardBorder,
                borderWidth: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: 'center',
                marginHorizontal: 3,
              }}
            >
              <Text
                style={{
                  color:
                    settings.prayerCalculation.preAdhanAlertMinutes === mins
                      ? THEME.colors.goldLight
                      : THEME.colors.textSecondary,
                  fontWeight: 'bold',
                  fontSize: 12,
                }}
              >
                {mins === 0 ? 'بدون تنبيه' : `${mins} دقائق`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SECTION 4: وثيقة الوقف والصدقة الجارية */}
      <View
        style={{
          backgroundColor: THEME.colors.surfaceElevated,
          borderColor: THEME.colors.goldBorder,
          borderWidth: 1,
          borderRadius: 22,
          padding: 18,
          marginBottom: 20,
          ...THEME.shadows.card,
        }}
      >
        <View className="items-center mb-2">
          <Text style={{ color: THEME.colors.goldLight }} className="text-base font-bold font-uthmani">
            « صَدَقَةٌ جَارِيَةٌ لِوَجْهِ اللَّهِ تَعَالَى »
          </Text>
        </View>

        <Text
          style={{ color: THEME.colors.textSecondary, lineHeight: 22 }}
          className="text-xs text-center mb-4"
        >
          تم بناء هذا التطبيق بنية خالصة لوجه الله تعالى كصدقة جارية. خالٍ تماماً 100% من أي إعلانات، 100% بدون تتبع أو جمع بيانات، ومصمم ليعمل بدون إنترنت للأبد.
        </Text>

        <TouchableOpacity
          onPress={handleShareApp}
          style={{
            backgroundColor: THEME.colors.gold,
            paddingVertical: 12,
            borderRadius: 14,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 13 }}>
            مشاركة التطبيق كصدقة جارية تؤجر عليها ↗
          </Text>
        </TouchableOpacity>
      </View>

      {/* Algeria 58 Wilayas Modal Picker */}
      <Modal
        visible={isWilayaModalOpen}
        animationType="slide"
        onRequestClose={() => setIsWilayaModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: THEME.colors.canvas }} className="p-4 pt-10">
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity
              onPress={() => setIsWilayaModalOpen(false)}
              style={{
                backgroundColor: THEME.colors.surfaceElevated,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: THEME.colors.textSecondary }}>إلغاء</Text>
            </TouchableOpacity>
            <Text style={{ color: THEME.colors.goldLight }} className="text-lg font-bold">
              اختر ولايتك (٥٨ ولاية جزائرية)
            </Text>
          </View>

          <TextInput
            placeholder="ابحث باسم الولاية أو رقمها..."
            placeholderTextColor={THEME.colors.textMuted}
            value={wilayaSearchQuery}
            onChangeText={setWilayaSearchQuery}
            style={{
              backgroundColor: THEME.colors.surface,
              borderColor: THEME.colors.goldBorder,
              borderWidth: 1,
              color: THEME.colors.textPrimary,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              textAlign: 'right',
              marginBottom: 12,
            }}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredWilayas.map((w) => {
              const isSelected = w.code === settings.location.wilayaCode;
              return (
                <TouchableOpacity
                  key={w.code}
                  onPress={() => handleSelectWilaya(w)}
                  style={{
                    backgroundColor: isSelected ? THEME.colors.surfaceElevated : THEME.colors.surface,
                    borderColor: isSelected ? THEME.colors.gold : THEME.colors.cardBorder,
                    borderWidth: isSelected ? 1.5 : 1,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: THEME.colors.goldGlass,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: THEME.colors.goldLight, fontWeight: 'bold', fontSize: 12 }}>
                        {w.code}
                      </Text>
                    </View>
                    <Text style={{ color: THEME.colors.textPrimary, fontSize: 15, fontWeight: 'bold' }}>
                      ولاية {w.nameAr}
                    </Text>
                  </View>
                  <Text style={{ color: THEME.colors.textMuted, fontSize: 12 }}>
                    {w.nameEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};
