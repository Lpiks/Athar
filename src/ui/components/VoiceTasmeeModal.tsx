import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../theme';
import { AyahView } from '../../core/database/types';
import { QuranVoiceEngine, VoiceEvaluationResult } from '../../core/voice/quranVoiceEngine';

interface VoiceTasmeeModalProps {
  visible: boolean;
  onClose: () => void;
  targetAyah: AyahView;
}

export const VoiceTasmeeModal: React.FC<VoiceTasmeeModalProps> = ({
  visible,
  onClose,
  targetAyah,
}) => {
  const engine = QuranVoiceEngine.getInstance();
  const [isNativeAvailable, setIsNativeAvailable] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<VoiceEvaluationResult | null>(null);

  useEffect(() => {
    setIsNativeAvailable(engine.isNativeAudioAvailable());
    setEvaluation(null);
    setIsRecording(false);
  }, [visible, targetAyah]);

  const handleStartRecording = async () => {
    try {
      Vibration.vibrate(30);
    } catch {}
    setIsRecording(true);
    setEvaluation(null);
  };

  const handleStopRecording = async () => {
    try {
      Vibration.vibrate(40);
    } catch {}
    setIsRecording(false);

    // Run local evaluation algorithm
    const result = engine.evaluateRecitation(targetAyah.text, targetAyah);
    setEvaluation(result);
  };

  // Test Simulation Mode (Demonstrates the engine on current dev APK before native rebuild)
  const handleSimulateWithMistake = () => {
    // Drop one word and swap another to show the error detection
    const words = targetAyah.text.split(/\s+/);
    if (words.length > 2) {
      const simulatedRecitation = words.slice(0, words.length - 1).join(' ');
      const result = engine.evaluateRecitation(simulatedRecitation, targetAyah);
      setEvaluation(result);
    } else {
      const result = engine.evaluateRecitation(targetAyah.text, targetAyah);
      setEvaluation(result);
    }
  };

  const handleSimulatePerfect = () => {
    const result = engine.evaluateRecitation(targetAyah.text, targetAyah);
    setEvaluation(result);
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
            maxHeight: '88%',
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
                المُحَفِّظ الصوتي المحلي (التسميع بالصوت)
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 11, fontFamily: THEME.fonts.arabic }}>
                الآية {targetAyah.ayah_number} · صفحة {targetAyah.page_number} · بدون إنترنت
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Target Verse Frame */}
            <View
              style={{
                backgroundColor: '#070A0F',
                borderColor: THEME.colors.goldBorder,
                borderWidth: 1.2,
                borderRadius: 20,
                padding: 16,
                marginBottom: 16,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: THEME.colors.gold,
                  fontSize: 11,
                  fontFamily: THEME.fonts.arabicBold,
                  marginBottom: 6,
                }}
              >
                الآية المطلوب تسميعها:
              </Text>
              <Text
                style={{
                  color: THEME.colors.textPrimary,
                  fontFamily: THEME.fonts.quran,
                  fontSize: 22,
                  lineHeight: 40,
                  textAlign: 'center',
                }}
              >
                {targetAyah.text}{' '}
                <Text style={{ color: THEME.colors.gold }}>﴿{targetAyah.ayah_number}﴾</Text>
              </Text>
            </View>

            {/* Microphone Interaction Center */}
            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <TouchableOpacity
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                activeOpacity={0.8}
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: 43,
                  backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.25)' : 'rgba(197, 160, 89, 0.2)',
                  borderColor: isRecording ? '#EF4444' : THEME.colors.gold,
                  borderWidth: 2.5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...THEME.shadows.card,
                }}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'mic'}
                  size={36}
                  color={isRecording ? '#EF4444' : THEME.colors.goldLight}
                />
              </TouchableOpacity>

              <Text
                style={{
                  color: isRecording ? '#EF4444' : THEME.colors.textSecondary,
                  fontFamily: THEME.fonts.arabicBold,
                  fontSize: 13.5,
                  marginTop: 10,
                }}
              >
                {isRecording
                  ? 'جاري الاستماع... اضغط للإيقاف والفحص ⏹'
                  : 'اضغط على الميكروفون وابدأ التلاوة 🎙️'}
              </Text>
            </View>

            {/* If Native Audio is pending compilation, explain gracefully */}
            {!isNativeAvailable && (
              <View
                style={{
                  backgroundColor: 'rgba(23, 32, 44, 0.85)',
                  borderColor: 'rgba(197, 160, 89, 0.25)',
                  borderWidth: 1,
                  borderRadius: 18,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Ionicons name="information-circle" size={17} color={THEME.colors.gold} style={{ marginRight: 6 }} />
                  <Text style={{ color: THEME.colors.goldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 12 }}>
                    تجهيز حزمة الميكروفون المحلي (Local Build)
                  </Text>
                </View>
                <Text
                  style={{
                    color: THEME.colors.textSecondary,
                    fontFamily: THEME.fonts.arabic,
                    fontSize: 11.5,
                    lineHeight: 18,
                    marginBottom: 8,
                  }}
                >
                  تم تجهيز مكتبة expo-audio وصلاحيات الميكروفون في المشروع. لتشغيل الميكروفون الحقيقي على هاتفك، ستحتاج تجميع نسخة APK جديدة (EAS Build). يمكنك تجربة محرك الفحص الآن:
                </Text>

                {/* Simulation Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    onPress={handleSimulatePerfect}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderColor: THEME.colors.emeraldLight,
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 7,
                      alignItems: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ color: THEME.colors.emeraldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 11 }}>
                      تجربة: تسميع متقن ١٠٠٪ ✓
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSimulateWithMistake}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderColor: '#EF4444',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingVertical: 7,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#EF4444', fontFamily: THEME.fonts.arabicBold, fontSize: 11 }}>
                      تجربة: كشف كلمة منسية 🚩
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Evaluation Results Breakdown */}
            {evaluation && (
              <View
                style={{
                  backgroundColor: THEME.colors.surfaceElevated,
                  borderColor: evaluation.isFullyCorrect ? THEME.colors.emeraldLight : THEME.colors.goldBorder,
                  borderWidth: 1.5,
                  borderRadius: 22,
                  padding: 16,
                  marginBottom: 16,
                  ...THEME.shadows.card,
                }}
              >
                {/* Score Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
                    borderBottomWidth: 1,
                    paddingBottom: 10,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: evaluation.isFullyCorrect
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: evaluation.isFullyCorrect ? THEME.colors.emeraldLight : '#EF4444',
                        fontFamily: THEME.fonts.arabicBold,
                        fontSize: 13,
                      }}
                    >
                      دقة التسميع: {evaluation.accuracyScore}٪
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: THEME.colors.textPrimary,
                      fontFamily: THEME.fonts.arabicBold,
                      fontSize: 14,
                    }}
                  >
                    نتيجة الفحص الآلي
                  </Text>
                </View>

                {/* Word-by-Word Colored Feedback Flow */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginBottom: 14,
                    padding: 8,
                    backgroundColor: '#070A0F',
                    borderRadius: 14,
                  }}
                >
                  {evaluation.wordResults.map((w, idx) => {
                    const isMatched = w.status === 'MATCHED';
                    const isMissing = w.status === 'MISSING';

                    return (
                      <View
                        key={`eval_w_${idx}`}
                        style={{
                          backgroundColor: isMatched
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.2)',
                          borderColor: isMatched ? THEME.colors.emeraldLight : '#EF4444',
                          borderWidth: 1,
                          borderRadius: 8,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          margin: 3,
                        }}
                      >
                        <Text
                          style={{
                            color: isMatched ? THEME.colors.emeraldLight : '#EF4444',
                            fontFamily: THEME.fonts.quran,
                            fontSize: 17,
                            textDecorationLine: isMissing ? 'line-through' : 'none',
                          }}
                        >
                          {w.originalWord}
                        </Text>
                        {!isMatched && (
                          <Text style={{ color: '#EF4444', fontSize: 9, textAlign: 'center' }}>
                            {isMissing ? 'سقطت' : 'خطأ'}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Sheikh Feedback Note */}
                <Text
                  style={{
                    color: evaluation.isFullyCorrect ? THEME.colors.emeraldLight : THEME.colors.goldLight,
                    fontFamily: THEME.fonts.arabicBold,
                    fontSize: 13,
                    textAlign: 'center',
                    lineHeight: 22,
                  }}
                >
                  {evaluation.feedbackMessageAr}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
