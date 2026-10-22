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
import { AyahView } from '../../core/database/types';
import { MistakeVaultService, NextAyahQuizQuestion } from '../../core/memorization/mistakeVault';

interface HifdhQuizModalProps {
  visible: boolean;
  onClose: () => void;
  pageAyahs: AyahView[];
  allAyahs: AyahView[];
}

export const HifdhQuizModal: React.FC<HifdhQuizModalProps> = ({
  visible,
  onClose,
  pageAyahs,
  allAyahs,
}) => {
  const vault = MistakeVaultService.getInstance();
  const [quiz, setQuiz] = useState<NextAyahQuizQuestion | null>(() =>
    vault.generateNextAyahQuiz(pageAyahs, allAyahs)
  );
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setHasAnswered(false);
    setQuiz(vault.generateNextAyahQuiz(pageAyahs, allAyahs));
  };

  const handleSelect = (option: string) => {
    if (hasAnswered || !quiz) return;
    setSelectedOption(option);
    setHasAnswered(true);

    // If incorrect, automatically register in mistake vault
    if (option !== quiz.correct_next_ayah_text) {
      vault.flagMistake(
        1, // general
        quiz.correct_next_ayah_number,
        1,
        quiz.correct_next_ayah_text.slice(0, 30),
        'memory',
        'خطأ في ربط الآية التالية'
      );
    }
  };

  if (!quiz) return null;

  const isCorrect = selectedOption === quiz.correct_next_ayah_text;

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
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: THEME.colors.surface,
            borderColor: THEME.colors.goldBorder,
            borderWidth: 1.5,
            borderRadius: 28,
            padding: 20,
            maxHeight: '85%',
            ...THEME.shadows.card,
          }}
        >
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
                  fontSize: 16,
                }}
              >
                اختبار ربط الآيات وتثبيت الحفظ
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11, fontFamily: THEME.fonts.arabic }}>
                سورة {quiz.surah_name_ar} · الآية {quiz.current_ayah_number}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Prompt Ayah Box */}
            <View
              style={{
                backgroundColor: '#070A0F',
                borderColor: THEME.colors.goldBorder,
                borderWidth: 1,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: THEME.colors.gold, fontSize: 11.5, fontFamily: THEME.fonts.arabicBold, textAlign: 'right', marginBottom: 6 }}>
                الآية الحالية (اقرأ ثم اختر الآية التي تليها مباشرة):
              </Text>
              <Text
                style={{
                  color: THEME.colors.textPrimary,
                  fontFamily: THEME.fonts.quran,
                  fontSize: 20,
                  lineHeight: 38,
                  textAlign: 'right',
                }}
              >
                {quiz.current_ayah_text}{' '}
                <Text style={{ color: THEME.colors.gold }}>﴿{quiz.current_ayah_number}﴾</Text>
              </Text>
            </View>

            {/* Question Label */}
            <Text
              style={{
                color: THEME.colors.goldLight,
                fontFamily: THEME.fonts.arabicBold,
                fontSize: 14.5,
                textAlign: 'right',
                marginBottom: 10,
              }}
            >
              ما هي الآية التالية؟
            </Text>

            {/* 3 Options */}
            {quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isOptionCorrect = opt === quiz.correct_next_ayah_text;

              let bg = THEME.colors.surfaceElevated;
              let border = THEME.colors.cardBorder;
              let textColor = THEME.colors.textPrimary;

              if (hasAnswered) {
                if (isOptionCorrect) {
                  bg = 'rgba(16, 185, 129, 0.2)';
                  border = THEME.colors.emeraldLight;
                  textColor = THEME.colors.emeraldLight;
                } else if (isSelected) {
                  bg = 'rgba(239, 68, 68, 0.2)';
                  border = '#EF4444';
                  textColor = '#EF4444';
                }
              }

              return (
                <TouchableOpacity
                  key={`opt_${idx}`}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(opt)}
                  disabled={hasAnswered}
                  style={{
                    backgroundColor: bg,
                    borderColor: border,
                    borderWidth: 1.5,
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: textColor,
                      fontFamily: THEME.fonts.quran,
                      fontSize: 17,
                      lineHeight: 32,
                      textAlign: 'right',
                      marginRight: 10,
                    }}
                  >
                    {opt}
                  </Text>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {hasAnswered && isOptionCorrect && (
                      <Ionicons name="checkmark" size={16} color={THEME.colors.emeraldLight} />
                    )}
                    {hasAnswered && isSelected && !isOptionCorrect && (
                      <Ionicons name="close" size={16} color="#EF4444" />
                    )}
                    {!hasAnswered && (
                      <Text style={{ color: THEME.colors.gold, fontSize: 11, fontWeight: 'bold' }}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Result Feedback Banner */}
            {hasAnswered && (
              <View
                style={{
                  backgroundColor: isCorrect
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'rgba(239, 68, 68, 0.16)',
                  borderColor: isCorrect ? THEME.colors.emeraldLight : '#EF4444',
                  borderWidth: 1.2,
                  borderRadius: 16,
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 14,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: isCorrect ? THEME.colors.emeraldLight : '#EF4444',
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 14,
                    marginBottom: 4,
                  }}
                >
                  {isCorrect
                    ? 'أحسنت! إجابة صحيحة وتثبيت متقن للآية ✓'
                    : 'خطأ في الربط! تم تسجيل الآية في سجل أخطائك للمراجعة 🚩'}
                </Text>
                <Text style={{ color: THEME.colors.textMuted, fontSize: 11.5, fontFamily: THEME.fonts.arabic }}>
                  الآية التالية الصحيحة هي الآية رقم {quiz.correct_next_ayah_number}
                </Text>
              </View>
            )}

            {/* Next Question / Close Button */}
            {hasAnswered && (
              <TouchableOpacity
                onPress={handleNextQuestion}
                activeOpacity={0.8}
                style={{
                  backgroundColor: THEME.colors.gold,
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: '#0A0E13', fontFamily: THEME.fonts.arabicBold, fontSize: 14 }}>
                  سؤال ربط تالٍ ⚡
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
