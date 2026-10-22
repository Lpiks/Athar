import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  SafeAreaView,
  Share,
} from 'react-native';
import { THEME } from '../theme';
import {
  QuranVaultService,
  Riwaya,
  TafsirType,
  Surah,
  AyahView,
  SearchMatch,
} from '../../core/database';
import { SURAHS_CATALOG } from '../../core/database/data/surahsData';

export const MushafScreen: React.FC = () => {
  // Riwaya: Warsh vs Hafs
  const [riwaya, setRiwaya] = useState<Riwaya>('WARSH');
  // Visual Mode: Parchment (ورقي) vs Obsidian Night (ليلي)
  const [isParchment, setIsParchment] = useState<boolean>(true);
  // Dynamic Font Size Scaling for comfortable reading
  const [fontSize, setFontSize] = useState<number>(23);

  // Surahs & Ayahs state
  const [surahs] = useState<Surah[]>(SURAHS_CATALOG);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [ayahs, setAyahs] = useState<AyahView[]>([]);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState<boolean>(false);
  const [surahFilterQuery, setSurahFilterQuery] = useState<string>('');

  // Tafsir Sheet
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState<AyahView | null>(null);
  const [activeTafsirType, setActiveTafsirType] = useState<TafsirType>('MUYASSAR');
  const [tafsirContent, setTafsirContent] = useState<string>('');
  const [isTafsirLoading, setIsTafsirLoading] = useState<boolean>(false);

  // Search State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number>(0);

  const vault = QuranVaultService.getInstance();
  const selectedSurah = surahs.find((s) => s.id === selectedSurahId) || surahs[0];

  // Load Ayahs instantly whenever selectedSurahId or riwaya changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const rows = await vault.getAyahsBySurah(selectedSurahId, riwaya);
      if (isMounted) {
        setAyahs(rows);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSurahId, riwaya]);

  // Load Tafsir when ayah is selected
  useEffect(() => {
    if (!selectedAyahForTafsir) {
      setTafsirContent('');
      return;
    }
    let isMounted = true;
    (async () => {
      setIsTafsirLoading(true);
      const text = await vault.getTafsir(
        selectedAyahForTafsir.surah_id,
        selectedAyahForTafsir.ayah_number,
        activeTafsirType
      );
      if (isMounted) {
        setTafsirContent(text || 'التفسير غير متوفر حالياً.');
        setIsTafsirLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedAyahForTafsir, activeTafsirType]);

  // Execute fast search
  const handleSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    const t0 = performance.now();
    const results = await vault.search(queryText, riwaya, 40);
    const elapsed = performance.now() - t0;
    setSearchLatencyMs(Number(elapsed.toFixed(1)));
    setSearchResults(results);
  };

  const handleShareAyah = async (ayah: AyahView) => {
    try {
      await Share.share({
        message: `${ayah.text}\n\n[سورة ${selectedSurah.name_ar}: الآية ${ayah.ayah_number} - رواية ${riwaya === 'WARSH' ? 'ورش عن نافع' : 'حفص عن عاصم'}]\nتطبيق أَثَر (صدقة جارية)`,
      });
    } catch {}
  };

  // Palette switches based on mode
  const bgCanvas = isParchment ? THEME.colors.parchment : THEME.colors.canvas;
  const bgCard = isParchment ? THEME.colors.parchmentSurface : THEME.colors.surface;
  const borderCol = isParchment ? THEME.colors.parchmentBorder : THEME.colors.cardBorder;
  const textMain = isParchment ? THEME.colors.parchmentInk : THEME.colors.textPrimary;
  const goldTone = isParchment ? THEME.colors.parchmentGold : THEME.colors.gold;

  const filteredSurahs = surahs.filter(
    (s) =>
      s.name_ar.includes(surahFilterQuery) ||
      s.name_transliteration.toLowerCase().includes(surahFilterQuery.toLowerCase()) ||
      String(s.id) === surahFilterQuery.trim()
  );

  return (
    <View style={{ flex: 1, backgroundColor: bgCanvas }} className="p-4">
      {/* Top Floating Control Bar */}
      <View
        style={{
          backgroundColor: bgCard,
          borderColor: borderCol,
          borderWidth: 1,
          borderRadius: 20,
          padding: 10,
          ...THEME.shadows.card,
        }}
        className="flex-row justify-between items-center mb-4"
      >
        {/* Surah Selector Pill */}
        <TouchableOpacity
          onPress={() => setIsSurahModalOpen(true)}
          style={{
            backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.12)' : THEME.colors.surfaceElevated,
            borderColor: goldTone,
            borderWidth: 1,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 14,
          }}
          className="flex-row items-center"
        >
          <Text style={{ color: goldTone }} className="text-sm font-bold font-uthmani ml-1.5">
            سورة {selectedSurah.name_ar} ▾
          </Text>
          <Text style={{ color: THEME.colors.textMuted }} className="text-[11px] font-mono mr-1">
            ({selectedSurah.id})
          </Text>
        </TouchableOpacity>

        {/* Center: Dual Riwaya Switcher */}
        <View
          style={{
            backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
            borderRadius: 12,
            padding: 3,
          }}
          className="flex-row items-center"
        >
          <TouchableOpacity
            onPress={() => setRiwaya('WARSH')}
            style={{
              backgroundColor: riwaya === 'WARSH' ? goldTone : 'transparent',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9,
            }}
          >
            <Text
              style={{
                color: riwaya === 'WARSH' ? (isParchment ? '#FFF' : '#000') : THEME.colors.textMuted,
                fontWeight: riwaya === 'WARSH' ? 'bold' : 'normal',
                fontSize: 11,
              }}
            >
              ورش
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRiwaya('HAFS')}
            style={{
              backgroundColor: riwaya === 'HAFS' ? goldTone : 'transparent',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9,
            }}
          >
            <Text
              style={{
                color: riwaya === 'HAFS' ? (isParchment ? '#FFF' : '#000') : THEME.colors.textMuted,
                fontWeight: riwaya === 'HAFS' ? 'bold' : 'normal',
                fontSize: 11,
              }}
            >
              حفص
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Action Icons: Font Size, Search & Theme Toggle */}
        <View className="flex-row items-center">
          {/* Font Size Decrement */}
          <TouchableOpacity
            onPress={() => setFontSize((prev) => Math.max(18, prev - 2))}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 10,
              marginRight: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: textMain }}>A-</Text>
          </TouchableOpacity>

          {/* Font Size Increment */}
          <TouchableOpacity
            onPress={() => setFontSize((prev) => Math.min(36, prev + 2))}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 10,
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: textMain }}>A+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsParchment(!isParchment)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 8,
              borderRadius: 12,
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>{isParchment ? '🌙' : '📜'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsSearchModalOpen(true)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 8,
              borderRadius: 12,
            }}
          >
            <Text style={{ fontSize: 13 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Mushaf Reading Canvas */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Imperial Golden Surah Frame Header */}
        <View
          style={{
            borderColor: goldTone,
            borderWidth: 2,
            borderRadius: 20,
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.08)' : THEME.colors.surfaceElevated,
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <View className="flex-row items-center justify-between w-full mb-1">
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold }} className="text-xs">
              الجزء {selectedSurah.page_number <= 21 ? '١' : Math.ceil(selectedSurah.page_number / 20)}
            </Text>
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 24 }}>
              سُورَةُ {selectedSurah.name_ar}
            </Text>
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold }} className="text-xs">
              صفحة {selectedSurah.page_number}
            </Text>
          </View>

          <Text style={{ color: THEME.colors.textMuted, fontFamily: THEME.fonts.arabic, fontSize: 12 }}>
            {selectedSurah.type === 'meccan' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'} · {selectedSurah.total_ayahs} آيَاتٍ · رواية {riwaya === 'WARSH' ? 'ورش عن نافع' : 'حفص عن عاصم'}
          </Text>
        </View>

        {/* Ornate Basmalah (Except At-Tawbah 9) */}
        {selectedSurah.id !== 9 && (
          <View className="items-center my-3">
            <Text
              style={{
                color: goldTone,
                fontSize: Math.round(fontSize * 1.15),
                fontFamily: THEME.fonts.quran,
                textAlign: 'center',
                letterSpacing: 1,
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
          </View>
        )}

        {/* Ayahs Flow Layout with Gilded Brackets */}
        <View
          style={{
            backgroundColor: bgCard,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 22,
            padding: 18,
            ...THEME.shadows.card,
          }}
        >
          <Text
            style={{
              color: textMain,
              fontFamily: THEME.fonts.quran,
              fontSize: fontSize,
              lineHeight: Math.round(fontSize * 2.2),
              textAlign: 'justify',
              writingDirection: 'rtl',
            }}
          >
            {ayahs.map((ayah) => (
              <Text
                key={ayah.id}
                onPress={() => setSelectedAyahForTafsir(ayah)}
                suppressHighlighting={false}
              >
                {ayah.text}{' '}
                <Text
                  style={{
                    color: goldTone,
                    fontFamily: THEME.fonts.quran,
                    fontSize: Math.round(fontSize * 0.8),
                    fontWeight: 'bold',
                  }}
                >
                  ﴿{ayah.ayah_number}﴾{' '}
                </Text>
              </Text>
            ))}
          </Text>
        </View>

        {/* Reading Help Note */}
        <Text
          style={{ color: THEME.colors.textMuted }}
          className="text-center text-xs mt-3 mb-6"
        >
          💡 انقر على أي آية لفتح التفسير الميسر وتفسير السعدي والتدبر
        </Text>
      </ScrollView>

      {/* Surahs Index Modal Drawer */}
      <Modal
        visible={isSurahModalOpen}
        animationType="slide"
        onRequestClose={() => setIsSurahModalOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
          <View className="p-4 flex-1">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity
                onPress={() => setIsSurahModalOpen(false)}
                style={{
                  backgroundColor: THEME.colors.surfaceElevated,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: THEME.colors.textSecondary }}>إغلاق ✕</Text>
              </TouchableOpacity>
              <Text style={{ color: THEME.colors.goldLight }} className="text-lg font-bold">
                فهرس سور القرآن الكريم (١١٤ سورة)
              </Text>
            </View>

            {/* Filter Search Input */}
            <TextInput
              placeholder="ابحث باسم السورة أو رقمها..."
              placeholderTextColor={THEME.colors.textMuted}
              value={surahFilterQuery}
              onChangeText={setSurahFilterQuery}
              style={{
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                color: THEME.colors.textPrimary,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                textAlign: 'right',
                marginBottom: 12,
              }}
            />

            {/* Surah List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredSurahs.map((s) => {
                const isSelected = s.id === selectedSurahId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      setSelectedSurahId(s.id);
                      setIsSurahModalOpen(false);
                      setSurahFilterQuery('');
                    }}
                    style={{
                      backgroundColor: isSelected ? THEME.colors.surfaceElevated : THEME.colors.surface,
                      borderColor: isSelected ? THEME.colors.gold : THEME.colors.cardBorder,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderRadius: 16,
                      padding: 14,
                      marginBottom: 8,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View className="flex-row items-center">
                      {/* Surah Number Islamic Badge */}
                      <View
                        style={{
                          backgroundColor: THEME.colors.goldGlass,
                          borderColor: THEME.colors.goldBorder,
                          borderWidth: 1,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ color: THEME.colors.goldLight, fontWeight: 'bold', fontSize: 13 }}>
                          {s.id}
                        </Text>
                      </View>

                      <View>
                        <Text style={{ color: THEME.colors.textPrimary }} className="text-base font-bold font-uthmani">
                          سورة {s.name_ar}
                        </Text>
                        <Text style={{ color: THEME.colors.textMuted }} className="text-xs">
                          {s.name_transliteration} · {s.type === 'meccan' ? 'مكية' : 'مدنية'}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text style={{ color: THEME.colors.gold }} className="text-xs font-semibold">
                        {s.total_ayahs} آيات
                      </Text>
                      <Text style={{ color: THEME.colors.textMuted }} className="text-[11px]">
                        صفحة {s.page_number}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tafsir & Study Bottom Sheet Modal */}
      <Modal
        visible={selectedAyahForTafsir !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAyahForTafsir(null)}
      >
        <View
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: THEME.colors.surface,
              borderColor: THEME.colors.goldBorder,
              borderTopWidth: 2,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 20,
              maxHeight: '75%',
            }}
          >
            {/* Sheet Handle */}
            <View className="items-center mb-3">
              <View
                style={{ backgroundColor: THEME.colors.cardBorder, width: 40, height: 4, borderRadius: 2 }}
              />
            </View>

            {/* Selected Verse Context */}
            {selectedAyahForTafsir && (
              <View className="mb-3 pb-3 border-b border-white/10">
                <View className="flex-row justify-between items-center mb-2">
                  <Text style={{ color: THEME.colors.gold }} className="text-xs font-bold">
                    سورة {selectedSurah.name_ar} · آية {selectedAyahForTafsir.ayah_number}
                  </Text>
                  <TouchableOpacity onPress={() => handleShareAyah(selectedAyahForTafsir)}>
                    <Text style={{ color: THEME.colors.emeraldLight, fontSize: 12 }}>مشاركة ↗</Text>
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    color: THEME.colors.textPrimary,
                    fontSize: 16,
                    lineHeight: 32,
                    textAlign: 'right',
                  }}
                >
                  {selectedAyahForTafsir.text}
                </Text>
              </View>
            )}

            {/* Tafsir Book Toggle */}
            <View className="flex-row bg-white/5 p-1 rounded-xl mb-3">
              <TouchableOpacity
                onPress={() => setActiveTafsirType('MUYASSAR')}
                style={{
                  flex: 1,
                  backgroundColor: activeTafsirType === 'MUYASSAR' ? THEME.colors.gold : 'transparent',
                  paddingVertical: 7,
                  borderRadius: 9,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: activeTafsirType === 'MUYASSAR' ? '#000' : THEME.colors.textSecondary,
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  التفسير الميسر
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTafsirType('SAADI')}
                style={{
                  flex: 1,
                  backgroundColor: activeTafsirType === 'SAADI' ? THEME.colors.gold : 'transparent',
                  paddingVertical: 7,
                  borderRadius: 9,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: activeTafsirType === 'SAADI' ? '#000' : THEME.colors.textSecondary,
                    fontWeight: 'bold',
                    fontSize: 12,
                  }}
                >
                  تفسير السعدي (تيسير الكريم الرحمن)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tafsir Text */}
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  color: THEME.colors.textSecondary,
                  fontSize: 15,
                  lineHeight: 28,
                  textAlign: 'justify',
                  writingDirection: 'rtl',
                }}
              >
                {isTafsirLoading ? 'جاري استحضار التفسير...' : tafsirContent}
              </Text>
            </ScrollView>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setSelectedAyahForTafsir(null)}
              style={{
                backgroundColor: THEME.colors.surfaceElevated,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
                marginTop: 16,
              }}
            >
              <Text style={{ color: THEME.colors.textPrimary, fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Quran Search Modal */}
      <Modal
        visible={isSearchModalOpen}
        animationType="slide"
        onRequestClose={() => setIsSearchModalOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
          <View className="p-4 flex-1">
            <View className="flex-row justify-between items-center mb-3">
              <TouchableOpacity
                onPress={() => {
                  setIsSearchModalOpen(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={{
                  backgroundColor: THEME.colors.surfaceElevated,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: THEME.colors.textSecondary }}>إلغاء</Text>
              </TouchableOpacity>
              <Text style={{ color: THEME.colors.goldLight }} className="text-lg font-bold">
                البحث السريع في القرآن الكريم
              </Text>
            </View>

            <TextInput
              placeholder="اكتب كلمة أو آية (مثال: الصراط المستقيم)..."
              placeholderTextColor={THEME.colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
              style={{
                backgroundColor: THEME.colors.surface,
                borderColor: THEME.colors.goldBorder,
                borderWidth: 1,
                color: THEME.colors.textPrimary,
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 12,
                textAlign: 'right',
                marginBottom: 10,
              }}
            />

            {searchQuery.trim().length > 0 && (
              <Text style={{ color: THEME.colors.textMuted }} className="text-xs mb-3 text-right">
                عثر على {searchResults.length} موضع في {searchLatencyMs} مللي ثانية ⚡
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {searchResults.map((match) => (
                <TouchableOpacity
                  key={`${match.surah_id}_${match.ayah_number}`}
                  onPress={() => {
                    setSelectedSurahId(match.surah_id);
                    setIsSearchModalOpen(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  style={{
                    backgroundColor: THEME.colors.surface,
                    borderColor: THEME.colors.cardBorder,
                    borderWidth: 1,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: THEME.colors.gold, fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                    سورة {match.surah_name_ar} · الآية {match.ayah_number}
                  </Text>
                  <Text style={{ color: THEME.colors.textPrimary, fontSize: 15, lineHeight: 28, textAlign: 'right' }}>
                    {match.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
