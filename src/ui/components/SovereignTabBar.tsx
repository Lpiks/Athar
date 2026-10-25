/**
 * Athar (أَثَر) - Sovereign Islamic Luxury Floating TabBar (Dock)
 * 
 * Features:
 * - Floating glassmorphic dock with specular gold hairline reflection
 * - Animated tactile spring feedback on tap with native haptic pulses
 * - Illuminated gold champagne capsule for active tab with sacred celestial bead
 * - High-precision typography in Amiri Bold with balanced touch targets
 * - Smooth scroll-to-hide integration for immersive Mushaf reading
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';

export type AppTab = 'prayer' | 'quran' | 'qibla' | 'settings';

interface TabItemConfig {
  id: AppTab;
  title: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItemConfig[] = [
  {
    id: 'prayer',
    title: 'الصلاة',
    iconActive: 'time',
    iconInactive: 'time-outline',
  },
  {
    id: 'quran',
    title: 'المصحف',
    iconActive: 'book',
    iconInactive: 'book-outline',
  },
  {
    id: 'qibla',
    title: 'القبلة والأذكار',
    iconActive: 'compass',
    iconInactive: 'compass-outline',
  },
  {
    id: 'settings',
    title: 'الضبط',
    iconActive: 'settings',
    iconInactive: 'settings-outline',
  },
];

interface SovereignTabBarProps {
  activeTab: AppTab;
  onTabPress: (tab: AppTab) => void;
  translateY: Animated.Value;
  insets: EdgeInsets;
}

interface TabButtonProps {
  config: TabItemConfig;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ config, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, glowAnim]);

  const handlePress = () => {
    // Trigger tactile haptic pulse
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {}

    // Bouncy spring animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.82}
      style={styles.tabTouchTarget}
    >
      <Animated.View
        style={[
          styles.tabContentContainer,
          isActive ? styles.tabContentActive : styles.tabContentInactive,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name={isActive ? config.iconActive : config.iconInactive}
          size={isActive ? 20 : 19}
          color={isActive ? THEME.colors.goldLight : THEME.colors.textMuted}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.tabTitleText,
            {
              color: isActive ? THEME.colors.goldLight : THEME.colors.textMuted,
              fontFamily: isActive ? THEME.fonts.arabicBold : THEME.fonts.arabic,
              fontSize: isActive ? 11 : 10,
            },
          ]}
        >
          {config.title}
        </Text>

        {/* Luminous Celestial Golden Bead */}
        {isActive ? (
          <View style={styles.activeBead} />
        ) : (
          <View style={styles.beadPlaceholder} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const SovereignTabBar: React.FC<SovereignTabBarProps> = ({
  activeTab,
  onTabPress,
  translateY,
  insets,
}) => {
  return (
    <Animated.View
      style={[
        styles.dockContainer,
        {
          bottom: Math.max(insets.bottom + 6, 14),
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Specular curved optical glass highlight at top edge */}
      <View style={styles.specularHighlight} />

      {/* Tab Items Row */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            config={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 68,
    backgroundColor: 'rgba(9, 15, 20, 0.95)',
    borderColor: 'rgba(197, 160, 89, 0.28)',
    borderWidth: 1.2,
    borderRadius: 26,
    paddingHorizontal: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: 'rgba(232, 202, 130, 0.38)',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  tabTouchTarget: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    marginHorizontal: 3,
  },
  tabContentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderRadius: 18,
  },
  tabContentActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.16)',
    borderColor: 'rgba(212, 175, 85, 0.45)',
    borderWidth: 1,
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContentInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  tabTitleText: {
    marginTop: 2,
    textAlign: 'center',
  },
  activeBead: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#E8CA82',
    marginTop: 2,
    shadowColor: '#C5A059',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  beadPlaceholder: {
    width: 4.5,
    height: 4.5,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
});
