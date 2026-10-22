import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Vibration,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';
import { ADHKAR_LIST, DhikrItem } from '../../core/adhkar/adhkarData';
import { AtharAstronomicalSuite } from '../../core/astronomy';

interface QiblaAdhkarScreenProps {
  latitude?: number;
  longitude?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const QiblaAdhkarScreen: React.FC<QiblaAdhkarScreenProps> = ({
  latitude = 36.7538,
  longitude = 3.0588,
  onScroll,
}) => {
  // Main Sub-Tab: 'qibla' (الأسطرلاب الفلكي للقبلة) vs 'adhkar' (حصن المسلم والأذكار)
  const [screenTab, setScreenTab] = useState<'qibla' | 'adhkar'>('qibla');

  // Adhkar Category: morning | evening | after_prayer | sleep
  const [activeCategory, setActiveCategory] = useState<'morning' | 'evening' | 'after_prayer' | 'sleep'>('morning');

  // Adhkar Counters Map (id -> currentCount)
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Device Heading from Magnetometer (0° - 360° relative to Magnetic North)
  const [heading, setHeading] = useState<number>(0);
  const [hasSensor, setHasSensor] = useState<boolean>(true);

  // Compute Qibla for coordinates via Athar Astronomical Geodesic Suite
  const qibla = AtharAstronomicalSuite.getQibla(latitude, longitude);
  const qiblaBearing = qibla.bearingDegrees;
  const qiblaDistanceKm = Math.round(qibla.distanceKm);

  // Real-time Magnetometer listener
  useEffect(() => {
    let subscription: any = null;

    Magnetometer.isAvailableAsync().then((available) => {
      setHasSensor(available);
      if (available) {
        Magnetometer.setUpdateInterval(60); // Responsive 16.6 FPS update
        subscription = Magnetometer.addListener((data) => {
          let { x, y } = data;
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

  // Relative delta angle between phone's forward pointing axis and Qibla bearing
  // delta in range [-180, 180]
  let delta = (qiblaBearing - heading + 360) % 360;
  if (delta > 180) delta -= 360;

  // Precision alignment threshold (within ±4°)
  const isAlignedWithQibla = Math.abs(delta) <= 4.0;

  // Haptic feedback trigger upon achieving exact Qibla alignment
  const wasAlignedRef = useRef(false);
  useEffect(() => {
    if (isAlignedWithQibla && !wasAlignedRef.current) {
      try {
        Vibration.vibrate(35);
      } catch {}
    }
    wasAlignedRef.current = isAlignedWithQibla;
  }, [isAlignedWithQibla]);

  // Cardinal direction label for current phone heading in Arabic
  const getHeadingCardinal = (deg: number) => {
    const dirs = ['شَمَال', 'شَمَال شَرْق', 'شَرْق', 'جَنُوب شَرْق', 'جَنُوب', 'جَنُوب غَرْب', 'غَرْب', 'شَمَال غَرْب'];
    const idx = Math.round(deg / 45) % 8;
    return dirs[idx];
  };

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
    { key: 'morning', label: 'أذكار الصباح', icon: 'sunny-outline' },
    { key: 'evening', label: 'أذكار المساء', icon: 'moon-outline' },
    { key: 'after_prayer', label: 'بعد الصلاة', icon: 'shield-checkmark-outline' },
    { key: 'sleep', label: 'أذكار النوم', icon: 'bed-outline' },
  ];

  // Astrolabe 24 Degree Ticks (Every 15° with major ticks at 30°)
  const astrolabeTicks = [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165,
    180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345,
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: THEME.colors.canvas }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
    >
      {/* Sovereign Dual Segmented Controller */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: THEME.colors.surfaceElevated,
          borderRadius: 20,
          padding: 4,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: THEME.colors.cardBorder,
        }}
      >
        <TouchableOpacity
          onPress={() => setScreenTab('qibla')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 16,
            backgroundColor: screenTab === 'qibla' ? THEME.colors.gold : 'transparent',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="compass"
            size={18}
            color={screenTab === 'qibla' ? '#0A0E13' : THEME.colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: THEME.fonts.arabicBold,
              fontSize: 14,
              color: screenTab === 'qibla' ? '#0A0E13' : THEME.colors.textSecondary,
            }}
          >
            الأسطرلاب الفلكي
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreenTab('adhkar')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 16,
            backgroundColor: screenTab === 'adhkar' ? THEME.colors.gold : 'transparent',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={screenTab === 'adhkar' ? '#0A0E13' : THEME.colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: THEME.fonts.arabicBold,
              fontSize: 14,
              color: screenTab === 'adhkar' ? '#0A0E13' : THEME.colors.textSecondary,
            }}
          >
            حصن المسلم والأذكار
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: IMPERIAL ISLAMIC ASTROLABE QIBLA COMPASS                          */}
      {/* ========================================================================= */}
      {screenTab === 'qibla' && (
        <View>
          {/* Imperial Astrolabe Container Card */}
          <View
            style={{
              backgroundColor: '#070A0F',
              borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
              borderWidth: 1.8,
              borderRadius: 32,
              paddingVertical: 20,
              paddingHorizontal: 16,
              alignItems: 'center',
              marginBottom: 16,
              position: 'relative',
              ...THEME.shadows.card,
              ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : THEME.shadows.glowGold),
            }}
          >
            {/* Authentic Astrolabe Crown / Suspension Ring (عروة وكرسي الأسطرلاب) */}
            <View style={{ alignItems: 'center', marginTop: -6, marginBottom: 8 }}>
              {/* Outer Suspension Ring */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
                  backgroundColor: 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: -4,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    borderWidth: 1.5,
                    borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  }}
                />
              </View>

              {/* Moorish Throne Base Arch (كرسي الأسطرلاب) */}
              <View
                style={{
                  width: 64,
                  height: 12,
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  backgroundColor: isAlignedWithQibla ? 'rgba(16, 185, 129, 0.25)' : 'rgba(197, 160, 89, 0.25)',
                  borderWidth: 1,
                  borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
                  borderBottomWidth: 0,
                }}
              />
            </View>

            {/* Sacred Ayah Calligraphy Inscription */}
            <View
              style={{
                backgroundColor: 'rgba(197, 160, 89, 0.08)',
                borderColor: isAlignedWithQibla ? 'rgba(52, 211, 153, 0.3)' : 'rgba(197, 160, 89, 0.25)',
                borderWidth: 1,
                borderRadius: 18,
                paddingVertical: 7,
                paddingHorizontal: 16,
                marginBottom: 14,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.quran,
                  fontSize: 16.5,
                  textAlign: 'center',
                }}
              >
                ﴿ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ﴾
              </Text>
            </View>

            {/* Dynamic Alignment Ribbon */}
            <View
              style={{
                backgroundColor: isAlignedWithQibla
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(197, 160, 89, 0.12)',
                borderColor: isAlignedWithQibla
                  ? THEME.colors.emeraldLight
                  : THEME.colors.goldBorder,
                borderWidth: 1.2,
                borderRadius: 22,
                paddingVertical: 8,
                paddingHorizontal: 20,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={isAlignedWithQibla ? 'shield-checkmark' : 'compass'}
                size={18}
                color={isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 14.5,
                }}
              >
                {isAlignedWithQibla
                  ? 'أَنْتَ بِاتِّجَاهِ القِبْلَةِ المُشَرَّفَةِ (١٠٠٪) ✓'
                  : delta > 0
                  ? `أَدِرِ الهَاتِفَ يَمِيناً بِمِقْدَارِ ${Math.round(delta)}°`
                  : `أَدِرِ الهَاتِفَ يَسَاراً بِمِقْدَارِ ${Math.round(Math.abs(delta))}°`}
              </Text>
            </View>

            {/* =================================================================== */}
            {/* THE IMPERIAL ASTROLABE COMPASS (280px Diameter)                    */}
            {/* =================================================================== */}
            <View
              style={{
                width: 280,
                height: 280,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                marginVertical: 6,
              }}
            >
              {/* Fixed Top Reticle Sighting Spear (مؤشر سمت الرأس عند الساعة ١٢) */}
              <View
                style={{
                  position: 'absolute',
                  top: -9,
                  alignItems: 'center',
                  zIndex: 40,
                }}
              >
                {/* Traditional Moorish Spearhead */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 9,
                    borderRightWidth: 9,
                    borderTopWidth: 16,
                    borderStyle: 'solid',
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
                  }}
                />
              </View>

              {/* Outer Brass Limb Ring (طوق الأسطرلاب المذهب) */}
              <View
                style={{
                  position: 'absolute',
                  width: 280,
                  height: 280,
                  borderRadius: 140,
                  borderWidth: 3,
                  borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold,
                  backgroundColor: '#05070B',
                }}
              />

              {/* Inner Decorative Bezel Filigree Ring */}
              <View
                style={{
                  position: 'absolute',
                  width: 266,
                  height: 266,
                  borderRadius: 133,
                  borderWidth: 1,
                  borderColor: isAlignedWithQibla ? 'rgba(52, 211, 153, 0.4)' : 'rgba(197, 160, 89, 0.35)',
                }}
              />

              {/* ROTATING ASTROLABE RETE & CELESTIAL DIAL */}
              <View
                style={{
                  width: 260,
                  height: 260,
                  borderRadius: 130,
                  backgroundColor: '#090D14',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: [{ rotate: `${(-heading).toFixed(1)}deg` }],
                }}
              >
                {/* Celestial Zodiac Outer Ring (دائرة البروج) */}
                <View
                  style={{
                    position: 'absolute',
                    width: 218,
                    height: 218,
                    borderRadius: 109,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(197, 160, 89, 0.35)',
                  }}
                />

                {/* Inner Astrolabe Ring */}
                <View
                  style={{
                    position: 'absolute',
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                />

                {/* 24 Astrolabe Graduated Degree Ticks */}
                {astrolabeTicks.map((tickAngle) => {
                  const isCardinal = tickAngle % 90 === 0;
                  const isMajor = tickAngle % 30 === 0;

                  return (
                    <View
                      key={`astrolabe_tick_${tickAngle}`}
                      style={{
                        position: 'absolute',
                        width: 2,
                        height: 254,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        transform: [{ rotate: `${tickAngle}deg` }],
                      }}
                    >
                      <View
                        style={{
                          width: isCardinal ? 3 : isMajor ? 2 : 1,
                          height: isCardinal ? 13 : isMajor ? 8 : 4.5,
                          backgroundColor: isCardinal
                            ? tickAngle === 0
                              ? '#EF4444' // North is Royal Crimson
                              : THEME.colors.gold
                            : isMajor
                            ? THEME.colors.goldLight
                            : 'rgba(255, 255, 255, 0.25)',
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  );
                })}

                {/* Classical Calligraphic Cardinal Directions */}
                {/* 1. NORTH (شَمَال) */}
                <View style={{ position: 'absolute', top: 14, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: '#EF4444',
                      fontFamily: THEME.fonts.arabicBold,
                      fontSize: 12.5,
                      fontWeight: 'bold',
                    }}
                  >
                    شَمَال
                  </Text>
                  <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: '700' }}>
                    0° N
                  </Text>
                </View>

                {/* 2. EAST (شَرْق) */}
                <View style={{ position: 'absolute', right: 12, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: THEME.colors.gold,
                      fontFamily: THEME.fonts.arabicBold,
                      fontSize: 12,
                    }}
                  >
                    شَرْق
                  </Text>
                  <Text style={{ color: THEME.colors.goldLight, fontSize: 8 }}>
                    90° E
                  </Text>
                </View>

                {/* 3. SOUTH (جَنُوب) */}
                <View style={{ position: 'absolute', bottom: 14, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: THEME.colors.textMuted,
                      fontFamily: THEME.fonts.arabicBold,
                      fontSize: 11.5,
                    }}
                  >
                    جَنُوب
                  </Text>
                  <Text style={{ color: THEME.colors.textMuted, fontSize: 8 }}>
                    180° S
                  </Text>
                </View>

                {/* 4. WEST (غَرْب) */}
                <View style={{ position: 'absolute', left: 12, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: THEME.colors.textMuted,
                      fontFamily: THEME.fonts.arabicBold,
                      fontSize: 11.5,
                    }}
                  >
                    غَرْب
                  </Text>
                  <Text style={{ color: THEME.colors.textMuted, fontSize: 8 }}>
                    270° W
                  </Text>
                </View>

                {/* =============================================================== */}
                {/* KAABA ALIDADE & BEACON (عِضَادَة ومَوْقِعُ الكَعْبَةِ المُشَرَّفَةِ)        */}
                {/* =============================================================== */}
                <View
                  style={{
                    position: 'absolute',
                    width: 260,
                    height: 260,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    transform: [{ rotate: `${qiblaBearing.toFixed(1)}deg` }],
                  }}
                >
                  {/* Fine Golden Sunray Laser Line */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 28,
                      width: 2.5,
                      height: 102,
                      backgroundColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      opacity: 0.85,
                      borderRadius: 1,
                    }}
                  />

                  {/* Kaaba Golden Astrolabe Plaque */}
                  <View
                    style={{
                      marginTop: -2,
                      backgroundColor: '#000',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      borderWidth: 2,
                      borderRadius: 16,
                      paddingHorizontal: 9,
                      paddingVertical: 3.5,
                      flexDirection: 'row',
                      alignItems: 'center',
                      ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : THEME.shadows.glowGold),
                    }}
                  >
                    <Text style={{ fontSize: 12, marginRight: 3 }}>🕋</Text>
                    <Text
                      style={{
                        color: isAlignedWithQibla
                          ? THEME.colors.emeraldLight
                          : THEME.colors.goldLight,
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 11,
                      }}
                    >
                      الْقِبْلَة
                    </Text>
                  </View>
                </View>

                {/* =============================================================== */}
                {/* SACRED 8-POINTED STAR OF SOLOMON (خَاتَمُ سُلَيْمَانَ الأَسْطُرْلابِي)       */}
                {/* =============================================================== */}
                <View
                  style={{
                    width: 86,
                    height: 86,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Square 1: Gold Filigree Outline */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 66,
                      height: 66,
                      backgroundColor: '#06090E',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      borderWidth: 1.5,
                      borderRadius: 8,
                    }}
                  />

                  {/* Square 2: Rotated 45° with Arabesque Geometry */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 66,
                      height: 66,
                      backgroundColor: '#06090E',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      borderWidth: 1.5,
                      borderRadius: 8,
                      transform: [{ rotate: '45deg' }],
                    }}
                  />

                  {/* Inner Concentric Golden Boss / Astrolabe Pivot */}
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: isAlignedWithQibla
                        ? THEME.colors.emeraldDeep
                        : '#111722',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.goldLight,
                      borderWidth: 1.8,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="cube"
                      size={20}
                      color={isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Live Astrolabe Readout Footer */}
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <Text
                style={{
                  color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 24,
                  letterSpacing: 0.5,
                }}
              >
                {Math.round(heading)}° {getHeadingCardinal(heading)}
              </Text>
              <Text
                style={{
                  color: THEME.colors.textMuted,
                  fontFamily: THEME.fonts.arabic,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {hasSensor
                  ? 'حساس البوصلة المغناطيسية نشط ويعمل بانتظام'
                  : 'وضع ثابت (لا يوجد مستشعر بوصلة بالجهاز)'}
              </Text>
            </View>
          </View>

          {/* ===================================================================== */}
          {/* ASTRONAVIGATION TELEMETRY PANELS (لوحة الملاحة الفلكية)              */}
          {/* ===================================================================== */}
          <View style={{ marginBottom: 16 }}>
            {/* Panel 1: Qibla Bearing & Heading */}
            <View
              style={{
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 24,
                padding: 16,
                marginBottom: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                ...THEME.shadows.card,
              }}
            >
              {/* Right Col: Qibla Bearing */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="compass" size={17} color={THEME.colors.gold} style={{ marginRight: 6 }} />
                  <Text style={{ color: THEME.colors.textMuted, fontFamily: THEME.fonts.arabic, fontSize: 12 }}>
                    زاوية القبلة (السمت الفلكي)
                  </Text>
                </View>
                <Text
                  style={{
                    color: THEME.colors.goldLight,
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 20,
                  }}
                >
                  {qiblaBearing.toFixed(1)}°
                </Text>
                <Text style={{ color: THEME.colors.textSecondary, fontFamily: THEME.fonts.arabic, fontSize: 11 }}>
                  الاتجاه: {qibla.cardinalDirection}
                </Text>
              </View>

              {/* Vertical Gold Divider */}
              <View
                style={{
                  width: 1,
                  height: 48,
                  backgroundColor: 'rgba(197, 160, 89, 0.25)',
                  marginHorizontal: 12,
                }}
              />

              {/* Left Col: Distance to Mecca */}
              <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="navigate" size={17} color={THEME.colors.emeraldLight} style={{ marginRight: 6 }} />
                  <Text style={{ color: THEME.colors.textMuted, fontFamily: THEME.fonts.arabic, fontSize: 12 }}>
                    المسافة إلى مكة المكرمة
                  </Text>
                </View>
                <Text
                  style={{
                    color: THEME.colors.emeraldLight,
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 20,
                  }}
                >
                  {qiblaDistanceKm.toLocaleString()} كم
                </Text>
                <Text style={{ color: THEME.colors.textSecondary, fontFamily: THEME.fonts.arabic, fontSize: 11 }}>
                  حساب الدائرة العظمى (Geodesic)
                </Text>
              </View>
            </View>

            {/* Panel 2: Coordinates & Device Status */}
            <View
              style={{
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 24,
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                ...THEME.shadows.card,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="location-outline" size={20} color={THEME.colors.gold} style={{ marginRight: 10 }} />
                <View>
                  <Text style={{ color: THEME.colors.textMuted, fontFamily: THEME.fonts.arabic, fontSize: 11 }}>
                    إحداثيات الموقع الجغرافي
                  </Text>
                  <Text style={{ color: THEME.colors.textPrimary, fontFamily: THEME.fonts.arabicBold, fontSize: 13.5, marginTop: 1 }}>
                    {latitude.toFixed(4)}°N · {longitude.toFixed(4)}°E
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: 'rgba(197, 160, 89, 0.1)',
                  borderColor: THEME.colors.goldBorder,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: THEME.colors.goldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 11.5 }}>
                  حساب فلكي دقيق
                </Text>
              </View>
            </View>
          </View>

          {/* Astrolabe Calibration Tip */}
          <View
            style={{
              backgroundColor: 'rgba(23, 32, 44, 0.8)',
              borderColor: 'rgba(197, 160, 89, 0.2)',
              borderWidth: 1,
              borderRadius: 20,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="sync-circle-outline"
              size={22}
              color={THEME.colors.gold}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                flex: 1,
                color: THEME.colors.textSecondary,
                fontFamily: THEME.fonts.arabic,
                fontSize: 12,
                lineHeight: 19,
              }}
            >
              نصيحة المعايرة: أمسك الهاتف بشكل أفقي مستوٍ على راحة يدك، وحركه في الهواء على شكل الرقم (8) لمعايرة حساس البوصلة المغناطيسي بدقة.
            </Text>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FORTRESS OF THE MUSLIM & ADHKAR LIST                              */}
      {/* ========================================================================= */}
      {screenTab === 'adhkar' && (
        <View>
          {/* Adhkar Category Selector Horizontal Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexDirection: 'row', marginBottom: 16 }}
          >
            {categories.map((c) => {
              const isSelected = activeCategory === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setActiveCategory(c.key as any)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: isSelected ? THEME.colors.gold : THEME.colors.surface,
                    borderColor: isSelected ? THEME.colors.goldLight : THEME.colors.cardBorder,
                    borderWidth: 1,
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 18,
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...THEME.shadows.card,
                  }}
                >
                  <Ionicons
                    name={c.icon as any}
                    size={16}
                    color={isSelected ? '#0A0E13' : THEME.colors.gold}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: isSelected ? '#0A0E13' : THEME.colors.textSecondary,
                      fontFamily: isSelected ? THEME.fonts.arabicBold : THEME.fonts.arabic,
                      fontSize: 13.5,
                    }}
                  >
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Adhkar Items with Tap-to-Count */}
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
                  borderRadius: 22,
                  padding: 16,
                  marginBottom: 12,
                  ...THEME.shadows.card,
                  ...(isDone ? THEME.shadows.glowEmerald : {}),
                }}
              >
                {/* Header: Progress Badge & Status */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isDone ? THEME.colors.emeraldDeep : THEME.colors.surfaceElevated,
                      borderColor: isDone ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={isDone ? 'checkmark-circle' : 'finger-print'}
                      size={14}
                      color={isDone ? THEME.colors.emeraldLight : THEME.colors.goldLight}
                      style={{ marginRight: 5 }}
                    />
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

                  {isDone ? (
                    <Text
                      style={{
                        color: THEME.colors.emeraldLight,
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 12,
                      }}
                    >
                      اكتمل الذكر ✓
                    </Text>
                  ) : (
                    <Text
                      style={{
                        color: THEME.colors.textMuted,
                        fontFamily: THEME.fonts.arabic,
                        fontSize: 11,
                      }}
                    >
                      المس في أي مكان للعد ⚡
                    </Text>
                  )}
                </View>

                {/* Dhikr Arabic Body with authentic Quranic typography */}
                <Text
                  style={{
                    color: THEME.colors.textPrimary,
                    fontFamily: THEME.fonts.quran,
                    fontSize: 19.5,
                    lineHeight: 39,
                    textAlign: 'right',
                    marginBottom: 10,
                  }}
                >
                  {dhikr.arabic}
                </Text>

                {/* Virtue / Reward Footnote */}
                {dhikr.rewardAr ? (
                  <View
                    style={{
                      borderTopColor: 'rgba(255, 255, 255, 0.05)',
                      borderTopWidth: 1,
                      paddingTop: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Text
                      style={{
                        color: THEME.colors.gold,
                        fontFamily: THEME.fonts.arabic,
                        fontSize: 12,
                        textAlign: 'right',
                      }}
                    >
                      ⭐ {dhikr.rewardAr}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};
