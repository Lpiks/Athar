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
  SURAHS_CATALOG,
  PAGES_CATALOG,
  JUZ_CATALOG,
  PageMeta,
} from '../../core/database';

export const MushafScreen: React.FC = () => {
  // Riwaya: Warsh vs Hafs
  const [riwaya, setRiwaya] = useState<Riwaya>('WARSH');
  // Visual Mode: Parchment (ورقي) vs Obsidian Night (ليلي)
  const [isParchment, setIsParchment] = useState<boolean>(true);
  // Dynamic Font Size Scaling for comfortable reading
  const [fontSize, setFontSize] = useState<number>(23);

  // Medina Mushaf Page State (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageAyahs, setPageAyahs] = useState<AyahView[]>([]);
  const [isPageLoading, setIsPageLoading] = useState<boolean>(false);

  // Jump to page modal state
  const [isJumpModalOpen, setIsJumpModalOpen] = useState<boolean>(false);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Comprehensive Catalog Drawer State (Surahs, Juz, Pages)
  const [isIndexModalOpen, setIsIndexModalOpen] = useState<boolean>(false);
  const [indexTab, setIndexTab] = useState<'surahs' | 'juz' | 'pages'>('surahs');
  const [surahFilterQuery, setSurahFilterQuery] = useState<string>('');

  // Tafsir Sheet Modal State
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState<AyahView | null>(null);
  const [activeTafsirType, setActiveTafsirType] = useState<TafsirType>('MUYASSAR');
  const [tafsirContent, setTafsirContent] = useState<string>('');
  const [isTafsirLoading, setIsTafsirLoading] = useState<boolean>(false);

  // Global Quran Search State
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number>(0);

  const vault = QuranVaultService.getInstance();

  // Current page metadata
  const currentPageMeta: PageMeta | undefined = PAGES_CATALOG.find((p) => p.page === currentPage) || PAGES_CATALOG[0];

  // Primary Surah on this page
  const primarySurahId = currentPageMeta?.surah_ids[0] || 1;
  const primarySurah: Surah = SURAHS_CATALOG.find((s) => s.id === primarySurahId) || SURAHS_CATALOG[0];

  // Load Ayahs for current Medina Mushaf page
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsPageLoading(true);
      const rows = await vault.getAyahsByPage(currentPage, riwaya);
      if (isMounted) {
        setPageAyahs(rows);
        setIsPageLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentPage, riwaya]);

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

  // Fast Full-Text Search
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
      const surahName = SURAHS_CATALOG.find((s) => s.id === ayah.surah_id)?.name_ar || '';
      await Share.share({
        message: `${ayah.text}\n\n[سورة ${surahName}: الآية ${ayah.ayah_number} - صفحة ${ayah.page_number} - رواية ${riwaya === 'WARSH' ? 'ورش عن نافع' : 'حفص عن عاصم'}]\nتطبيق أَثَر (صدقة جارية)`,
      });
    } catch {}
  };

  // Page Navigation Handlers
  const goToNextPage = () => {
    if (currentPage < 604) {
      setCurrentPage((p) => p + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  const handleDirectJump = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= 604) {
      setCurrentPage(targetPage);
      setIsJumpModalOpen(false);
      setIsIndexModalOpen(false);
      setJumpPageInput('');
    }
  };

  // Color Palette switches based on mode
  const bgCanvas = isParchment ? THEME.colors.parchment : THEME.colors.canvas;
  const bgPage = isParchment ? THEME.colors.parchmentSurface : THEME.colors.surface;
  const borderCol = isParchment ? THEME.colors.parchmentBorder : THEME.colors.cardBorder;
  const textMain = isParchment ? THEME.colors.parchmentInk : THEME.colors.textPrimary;
  const goldTone = isParchment ? THEME.colors.parchmentGold : THEME.colors.gold;
  const headerText = isParchment ? '#6D4C1B' : THEME.colors.goldLight;

  // Filter Surahs
  const filteredSurahs = SURAHS_CATALOG.filter(
    (s) =>
      s.name_ar.includes(surahFilterQuery) ||
      s.name_transliteration.toLowerCase().includes(surahFilterQuery.toLowerCase()) ||
      String(s.id) === surahFilterQuery.trim()
  );

  // Group ayahs on this page by Surah to render Surah title banners if an ayah is ayah_number === 1
  const surahsOnThisPage = Array.from(new Set(pageAyahs.map((a) => a.surah_id)));

  return (
    <View style={{ flex: 1, backgroundColor: bgCanvas }} className="p-3">
      {/* Top Controls Bar */}
      <View
        style={{
          backgroundColor: bgPage,
          borderColor: borderCol,
          borderWidth: 1,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 8,
          marginBottom: 10,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...THEME.shadows.card,
        }}
      >
        {/* Left: Index Drawer Pill */}
        <TouchableOpacity
          onPress={() => setIsIndexModalOpen(true)}
          style={{
            backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.12)' : THEME.colors.surfaceElevated,
            borderColor: goldTone,
            borderWidth: 1,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 13, marginLeft: 4 }}>
            الفهرس ▾
          </Text>
          <Text style={{ color: THEME.colors.textMuted, fontSize: 11, fontFamily: THEME.fonts.arabic }}>
            (ص {currentPage})
          </Text>
        </TouchableOpacity>

        {/* Center: Dual Riwaya Switcher */}
        <View
          style={{
            backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
            borderRadius: 12,
            padding: 3,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setRiwaya('WARSH')}
            style={{
              backgroundColor: riwaya === 'WARSH' ? goldTone : 'transparent',
              paddingHorizontal: 10,
              paddingVertical: 4,
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
              paddingVertical: 4,
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

        {/* Right Action Icons: Font Size, Theme & Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Font Size Scaling */}
          <TouchableOpacity
            onPress={() => setFontSize((prev) => Math.max(18, prev - 2))}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              paddingHorizontal: 7,
              paddingVertical: 5,
              borderRadius: 9,
              marginRight: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: textMain }}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFontSize((prev) => Math.min(34, prev + 2))}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              paddingHorizontal: 7,
              paddingVertical: 5,
              borderRadius: 9,
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: textMain }}>A+</Text>
          </TouchableOpacity>

          {/* Theme Toggle (Parchment vs Obsidian) */}
          <TouchableOpacity
            onPress={() => setIsParchment(!isParchment)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 6,
              borderRadius: 10,
              marginRight: 6,
            }}
          >
            <Text style={{ fontSize: 13 }}>{isParchment ? '🌙' : '📜'}</Text>
          </TouchableOpacity>

          {/* Search Trigger */}
          <TouchableOpacity
            onPress={() => setIsSearchModalOpen(true)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 6,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 13 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Medina Mushaf Book Page (إطار الصفحة الملكي) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View
          style={{
            backgroundColor: bgPage,
            borderColor: goldTone,
            borderWidth: 2,
            borderRadius: 22,
            padding: 14,
            ...THEME.shadows.card,
          }}
        >
          {/* Top Page Header (ترويسة الصفحة: السورة · الجزء · الصفحة) */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomColor: borderCol,
              borderBottomWidth: 1,
              paddingBottom: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
              سُورَةُ {primarySurah.name_ar}
            </Text>

            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabic, fontSize: 12 }}>
              الجزء {currentPageMeta.juz} · الحزب {currentPageMeta.hizb}
            </Text>

            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
              صفحة {currentPage}
            </Text>
          </View>

          {/* Verses Flow & Surah Title Cartouches */}
          {pageAyahs.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: THEME.colors.textMuted }}>جاري تحميل الصفحة...</Text>
            </View>
          ) : (
            <View>
              {surahsOnThisPage.map((sId) => {
                const surahMeta = SURAHS_CATALOG.find((s) => s.id === sId) || primarySurah;
                const surahAyahsOnPage = pageAyahs.filter((a) => a.surah_id === sId);
                const hasFirstAyah = surahAyahsOnPage.some((a) => a.ayah_number === 1);

                return (
                  <View key={`surah_block_${sId}`} style={{ marginBottom: 14 }}>
                    {/* Render Majestic Gilded Surah Banner if Surah starts on this page */}
                    {hasFirstAyah && (
                      <View style={{ marginVertical: 10 }}>
                        <View
                          style={{
                            borderColor: goldTone,
                            borderWidth: 1.5,
                            borderRadius: 16,
                            paddingVertical: 10,
                            paddingHorizontal: 14,
                            backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.1)' : THEME.colors.surfaceElevated,
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: goldTone,
                              fontFamily: THEME.fonts.arabicBold,
                              fontSize: 22,
                              letterSpacing: 1,
                            }}
                          >
                            سُورَةُ {surahMeta.name_ar}
                          </Text>
                          <Text
                            style={{
                              color: THEME.colors.textMuted,
                              fontFamily: THEME.fonts.arabic,
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            {surahMeta.type === 'meccan' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'} · {surahMeta.total_ayahs} آيَاتٍ
                          </Text>
                        </View>

                        {/* Sacred Basmalah (Omitted for At-Tawbah 9 and Al-Fatihah 1 where it is ayah 1) */}
                        {surahMeta.id !== 9 && surahMeta.id !== 1 && (
                          <View style={{ alignItems: 'center', marginVertical: 8 }}>
                            <Text
                              style={{
                                color: goldTone,
                                fontSize: Math.round(fontSize * 1.1),
                                fontFamily: THEME.fonts.quran,
                                textAlign: 'center',
                              }}
                            >
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Ayahs Text Flow for this Surah */}
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
                      {surahAyahsOnPage.map((ayah) => (
                        <Text
                          key={`ayah_${ayah.id}`}
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
                );
              })}
            </View>
          )}

          {/* Gilded Page Bottom Ornament */}
          <View
            style={{
              borderTopColor: borderCol,
              borderTopWidth: 1,
              paddingTop: 8,
              marginTop: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
              — {currentPage} —
            </Text>
          </View>
        </View>

        {/* Physical Book Bottom Navigation Dock (تقليب صفحات المصحف) */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: bgPage,
            borderColor: borderCol,
            borderWidth: 1,
            borderRadius: 18,
            paddingVertical: 10,
            paddingHorizontal: 12,
            marginTop: 12,
            ...THEME.shadows.card,
          }}
        >
          {/* Previous Page (السابق: move to page - 1 in RTL) */}
          <TouchableOpacity
            onPress={goToPrevPage}
            disabled={currentPage <= 1}
            style={{
              backgroundColor: currentPage <= 1 ? 'transparent' : (isParchment ? 'rgba(160, 124, 54, 0.14)' : THEME.colors.surfaceElevated),
              borderColor: currentPage <= 1 ? 'transparent' : goldTone,
              borderWidth: currentPage <= 1 ? 0 : 1,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,
              opacity: currentPage <= 1 ? 0.3 : 1,
            }}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
              السابق ▶
            </Text>
          </TouchableOpacity>

          {/* Center Jump Pill */}
          <TouchableOpacity
            onPress={() => setIsJumpModalOpen(true)}
            style={{
              alignItems: 'center',
              paddingVertical: 4,
              paddingHorizontal: 12,
            }}
          >
            <Text style={{ color: textMain, fontFamily: THEME.fonts.arabicBold, fontSize: 14 }}>
              صفحة {currentPage} من ٦٠٤
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 10, fontFamily: THEME.fonts.arabic }}>
              انقر للانتقال المباشر ⚡
            </Text>
          </TouchableOpacity>

          {/* Next Page (التالي: move to page + 1 in RTL) */}
          <TouchableOpacity
            onPress={goToNextPage}
            disabled={currentPage >= 604}
            style={{
              backgroundColor: currentPage >= 604 ? 'transparent' : (isParchment ? 'rgba(160, 124, 54, 0.14)' : THEME.colors.surfaceElevated),
              borderColor: currentPage >= 604 ? 'transparent' : goldTone,
              borderWidth: currentPage >= 604 ? 0 : 1,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 12,
              opacity: currentPage >= 604 ? 0.3 : 1,
            }}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
              ◀ التالي
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reading Guidance Hint */}
        <Text
          style={{ color: THEME.colors.textMuted, textAlign: 'center', marginTop: 10, fontSize: 11 }}
        >
          💡 انقر على أي آية لاستعراض التفسير الميسر وتفسير السعدي
        </Text>
      </ScrollView>

      {/* Direct Page Jump Modal */}
      <Modal
        visible={isJumpModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsJumpModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: THEME.colors.surface,
              borderColor: THEME.colors.goldBorder,
              borderWidth: 1.5,
              borderRadius: 22,
              padding: 20,
              width: '100%',
              maxWidth: 340,
            }}
          >
            <Text style={{ color: THEME.colors.goldLight, fontSize: 17, fontFamily: THEME.fonts.arabicBold, textAlign: 'center', marginBottom: 6 }}>
              انتقال مباشر إلى صفحة المصحف
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 14 }}>
              أدخل رقم الصفحة من ١ إلى ٦٠٤
            </Text>

            <TextInput
              keyboardType="number-pad"
              placeholder={`مثال: ${currentPage}`}
              placeholderTextColor={THEME.colors.textMuted}
              value={jumpPageInput}
              onChangeText={setJumpPageInput}
              autoFocus
              style={{
                backgroundColor: THEME.colors.surfaceElevated,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                borderRadius: 14,
                color: THEME.colors.goldLight,
                fontSize: 22,
                fontWeight: 'bold',
                textAlign: 'center',
                paddingVertical: 10,
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setIsJumpModalOpen(false)}
                style={{
                  flex: 1,
                  backgroundColor: THEME.colors.surfaceElevated,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginRight: 6,
                }}
              >
                <Text style={{ color: THEME.colors.textSecondary }}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const num = parseInt(jumpPageInput, 10);
                  if (!isNaN(num)) {
                    handleDirectJump(num);
                  }
                }}
                style={{
                  flex: 1,
                  backgroundColor: THEME.colors.gold,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginLeft: 6,
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold' }}>انتقال</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comprehensive Catalog Modal Drawer (Surahs / Juz / Quick Jump) */}
      <Modal
        visible={isIndexModalOpen}
        animationType="slide"
        onRequestClose={() => setIsIndexModalOpen(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: THEME.colors.canvas }}>
          <View style={{ flex: 1, padding: 16 }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setIsIndexModalOpen(false)}
                style={{
                  backgroundColor: THEME.colors.surfaceElevated,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: THEME.colors.textSecondary }}>إغلاق ✕</Text>
              </TouchableOpacity>
              <Text style={{ color: THEME.colors.goldLight, fontSize: 17, fontFamily: THEME.fonts.arabicBold }}>
                فهرس المصحف الشريف (٦٠٤ صفحة)
              </Text>
            </View>

            {/* Catalog Tabs (السور · الأجزاء · الصفحات) */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: THEME.colors.surfaceElevated,
                borderRadius: 14,
                padding: 4,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => setIndexTab('surahs')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: indexTab === 'surahs' ? THEME.colors.gold : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: indexTab === 'surahs' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
                  السور (١١٤)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIndexTab('juz')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: indexTab === 'juz' ? THEME.colors.gold : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: indexTab === 'juz' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
                  الأجزاء (٣٠)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIndexTab('pages')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: indexTab === 'pages' ? THEME.colors.gold : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: indexTab === 'pages' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 13 }}>
                  الصفحات
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: Surahs List */}
            {indexTab === 'surahs' && (
              <View style={{ flex: 1 }}>
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
                    paddingVertical: 10,
                    textAlign: 'right',
                    marginBottom: 10,
                  }}
                />

                <ScrollView showsVerticalScrollIndicator={false}>
                  {filteredSurahs.map((s) => (
                    <TouchableOpacity
                      key={`catalog_surah_${s.id}`}
                      onPress={() => handleDirectJump(s.page_number)}
                      style={{
                        backgroundColor: THEME.colors.surface,
                        borderColor: THEME.colors.cardBorder,
                        borderWidth: 1,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View
                          style={{
                            backgroundColor: THEME.colors.goldGlass,
                            borderColor: THEME.colors.goldBorder,
                            borderWidth: 1,
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 10,
                          }}
                        >
                          <Text style={{ color: THEME.colors.goldLight, fontWeight: 'bold', fontSize: 12 }}>
                            {s.id}
                          </Text>
                        </View>
                        <View>
                          <Text style={{ color: THEME.colors.textPrimary, fontSize: 15, fontFamily: THEME.fonts.arabicBold }}>
                            سورة {s.name_ar}
                          </Text>
                          <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                            {s.type === 'meccan' ? 'مكية' : 'مدنية'} · {s.total_ayahs} آيات
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: THEME.colors.gold, fontSize: 12, fontWeight: 'bold' }}>
                          صفحة {s.page_number}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Tab 2: Juz List */}
            {indexTab === 'juz' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {JUZ_CATALOG.map((j) => (
                  <TouchableOpacity
                    key={`catalog_juz_${j.id}`}
                    onPress={() => handleDirectJump(j.page_number)}
                    style={{
                      backgroundColor: THEME.colors.surface,
                      borderColor: THEME.colors.cardBorder,
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 8,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                          {j.id}
                        </Text>
                      </View>
                      <Text style={{ color: THEME.colors.textPrimary, fontSize: 16, fontFamily: THEME.fonts.arabicBold }}>
                        {j.name_ar}
                      </Text>
                    </View>

                    <Text style={{ color: THEME.colors.gold, fontSize: 13, fontWeight: 'bold' }}>
                      صفحة {j.page_number} ◀
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Tab 3: Direct Page Grid Jump */}
            {indexTab === 'pages' && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <Text style={{ color: THEME.colors.goldLight, fontSize: 18, fontFamily: THEME.fonts.arabicBold, marginBottom: 8 }}>
                  الانتقال السريع لصفحة محددة
                </Text>
                <Text style={{ color: THEME.colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                  أدخل رقم الصفحة مباشرة لفتحها في الحال
                </Text>

                <TextInput
                  keyboardType="number-pad"
                  placeholder="رقم الصفحة (١ - ٦٠٤)"
                  placeholderTextColor={THEME.colors.textMuted}
                  value={jumpPageInput}
                  onChangeText={setJumpPageInput}
                  style={{
                    backgroundColor: THEME.colors.surface,
                    borderColor: THEME.colors.goldBorder,
                    borderWidth: 1.5,
                    borderRadius: 16,
                    color: THEME.colors.goldLight,
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    width: 220,
                    marginBottom: 20,
                  }}
                />

                <TouchableOpacity
                  onPress={() => {
                    const num = parseInt(jumpPageInput, 10);
                    if (!isNaN(num)) {
                      handleDirectJump(num);
                    }
                  }}
                  style={{
                    backgroundColor: THEME.colors.gold,
                    paddingVertical: 12,
                    paddingHorizontal: 36,
                    borderRadius: 14,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 15 }}>فتح الصفحة</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tafsir Bottom Sheet Drawer Modal */}
      <Modal
        visible={selectedAyahForTafsir !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAyahForTafsir(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
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
            {/* Handle */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View style={{ backgroundColor: THEME.colors.cardBorder, width: 40, height: 4, borderRadius: 2 }} />
            </View>

            {/* Selected Verse Context */}
            {selectedAyahForTafsir && (
              <View style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ color: THEME.colors.gold, fontSize: 13, fontWeight: 'bold' }}>
                    سورة {SURAHS_CATALOG.find((s) => s.id === selectedAyahForTafsir.surah_id)?.name_ar} · آية {selectedAyahForTafsir.ayah_number} (صفحة {selectedAyahForTafsir.page_number})
                  </Text>
                  <TouchableOpacity onPress={() => handleShareAyah(selectedAyahForTafsir)}>
                    <Text style={{ color: THEME.colors.emeraldLight, fontSize: 12 }}>مشاركة ↗</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: THEME.colors.textPrimary, fontSize: 16, lineHeight: 30, textAlign: 'right' }}>
                  {selectedAyahForTafsir.text}
                </Text>
              </View>
            )}

            {/* Tafsir Book Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 12, marginBottom: 12 }}>
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
                <Text style={{ color: activeTafsirType === 'MUYASSAR' ? '#000' : THEME.colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>
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
                <Text style={{ color: activeTafsirType === 'SAADI' ? '#000' : THEME.colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>
                  تفسير السعدي
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tafsir Text Body */}
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
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

            <TouchableOpacity
              onPress={() => setSelectedAyahForTafsir(null)}
              style={{
                backgroundColor: THEME.colors.surfaceElevated,
                borderColor: THEME.colors.cardBorder,
                borderWidth: 1,
                paddingVertical: 12,
                borderRadius: 16,
                alignItems: 'center',
                marginTop: 14,
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
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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
              <Text style={{ color: THEME.colors.goldLight, fontSize: 17, fontFamily: THEME.fonts.arabicBold }}>
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
              <Text style={{ color: THEME.colors.textMuted, fontSize: 12, marginBottom: 10, textAlign: 'right' }}>
                عثر على {searchResults.length} موضع في {searchLatencyMs} مللي ثانية ⚡
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {searchResults.map((match) => (
                <TouchableOpacity
                  key={`search_${match.id || match.surah_id}_${match.ayah_number}`}
                  onPress={() => {
                    if (match.page_number) {
                      handleDirectJump(match.page_number);
                    } else {
                      // Fallback lookup from catalog
                      const sMeta = SURAHS_CATALOG.find((s) => s.id === match.surah_id);
                      if (sMeta) handleDirectJump(sMeta.page_number);
                    }
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: THEME.colors.gold, fontSize: 12, fontWeight: 'bold' }}>
                      سورة {match.surah_name_ar} · الآية {match.ayah_number}
                    </Text>
                    {match.page_number && (
                      <Text style={{ color: THEME.colors.textMuted, fontSize: 11 }}>
                        صفحة {match.page_number} ◀
                      </Text>
                    )}
                  </View>
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
