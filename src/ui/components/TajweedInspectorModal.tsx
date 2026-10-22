import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';
import {
  TajweedRuleType,
  TAJWEED_RULES_CATALOG,
  TAJWEED_COLORS,
} from '../../core/memorization/tajweed';
import { MistakeVaultService } from '../../core/memorization/mistakeVault';

interface TajweedInspectorModalProps {
  visible: boolean;
  onClose: () => void;
  wordText: string;
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
  rules: TajweedRuleType[];
}

export const TajweedInspectorModal: React.FC<TajweedInspectorModalProps> = ({
  visible,
  onClose,
  wordText,
  surahId,
  ayahNumber,
  pageNumber,
  rules,
}) => {
  const vault = MistakeVaultService.getInstance();
  const isFlagged = vault.isFlagged(surahId, ayahNumber, wordText);

  const toggleMistakeFlag = () => {
    if (isFlagged) {
      vault.removeMistake(surahId, ayahNumber, wordText);
    } else {
      vault.flagMistake(surahId, ayahNumber, pageNumber, wordText, 'tajweed');
    }
    onClose();
  };

  // Distinct recognized rules
  const activeRules = rules.map((r) => TAJWEED_RULES_CATALOG[r]).filter(Boolean);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(3, 5, 8, 0.75)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: THEME.colors.surface,
            borderColor: THEME.colors.goldBorder,
            borderTopWidth: 2,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            maxHeight: '80%',
            ...THEME.shadows.card,
          }}
        >
          {/* Top Handle */}
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
          </View>

          {/* Header with Word & Surah reference */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomColor: THEME.colors.cardBorder,
              borderBottomWidth: 1,
              paddingBottom: 12,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: THEME.colors.surfaceElevated,
                padding: 6,
                borderRadius: 10,
              }}
            >
              <Ionicons name="close" size={20} color={THEME.colors.textSecondary} />
            </TouchableOpacity>

            <View style={{ alignItems: 'flex-end' }}>
              <Text
                style={{
                  color: THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 16,
                }}
              >
                كاشف أحكام التجويد ومخارج الحروف
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11, fontFamily: THEME.fonts.arabic }}>
                الآية {ayahNumber} · صفحة {pageNumber}
              </Text>
            </View>
          </View>

          {/* Large Word Display */}
          <View
            style={{
              backgroundColor: '#070A0F',
              borderColor: THEME.colors.goldBorder,
              borderWidth: 1,
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: THEME.colors.goldLight,
                fontFamily: THEME.fonts.quran,
                fontSize: 30,
                textAlign: 'center',
              }}
            >
              {wordText}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeRules.map((rule, idx) => (
              <View
                key={`${rule.type}_${idx}`}
                style={{
                  backgroundColor: THEME.colors.surfaceElevated,
                  borderColor: rule.color,
                  borderWidth: 1.5,
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 14,
                  ...THEME.shadows.card,
                }}
              >
                {/* Rule Title & Category */}
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
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: rule.color,
                        marginRight: 6,
                      }}
                    />
                    <Text style={{ color: rule.color, fontFamily: THEME.fonts.arabicBold, fontSize: 11 }}>
                      {rule.harakatCount || 'حكم تجويدي'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text
                      style={{
                        color: rule.color,
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 16,
                      }}
                    >
                      {rule.titleAr}
                    </Text>
                    <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                      {rule.categoryAr}
                    </Text>
                  </View>
                </View>

                {/* Explanation */}
                <Text
                  style={{
                    color: THEME.colors.textPrimary,
                    fontFamily: THEME.fonts.arabic,
                    fontSize: 13.5,
                    lineHeight: 22,
                    textAlign: 'right',
                    marginBottom: 10,
                  }}
                >
                  {rule.explanationAr}
                </Text>

                {/* Makhraj & Performance Tip */}
                <View
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 14,
                    padding: 10,
                    marginTop: 4,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: THEME.colors.gold, fontFamily: THEME.fonts.arabicBold, fontSize: 12, marginRight: 5 }}>
                      المخرج الصوتي:
                    </Text>
                    <Ionicons name="mic-outline" size={14} color={THEME.colors.gold} />
                  </View>
                  <Text style={{ color: THEME.colors.textSecondary, fontFamily: THEME.fonts.arabic, fontSize: 12, textAlign: 'right', lineHeight: 18, marginBottom: 8 }}>
                    {rule.makhrajAr}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: THEME.colors.emeraldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 12, marginRight: 5 }}>
                      تنبيه الأداء والإتقان:
                    </Text>
                    <Ionicons name="sparkles-outline" size={14} color={THEME.colors.emeraldLight} />
                  </View>
                  <Text style={{ color: THEME.colors.textSecondary, fontFamily: THEME.fonts.arabic, fontSize: 12, textAlign: 'right', lineHeight: 18 }}>
                    {rule.pronunciationTipAr}
                  </Text>
                </View>
              </View>
            ))}

            {/* Flag as Mistake / Weak Spot Button */}
            <TouchableOpacity
              onPress={toggleMistakeFlag}
              activeOpacity={0.8}
              style={{
                backgroundColor: isFlagged
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(197, 160, 89, 0.15)',
                borderColor: isFlagged ? '#EF4444' : THEME.colors.gold,
                borderWidth: 1.5,
                borderRadius: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 6,
                marginBottom: 20,
              }}
            >
              <Ionicons
                name={isFlagged ? 'flag' : 'flag-outline'}
                size={18}
                color={isFlagged ? '#EF4444' : THEME.colors.gold}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: isFlagged ? '#EF4444' : THEME.colors.goldLight,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 14,
                }}
              >
                {isFlagged ? 'إلغاء وسم الخطأ (تم إتقان الموضع) ✓' : 'وسم كموضع خطأ / تعثر في سجل الحفظ 🚩'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
