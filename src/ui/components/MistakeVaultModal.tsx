import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';
import { MistakeVaultService, FlaggedMistake } from '../../core/memorization/mistakeVault';

interface MistakeVaultModalProps {
  visible: boolean;
  onClose: () => void;
  onJumpToPage: (page: number) => void;
}

export const MistakeVaultModal: React.FC<MistakeVaultModalProps> = ({
  visible,
  onClose,
  onJumpToPage,
}) => {
  const vault = MistakeVaultService.getInstance();
  const [mistakes, setMistakes] = useState<FlaggedMistake[]>(() => vault.getAllMistakes());

  const handleResolve = (m: FlaggedMistake) => {
    vault.removeMistake(m.surah_id, m.ayah_number, m.word_text);
    setMistakes(vault.getAllMistakes());
  };

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
          backgroundColor: 'rgba(3, 5, 8, 0.8)',
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
            maxHeight: '85%',
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

          {/* Header */}
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
                  fontSize: 16.5,
                }}
              >
                سجل الأخطاء ومواضع التعثر
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11, fontFamily: THEME.fonts.arabic }}>
                {mistakes.length} مواضع مسجلة للمراجعة والتثبيت
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {mistakes.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="shield-checkmark" size={48} color={THEME.colors.emeraldLight} style={{ marginBottom: 12 }} />
                <Text
                  style={{
                    color: THEME.colors.textPrimary,
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 16,
                    marginBottom: 6,
                  }}
                >
                  سجل الأخطاء نظيف تماماً!
                </Text>
                <Text
                  style={{
                    color: THEME.colors.textMuted,
                    fontFamily: THEME.fonts.arabic,
                    fontSize: 12,
                    textAlign: 'center',
                    paddingHorizontal: 20,
                  }}
                >
                  عند تفعيل وضع التحفيظ والتسميع، المس أي كلمة أو آية تتعثر فيها لتسجيلها هنا والتركيز عليها في مراجعتك.
                </Text>
              </View>
            ) : (
              mistakes.map((m) => (
                <View
                  key={m.id}
                  style={{
                    backgroundColor: THEME.colors.surfaceElevated,
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    borderWidth: 1.2,
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#EF4444', fontSize: 10.5, fontWeight: 'bold' }}>
                        {m.mistake_type === 'tajweed' ? 'تجويد' : 'حفظ'} · {m.review_count}x
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: THEME.colors.goldLight,
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 13.5,
                      }}
                    >
                      سورة {m.surah_name_ar} · الآية {m.ayah_number}
                    </Text>
                  </View>

                  {/* Word snippet */}
                  <Text
                    style={{
                      color: THEME.colors.textPrimary,
                      fontFamily: THEME.fonts.quran,
                      fontSize: 18,
                      textAlign: 'right',
                      marginBottom: 10,
                    }}
                  >
                    «{m.word_text}»
                  </Text>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        onJumpToPage(m.page_number);
                        onClose();
                      }}
                      style={{
                        backgroundColor: 'rgba(197, 160, 89, 0.15)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ color: THEME.colors.gold, fontSize: 11, fontFamily: THEME.fonts.arabicBold }}>
                        فتح الصفحة {m.page_number} ⚡
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleResolve(m)}
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 10,
                      }}
                    >
                      <Text style={{ color: THEME.colors.emeraldLight, fontSize: 11, fontFamily: THEME.fonts.arabicBold }}>
                        تم الإتقان ✓
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
