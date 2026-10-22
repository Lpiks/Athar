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
  // Main Sub-Tab: 'qibla' (بوصلة القبلة) vs 'adhkar' (حصن المسلم والأذكار)
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
          // Calculate heading in degrees from magnetic north
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

  // Cardinal direction label for current phone heading
  const getHeadingCardinal = (deg: number) => {
    const dirs = ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب'];
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

  // 12 Astrolabe Degree Ticks around the 360° dial
  const dialTicks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

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
          borderRadius: 18,
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
            borderRadius: 14,
            backgroundColor: screenTab === 'qibla' ? THEME.colors.gold : 'transparent',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="compass"
            size={17}
            color={screenTab === 'qibla' ? '#000' : THEME.colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: THEME.fonts.arabicBold,
              fontSize: 13.5,
              color: screenTab === 'qibla' ? '#000' : THEME.colors.textSecondary,
            }}
          >
            بوصلة القبلة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreenTab('adhkar')}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: screenTab === 'adhkar' ? THEME.colors.gold : 'transparent',
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="book-outline"
            size={17}
            color={screenTab === 'adhkar' ? '#000' : THEME.colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontFamily: THEME.fonts.arabicBold,
              fontSize: 13.5,
              color: screenTab === 'adhkar' ? '#000' : THEME.colors.textSecondary,
            }}
          >
            حصن المسلم
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================================= */}
      {/* TAB 1: ROYAL ASTRONOMICAL QIBLA COMPASS                                  */}
      {/* ========================================================================= */}
      {screenTab === 'qibla' && (
        <View>
          {/* Master Compass Card */}
          <View
            style={{
              backgroundColor: THEME.colors.surface,
              borderColor: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
              borderWidth: 1.6,
              borderRadius: 28,
              paddingVertical: 22,
              paddingHorizontal: 16,
              alignItems: 'center',
              marginBottom: 16,
              ...THEME.shadows.card,
              ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : {}),
            }}
          >
            {/* Top Subtitle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons
                name="location-sharp"
                size={14}
                color={isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: THEME.colors.textSecondary,
                  fontFamily: THEME.fonts.arabic,
                  fontSize: 12,
                }}
              >
                مكة المكرمة · الكعبة المشرفة (المسجد الحرام)
              </Text>
            </View>

            {/* Dynamic Status Banner */}
            <View
              style={{
                backgroundColor: isAlignedWithQibla
                  ? 'rgba(16, 185, 129, 0.16)'
                  : 'rgba(197, 160, 89, 0.12)',
                borderColor: isAlignedWithQibla
                  ? THEME.colors.emeraldLight
                  : THEME.colors.goldBorder,
                borderWidth: 1,
                borderRadius: 20,
                paddingVertical: 7,
                paddingHorizontal: 16,
                marginBottom: 18,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons
                name={isAlignedWithQibla ? 'checkmark-circle' : 'navigate-circle-outline'}
                size={17}
                color={isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 14,
                }}
              >
                {isAlignedWithQibla
                  ? 'أنت باتجاه القبلة المشرفة بدقة (١٠٠٪) ✓'
                  : delta > 0
                  ? `⟳ أدر الهاتف يميناً بمقدار ${Math.round(delta)}°`
                  : `⟲ أدر الهاتف يساراً بمقدار ${Math.round(Math.abs(delta))}°`}
              </Text>
            </View>

            {/* =================================================================== */}
            {/* THE ASTRONOMICAL COMPASS DIAL (270px Diameter)                     */}
            {/* =================================================================== */}
            <View
              style={{
                width: 270,
                height: 270,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                marginVertical: 10,
              }}
            >
              {/* Outer Glow Halo */}
              <View
                style={{
                  position: 'absolute',
                  width: 268,
                  height: 268,
                  borderRadius: 134,
                  borderWidth: 1,
                  borderColor: isAlignedWithQibla
                    ? 'rgba(52, 211, 153, 0.3)'
                    : 'rgba(197, 160, 89, 0.25)',
                }}
              />

              {/* 1. ROTATING COMPASS DIAL (Oriented to True/Magnetic Heading) */}
              <View
                style={{
                  width: 256,
                  height: 256,
                  borderRadius: 128,
                  backgroundColor: THEME.colors.surfaceElevated,
                  borderColor: isAlignedWithQibla ? THEME.colors.emerald : THEME.colors.gold,
                  borderWidth: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transform: [{ rotate: `${(-heading).toFixed(1)}deg` }],
                  ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : THEME.shadows.glowGold),
                }}
              >
                {/* Concentric Astrolabe Inner Ring */}
                <View
                  style={{
                    position: 'absolute',
                    width: 200,
                    height: 200,
                    borderRadius: 100,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(197, 160, 89, 0.25)',
                  }}
                />

                {/* Concentric Astrolabe Middle Ring */}
                <View
                  style={{
                    position: 'absolute',
                    width: 150,
                    height: 150,
                    borderRadius: 75,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                />

                {/* 12 Radial Hour / Degree Ticks */}
                {dialTicks.map((tickAngle) => {
                  const isMajor = tickAngle % 90 === 0;
                  return (
                    <View
                      key={`tick_${tickAngle}`}
                      style={{
                        position: 'absolute',
                        width: 2,
                        height: 246,
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        transform: [{ rotate: `${tickAngle}deg` }],
                      }}
                    >
                      <View
                        style={{
                          width: isMajor ? 3 : 1.5,
                          height: isMajor ? 11 : 6,
                          backgroundColor: isMajor
                            ? tickAngle === 0
                              ? '#EF4444' // North is crimson
                              : THEME.colors.gold
                            : 'rgba(255, 255, 255, 0.25)',
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  );
                })}

                {/* Cardinal Direction 1: NORTH (شمال) at 0° */}
                <View
                  style={{
                    position: 'absolute',
                    top: 13,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>
                    ش
                  </Text>
                  <Text style={{ color: '#EF4444', fontSize: 8.5, fontWeight: '700' }}>
                    N
                  </Text>
                </View>

                {/* Cardinal Direction 2: EAST (شرق) at 90° */}
                <View
                  style={{
                    position: 'absolute',
                    right: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: THEME.colors.gold, fontWeight: 'bold', fontSize: 13 }}>
                    ق
                  </Text>
                  <Text style={{ color: THEME.colors.goldLight, fontSize: 8.5 }}>
                    E
                  </Text>
                </View>

                {/* Cardinal Direction 3: SOUTH (جنوب) at 180° */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 13,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: THEME.colors.textMuted, fontWeight: 'bold', fontSize: 12 }}>
                    ج
                  </Text>
                  <Text style={{ color: THEME.colors.textMuted, fontSize: 8.5 }}>
                    S
                  </Text>
                </View>

                {/* Cardinal Direction 4: WEST (غرب) at 270° */}
                <View
                  style={{
                    position: 'absolute',
                    left: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: THEME.colors.textMuted, fontWeight: 'bold', fontSize: 12 }}>
                    غ
                  </Text>
                  <Text style={{ color: THEME.colors.textMuted, fontSize: 8.5 }}>
                    W
                  </Text>
                </View>

                {/* KAABA BEACON (موقع الكعبة على قرص البوصلة) */}
                {/* Positioned on the rotating dial at the exact calculated bearing */}
                <View
                  style={{
                    position: 'absolute',
                    width: 256,
                    height: 256,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    transform: [{ rotate: `${qiblaBearing.toFixed(1)}deg` }],
                  }}
                >
                  {/* Glowing Laser Beam from Center to Kaaba */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 24,
                      width: 2,
                      height: 104,
                      backgroundColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.goldLight,
                      opacity: 0.7,
                    }}
                  />

                  {/* Kaaba Golden Badge on the Ring */}
                  <View
                    style={{
                      marginTop: -4,
                      backgroundColor: '#000',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      borderWidth: 2,
                      borderRadius: 18,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      flexDirection: 'row',
                      alignItems: 'center',
                      ...(isAlignedWithQibla ? THEME.shadows.glowEmerald : THEME.shadows.glowGold),
                    }}
                  >
                    <Text style={{ fontSize: 11, marginRight: 2 }}>🕋</Text>
                    <Text
                      style={{
                        color: isAlignedWithQibla
                          ? THEME.colors.emeraldLight
                          : THEME.colors.goldLight,
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 10,
                      }}
                    >
                      القبلة
                    </Text>
                  </View>
                </View>

                {/* Central Islamic Astrolabe Medallion (خاتم سليمان / النجمة الإسلامية) */}
                <View
                  style={{
                    width: 76,
                    height: 76,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* 8-Pointed Star: Square 1 */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 58,
                      height: 58,
                      backgroundColor: '#090D12',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : 'rgba(197, 160, 89, 0.4)',
                      borderWidth: 1.2,
                      borderRadius: 6,
                    }}
                  />

                  {/* 8-Pointed Star: Square 2 (Rotated 45°) */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 58,
                      height: 58,
                      backgroundColor: '#090D12',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : 'rgba(197, 160, 89, 0.4)',
                      borderWidth: 1.2,
                      borderRadius: 6,
                      transform: [{ rotate: '45deg' }],
                    }}
                  />

                  {/* Center Core Circle with Kaaba Emblem */}
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: isAlignedWithQibla
                        ? THEME.colors.emeraldDeep
                        : '#141C26',
                      borderColor: isAlignedWithQibla
                        ? THEME.colors.emeraldLight
                        : THEME.colors.gold,
                      borderWidth: 1.5,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons
                      name="cube"
                      size={18}
                      color={isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.gold}
                    />
                  </View>
                </View>
              </View>

              {/* 2. FIXED TOP SIGHTING RETICLE (At 12 o'clock / Forward Phone Axis) */}
              <View
                style={{
                  position: 'absolute',
                  top: -8,
                  alignItems: 'center',
                  zIndex: 20,
                }}
              >
                {/* Triangle Chevron Pointing Down */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                    borderTopWidth: 13,
                    borderStyle: 'solid',
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: isAlignedWithQibla
                      ? THEME.colors.emeraldLight
                      : THEME.colors.gold,
                  }}
                />
              </View>
            </View>

            {/* Live Heading & Direction Footer */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <Text
                style={{
                  color: isAlignedWithQibla ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 22,
                }}
              >
                {Math.round(heading)}° {getHeadingCardinal(heading)}
              </Text>
              <Text
                style={{
                  color: THEME.colors.textMuted,
                  fontFamily: THEME.fonts.arabic,
                  fontSize: 11.5,
                }}
              >
                {hasSensor
                  ? 'البوصلة المغناطيسية تعمل بدقة عالية'
                  : 'وضع ثابت (الجهاز لا يحتوي على مستشعر مغناطيسي)'}
              </Text>
            </View>
          </View>

          {/* Telemetry Dashboard Grid */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            {/* Card 1: Qibla Bearing */}
            <View
              style={{
                flex: 1,
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 20,
                padding: 12,
                marginRight: 8,
                alignItems: 'center',
                ...THEME.shadows.card,
              }}
            >
              <Ionicons name="compass-outline" size={20} color={THEME.colors.gold} style={{ marginBottom: 4 }} />
              <Text style={{ color: THEME.colors.textMuted, fontSize: 10, fontFamily: THEME.fonts.arabic }}>
                زاوية القبلة
              </Text>
              <Text
                style={{
                  color: THEME.colors.textPrimary,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 16,
                  marginTop: 2,
                }}
              >
                {qiblaBearing.toFixed(1)}°
              </Text>
              <Text style={{ color: THEME.colors.gold, fontSize: 9.5 }}>
                {qibla.cardinalDirection}
              </Text>
            </View>

            {/* Card 2: Distance to Kaaba */}
            <View
              style={{
                flex: 1.2,
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 20,
                padding: 12,
                alignItems: 'center',
                ...THEME.shadows.card,
              }}
            >
              <Ionicons name="navigate-outline" size={20} color={THEME.colors.emeraldLight} style={{ marginBottom: 4 }} />
              <Text style={{ color: THEME.colors.textMuted, fontSize: 10, fontFamily: THEME.fonts.arabic }}>
                المسافة إلى الكعبة
              </Text>
              <Text
                style={{
                  color: THEME.colors.textPrimary,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 16,
                  marginTop: 2,
                }}
              >
                {qiblaDistanceKm.toLocaleString()} كم
              </Text>
              <Text style={{ color: THEME.colors.emeraldLight, fontSize: 9.5 }}>
                الدائرة العظمى
              </Text>
            </View>

            {/* Card 3: Coordinates */}
            <View
              style={{
                flex: 1,
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 20,
                padding: 12,
                marginLeft: 8,
                alignItems: 'center',
                ...THEME.shadows.card,
              }}
            >
              <Ionicons name="pin-outline" size={20} color={THEME.colors.goldLight} style={{ marginBottom: 4 }} />
              <Text style={{ color: THEME.colors.textMuted, fontSize: 10, fontFamily: THEME.fonts.arabic }}>
                موقعك الحالي
              </Text>
              <Text
                style={{
                  color: THEME.colors.textPrimary,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {latitude.toFixed(2)}°N
              </Text>
              <Text style={{ color: THEME.colors.textSecondary, fontSize: 9.5 }}>
                {longitude.toFixed(2)}°E
              </Text>
            </View>
          </View>

          {/* Compass Calibration & Accuracy Notice Card */}
          <View
            style={{
              backgroundColor: 'rgba(23, 32, 44, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderRadius: 18,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="bulb-outline"
              size={20}
              color={THEME.colors.gold}
              style={{ marginRight: 10 }}
            />
            <Text
              style={{
                flex: 1,
                color: THEME.colors.textSecondary,
                fontFamily: THEME.fonts.arabic,
                fontSize: 11.5,
                lineHeight: 18,
              }}
            >
              لأعلى دقة: ضع الهاتف أفقياً على راحة يدك، وابتعد عن الأجسام المعدنية أو المغناطيسية. حرك الهاتف على شكل الرقم (8) لمعايرة البوصلة.
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
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 16,
                    marginRight: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...THEME.shadows.card,
                  }}
                >
                  <Ionicons
                    name={c.icon as any}
                    size={15}
                    color={isSelected ? '#000' : THEME.colors.gold}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      color: isSelected ? '#000' : THEME.colors.textSecondary,
                      fontFamily: isSelected ? THEME.fonts.arabicBold : THEME.fonts.arabic,
                      fontSize: 13,
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
