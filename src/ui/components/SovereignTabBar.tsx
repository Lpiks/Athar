/**
 * Athar (أَثَر) - Minimalist & Elegant Bottom Navigation Bar (Simple et Beau)
 * 
 * Clean, modern, reliable, and completely native crash-free.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
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
    title: 'الإعدادات',
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

export const SovereignTabBar: React.FC<SovereignTabBarProps> = ({
  activeTab,
  onTabPress,
  translateY,
  insets,
}) => {
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Animated.View
      style={[
        styles.barContainer,
        {
          paddingBottom: bottomPadding,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const activeColor = THEME.colors.gold;
          const inactiveColor = '#6B7280';

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.65}
              style={styles.tabButton}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={22}
                color={isActive ? activeColor : inactiveColor}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontFamily: isActive ? THEME.fonts.arabicBold : THEME.fonts.arabic,
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0F14',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    textAlign: 'center',
  },
});
