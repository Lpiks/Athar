import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Modal,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  JuzMeta,
  PageMeta,
} from '../../core/database';
import {
  detectWordTajweedRules,
  getWordTajweedColor,
  TAJWEED_COLORS,
  TajweedRuleType,
} from '../../core/memorization/tajweed';
import { MistakeVaultService } from '../../core/memorization/mistakeVault';
import { TajweedInspectorModal } from './TajweedInspectorModal';
import { HifdhQuizModal } from './HifdhQuizModal';
import { MistakeVaultModal } from './MistakeVaultModal';
import { VoiceTasmeeModal } from './VoiceTasmeeModal';

function getFirstLetterCues(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const match = word.match(/[\u0621-\u064A]/);
      return match ? match[0] + 'ـ..' : '..';
    })
    .join(' ');
}

export interface MushafScreenProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const MushafScreen: React.FC<MushafScreenProps> = ({ onScroll }) => {
  const insets = useSafeAreaInsets();
  const pageScrollRef = useRef<ScrollView>(null);

  // Riwaya: Warsh vs Hafs
  const [riwaya, setRiwaya] = useState<Riwaya>('WARSH');
  // Visual Mode: Parchment (ورقي) vs Obsidian Night (ليلي)
  const [isParchment, setIsParchment] = useState<boolean>(true);
  // Dynamic Font Size Scaling
  const [fontSize, setFontSize] = useState<number>(23);

  // Medina Mushaf Page State (1 to 604)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageAyahs, setPageAyahs] = useState<AyahView[]>([]);

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

  // Hifdh (Memorization) & Tajweed Suite State
  const [isHifdhActive, setIsHifdhActive] = useState<boolean>(false);
  const [isTajweedColored, setIsTajweedColored] = useState<boolean>(false);
  const [maskMode, setMaskMode] = useState<'NONE' | 'ALL' | 'FIRST_LETTER'>('NONE');
  const [revealedAyahs, setRevealedAyahs] = useState<Record<number, boolean>>({});

  // Tajweed & Hifdh Modals
  const [selectedTajweedWord, setSelectedTajweedWord] = useState<{
    wordText: string;
    surahId: number;
    ayahNumber: number;
    pageNumber: number;
    rules: TajweedRuleType[];
  } | null>(null);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isMistakeVaultOpen, setIsMistakeVaultOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voiceTargetAyah, setVoiceTargetAyah] = useState<AyahView | null>(null);
  const mistakeVault = MistakeVaultService.getInstance();

  // Reset revealed ayahs when flipping page
  useEffect(() => {
    setRevealedAyahs({});
  }, [currentPage]);

  const vault = QuranVaultService.getInstance();

  // Current page metadata
  const currentPageMeta: PageMeta = useMemo(() => {
    return PAGES_CATALOG.find((p) => p.page === currentPage) || PAGES_CATALOG[0];
  }, [currentPage]);

  // Primary Surah on this page
  const primarySurahId = currentPageMeta?.surah_ids[0] || 1;
  const primarySurah: Surah = useMemo(() => {
    return SURAHS_CATALOG.find((s) => s.id === primarySurahId) || SURAHS_CATALOG[0];
  }, [primarySurahId]);

  // Instant 0ms loading for Medina Mushaf page
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const rows = await vault.getAyahsByPage(currentPage, riwaya);
      if (isMounted) {
        setPageAyahs(rows);
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

  // Auto-scroll to top whenever page changes so reader immediately sees the first line
  useEffect(() => {
    pageScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentPage]);

  // Page Navigation Handlers
  const goToNextPage = () => {
    if (currentPage < 604) {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
      setCurrentPage((p) => p + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
      setCurrentPage((p) => p - 1);
    }
  };

  const handleDirectJump = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= 604) {
      pageScrollRef.current?.scrollTo({ y: 0, animated: false });
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

  // Memoized Filtered Surahs
  const filteredSurahs = useMemo(() => {
    if (!surahFilterQuery.trim()) return SURAHS_CATALOG;
    const q = surahFilterQuery.trim().toLowerCase();
    return SURAHS_CATALOG.filter(
      (s) =>
        s.name_ar.includes(q) ||
        s.name_transliteration.toLowerCase().includes(q) ||
        String(s.id) === q
    );
  }, [surahFilterQuery]);

  // Group ayahs on this page by Surah
  const surahsOnThisPage = useMemo(() => {
    return Array.from(new Set(pageAyahs.map((a) => a.surah_id)));
  }, [pageAyahs]);

  // Render Virtualized Surah List Item for instant 60fps scrolling
  const renderSurahItem = useCallback(
    ({ item: s }: { item: Surah }) => (
      <TouchableOpacity
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
        activeOpacity={0.7}
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
            صفحة {s.page_number} ◀
          </Text>
        </View>
      </TouchableOpacity>
    ),
    []
  );

  // Render Virtualized Juz List Item
  const renderJuzItem = useCallback(
    ({ item: j }: { item: JuzMeta }) => (
      <TouchableOpacity
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
        activeOpacity={0.7}
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
    ),
    []
  );

  // Render Search Match Item
  const renderSearchItem = useCallback(
    ({ item: match }: { item: SearchMatch }) => (
      <TouchableOpacity
        onPress={() => {
          if (match.page_number) {
            handleDirectJump(match.page_number);
          } else {
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
        activeOpacity={0.7}
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
    ),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: bgCanvas, paddingHorizontal: 12, paddingTop: 6 }}>
      {/* Top Controls Bar */}
      <View
        style={{
          backgroundColor: bgPage,
          borderColor: borderCol,
          borderWidth: 1,
          borderRadius: 18,
          paddingHorizontal: 10,
          paddingVertical: 7,
          marginBottom: 8,
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
            paddingVertical: 5,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5, marginLeft: 4 }}>
            الفهرس ▾
          </Text>
          <Text style={{ color: THEME.colors.textMuted, fontSize: 10.5, fontFamily: THEME.fonts.arabic }}>
            (ص {currentPage})
          </Text>
        </TouchableOpacity>

        {/* Center: Dual Riwaya Switcher */}
        <View
          style={{
            backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
            borderRadius: 10,
            padding: 2.5,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => setRiwaya('WARSH')}
            style={{
              backgroundColor: riwaya === 'WARSH' ? goldTone : 'transparent',
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: riwaya === 'WARSH' ? (isParchment ? '#FFF' : '#000') : THEME.colors.textMuted,
                fontWeight: riwaya === 'WARSH' ? 'bold' : 'normal',
                fontSize: 10.5,
              }}
            >
              ورش
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRiwaya('HAFS')}
            style={{
              backgroundColor: riwaya === 'HAFS' ? goldTone : 'transparent',
              paddingHorizontal: 9,
              paddingVertical: 3.5,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: riwaya === 'HAFS' ? (isParchment ? '#FFF' : '#000') : THEME.colors.textMuted,
                fontWeight: riwaya === 'HAFS' ? 'bold' : 'normal',
                fontSize: 10.5,
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
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
              marginRight: 3,
            }}
          >
            <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: textMain }}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFontSize((prev) => Math.min(34, prev + 2))}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              paddingHorizontal: 6,
              paddingVertical: 4,
              borderRadius: 8,
              marginRight: 5,
            }}
          >
            <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: textMain }}>A+</Text>
          </TouchableOpacity>

          {/* Theme Toggle (Parchment vs Obsidian) */}
          <TouchableOpacity
            onPress={() => setIsParchment(!isParchment)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 5,
              borderRadius: 8,
              marginRight: 5,
            }}
          >
            <Text style={{ fontSize: 12 }}>{isParchment ? '🌙' : '📜'}</Text>
          </TouchableOpacity>

          {/* Hifdh Mode Toggle */}
          <TouchableOpacity
            onPress={() => {
              const nextState = !isHifdhActive;
              setIsHifdhActive(nextState);
              if (nextState) {
                setIsTajweedColored(true);
              }
            }}
            style={{
              backgroundColor: isHifdhActive
                ? (isParchment ? 'rgba(160, 124, 54, 0.2)' : THEME.colors.emeraldDeep)
                : (isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated),
              borderColor: isHifdhActive ? (isParchment ? goldTone : THEME.colors.emeraldLight) : 'transparent',
              borderWidth: 1,
              paddingHorizontal: 7,
              paddingVertical: 4,
              borderRadius: 8,
              marginRight: 5,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, marginRight: 2 }}>🎓</Text>
            <Text
              style={{
                color: isHifdhActive ? (isParchment ? goldTone : THEME.colors.emeraldLight) : textMain,
                fontFamily: THEME.fonts.arabicBold,
                fontSize: 10.5,
              }}
            >
              التحفيظ
            </Text>
          </TouchableOpacity>

          {/* Search Trigger */}
          <TouchableOpacity
            onPress={() => setIsSearchModalOpen(true)}
            style={{
              backgroundColor: isParchment ? '#EAE2D3' : THEME.colors.surfaceElevated,
              padding: 5,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12 }}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Medina Mushaf Book Page (إطار الصفحة الملكي) */}
      <ScrollView
        ref={pageScrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 105 }}
      >
        {/* Hifdh & Tajweed Active Control Dock */}
        {isHifdhActive && (
          <View
            style={{
              backgroundColor: isParchment ? '#EFE7D8' : THEME.colors.surfaceElevated,
              borderColor: isParchment ? borderCol : THEME.colors.cardBorder,
              borderWidth: 1.2,
              borderRadius: 18,
              padding: 10,
              marginBottom: 10,
              ...THEME.shadows.card,
            }}
          >
            {/* Top row: Mask modes & Tajweed toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              {/* Mask Controls */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => {
                    setMaskMode('ALL');
                    setRevealedAyahs({});
                  }}
                  style={{
                    backgroundColor: maskMode === 'ALL' ? goldTone : 'transparent',
                    borderColor: goldTone,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginRight: 4,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontFamily: THEME.fonts.arabicBold, color: maskMode === 'ALL' ? (isParchment ? '#FFF' : '#000') : textMain }}>
                    🙈 حجب الكل
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setMaskMode('FIRST_LETTER');
                    setRevealedAyahs({});
                  }}
                  style={{
                    backgroundColor: maskMode === 'FIRST_LETTER' ? goldTone : 'transparent',
                    borderColor: goldTone,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    marginRight: 4,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontFamily: THEME.fonts.arabicBold, color: maskMode === 'FIRST_LETTER' ? (isParchment ? '#FFF' : '#000') : textMain }}>
                    🔤 رؤوس الكلمات
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMaskMode('NONE')}
                  style={{
                    backgroundColor: maskMode === 'NONE' ? goldTone : 'transparent',
                    borderColor: goldTone,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 10.5, fontFamily: THEME.fonts.arabicBold, color: maskMode === 'NONE' ? (isParchment ? '#FFF' : '#000') : textMain }}>
                    👁️ كشف
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tajweed Color Toggle */}
              <TouchableOpacity
                onPress={() => setIsTajweedColored(!isTajweedColored)}
                style={{
                  backgroundColor: isTajweedColored ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  borderColor: isTajweedColored ? THEME.colors.emeraldLight : borderCol,
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 10.5, fontFamily: THEME.fonts.arabicBold, color: isTajweedColored ? THEME.colors.emeraldLight : textMain }}>
                  🎨 التجويد: {isTajweedColored ? 'مفعّل' : 'معطّل'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action buttons: Voice Tasmee, Quiz & Mistake Vault */}
            <TouchableOpacity
              onPress={() => {
                const target = pageAyahs[0] || null;
                setVoiceTargetAyah(target);
                setIsVoiceModalOpen(true);
              }}
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                borderColor: THEME.colors.emeraldLight,
                borderWidth: 1.2,
                borderRadius: 12,
                paddingVertical: 7,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginBottom: 6,
              }}
            >
              <Ionicons name="mic" size={15} color={THEME.colors.emeraldLight} style={{ marginRight: 6 }} />
              <Text style={{ color: THEME.colors.emeraldLight, fontFamily: THEME.fonts.arabicBold, fontSize: 12 }}>
                🎙️ التسميع الصوتي المحلي (فحص النطق والأخطاء)
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setIsQuizModalOpen(true)}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(197, 160, 89, 0.15)',
                  borderColor: goldTone,
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingVertical: 6,
                  alignItems: 'center',
                  marginRight: 6,
                }}
              >
                <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 11 }}>
                  ⚡ اختبار ربط الآيات
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsMistakeVaultOpen(true)}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  borderColor: '#EF4444',
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingVertical: 6,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#EF4444', fontFamily: THEME.fonts.arabicBold, fontSize: 11 }}>
                  🚩 سجل الأخطاء ({mistakeVault.getMistakesForPage(currentPage).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View
          style={{
            backgroundColor: bgPage,
            borderColor: goldTone,
            borderWidth: 1.8,
            borderRadius: 20,
            padding: 13,
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
              paddingBottom: 7,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
              سُورَةُ {primarySurah.name_ar}
            </Text>

            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabic, fontSize: 11.5 }}>
              الجزء {currentPageMeta.juz} · الحزب {currentPageMeta.hizb}
            </Text>

            <Text style={{ color: headerText, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
              صفحة {currentPage}
            </Text>
          </View>

          {/* Verses Flow & Surah Title Cartouches */}
          {pageAyahs.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <Text style={{ color: THEME.colors.textMuted }}>جاري استحضار الآيات...</Text>
            </View>
          ) : (
            <View>
              {surahsOnThisPage.map((sId) => {
                const surahMeta = SURAHS_CATALOG.find((s) => s.id === sId) || primarySurah;
                const surahAyahsOnPage = pageAyahs.filter((a) => a.surah_id === sId);
                const hasFirstAyah = surahAyahsOnPage.some((a) => a.ayah_number === 1);

                return (
                  <View key={`surah_block_${sId}`} style={{ marginBottom: 12 }}>
                    {/* Render Gilded Surah Banner if Surah starts on this page */}
                    {hasFirstAyah && (
                      <View style={{ marginVertical: 8 }}>
                        <View
                          style={{
                            borderColor: goldTone,
                            borderWidth: 1.5,
                            borderRadius: 14,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.1)' : THEME.colors.surfaceElevated,
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            style={{
                              color: goldTone,
                              fontFamily: THEME.fonts.arabicBold,
                              fontSize: 20,
                              letterSpacing: 1,
                            }}
                          >
                            سُورَةُ {surahMeta.name_ar}
                          </Text>
                          <Text
                            style={{
                              color: THEME.colors.textMuted,
                              fontFamily: THEME.fonts.arabic,
                              fontSize: 10.5,
                              marginTop: 1,
                            }}
                          >
                            {surahMeta.type === 'meccan' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'} · {surahMeta.total_ayahs} آيَاتٍ
                          </Text>
                        </View>

                        {/* Sacred Basmalah for Surah 1 (Al-Fatihah): Standalone on top with Ayah 1 */}
                        {surahMeta.id === 1 && (
                          <View style={{ alignItems: 'center', marginVertical: 10 }}>
                            <Text
                              style={{
                                color: goldTone,
                                fontSize: Math.round(fontSize * 1.15),
                                fontFamily: THEME.fonts.quran,
                                textAlign: 'center',
                              }}
                            >
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ{' '}
                              <Text
                                style={{
                                  fontSize: Math.round(fontSize * 0.8),
                                  fontWeight: 'bold',
                                }}
                              >
                                ﴿١﴾
                              </Text>
                            </Text>
                          </View>
                        )}

                        {/* Sacred Basmalah (For all other Surahs except At-Tawbah 9 and Al-Fatihah 1) */}
                        {surahMeta.id !== 9 && surahMeta.id !== 1 && (
                          <View style={{ alignItems: 'center', marginVertical: 6 }}>
                            <Text
                              style={{
                                color: goldTone,
                                fontSize: Math.round(fontSize * 1.05),
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

                    {/* Ayahs Text Flow */}
                    <Text
                      style={{
                        color: textMain,
                        fontFamily: THEME.fonts.quran,
                        fontSize: fontSize,
                        lineHeight: Math.round(fontSize * 2.2),
                        textAlign: sId === 1 ? 'center' : 'justify',
                        writingDirection: 'rtl',
                      }}
                    >
                      {(sId === 1
                        ? surahAyahsOnPage.filter((a) => a.ayah_number !== 1)
                        : surahAyahsOnPage
                      ).map((ayah) => {
                        const isMaskedAll = isHifdhActive && maskMode === 'ALL' && !revealedAyahs[ayah.id];
                        const isMaskedCues = isHifdhActive && maskMode === 'FIRST_LETTER' && !revealedAyahs[ayah.id];

                        if (isMaskedAll) {
                          return (
                            <Text
                              key={`ayah_${ayah.id}`}
                              onPress={() => setRevealedAyahs((prev) => ({ ...prev, [ayah.id]: true }))}
                              style={{
                                color: goldTone,
                                backgroundColor: isParchment ? 'rgba(160, 124, 54, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                borderRadius: 6,
                              }}
                            >
                              {'  '}[ 🙈 انقر لكشف الآية {ayah.ayah_number} ]{'  '}
                            </Text>
                          );
                        }

                        if (isMaskedCues) {
                          return (
                            <Text
                              key={`ayah_${ayah.id}`}
                              onPress={() => setRevealedAyahs((prev) => ({ ...prev, [ayah.id]: true }))}
                            >
                              {getFirstLetterCues(ayah.text)}{' '}
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
                          );
                        }

                        // Revealed / Active rendering with Tajweed coloration support
                        if (isTajweedColored) {
                          const words = ayah.text.split(/\s+/);
                          return (
                            <Text key={`ayah_${ayah.id}`}>
                              {words.map((w, wIdx) => {
                                const nextW = words[wIdx + 1] || '';
                                const rules = detectWordTajweedRules(w, nextW, riwaya);
                                const wordColor = getWordTajweedColor(rules);
                                const isFlagged = mistakeVault.isFlagged(ayah.surah_id, ayah.ayah_number, w);

                                return (
                                  <Text
                                    key={`word_${ayah.id}_${wIdx}`}
                                    onPress={() => {
                                      if (rules.length > 0 && rules[0] !== 'NORMAL') {
                                        setSelectedTajweedWord({
                                          wordText: w,
                                          surahId: ayah.surah_id,
                                          ayahNumber: ayah.ayah_number,
                                          pageNumber: ayah.page_number,
                                          rules,
                                        });
                                      } else {
                                        setSelectedAyahForTafsir(ayah);
                                      }
                                    }}
                                    onLongPress={() => {
                                      if (isFlagged) {
                                        mistakeVault.removeMistake(ayah.surah_id, ayah.ayah_number, w);
                                      } else {
                                        mistakeVault.flagMistake(
                                          ayah.surah_id,
                                          ayah.ayah_number,
                                          ayah.page_number,
                                          w,
                                          'memory'
                                        );
                                      }
                                    }}
                                    style={{
                                      color: isFlagged
                                        ? '#EF4444'
                                        : wordColor === TAJWEED_COLORS.NORMAL
                                        ? textMain
                                        : wordColor,
                                      backgroundColor: isFlagged ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                                      fontWeight: rules[0] !== 'NORMAL' ? 'bold' : 'normal',
                                    }}
                                  >
                                    {w}{' '}
                                  </Text>
                                );
                              })}
                              <Text
                                onPress={() => setSelectedAyahForTafsir(ayah)}
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
                          );
                        }

                        // Normal plain text flow
                        return (
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
                        );
                      })}
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
              paddingTop: 7,
              marginTop: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
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
            borderRadius: 16,
            paddingVertical: 9,
            paddingHorizontal: 12,
            marginTop: 10,
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
              paddingVertical: 7,
              paddingHorizontal: 13,
              borderRadius: 11,
              opacity: currentPage <= 1 ? 0.3 : 1,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
              السابق ▶
            </Text>
          </TouchableOpacity>

          {/* Center Jump Pill */}
          <TouchableOpacity
            onPress={() => setIsJumpModalOpen(true)}
            style={{
              alignItems: 'center',
              paddingVertical: 3,
              paddingHorizontal: 10,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: textMain, fontFamily: THEME.fonts.arabicBold, fontSize: 13.5 }}>
              صفحة {currentPage} من ٦٠٤
            </Text>
            <Text style={{ color: THEME.colors.textMuted, fontSize: 9.5, fontFamily: THEME.fonts.arabic }}>
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
              paddingVertical: 7,
              paddingHorizontal: 13,
              borderRadius: 11,
              opacity: currentPage >= 604 ? 0.3 : 1,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: goldTone, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
              ◀ التالي
            </Text>
          </TouchableOpacity>
        </View>
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
        <View
          style={{
            flex: 1,
            backgroundColor: THEME.colors.canvas,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: 16,
          }}
        >
          {/* Modal Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
            <Text style={{ color: THEME.colors.goldLight, fontSize: 16.5, fontFamily: THEME.fonts.arabicBold }}>
              فهرس المصحف الشريف (٦٠٤ صفحة)
            </Text>
          </View>

          {/* Catalog Tabs (السور · الأجزاء · الصفحات) */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: THEME.colors.surfaceElevated,
              borderRadius: 12,
              padding: 3,
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setIndexTab('surahs')}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 9,
                backgroundColor: indexTab === 'surahs' ? THEME.colors.gold : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: indexTab === 'surahs' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
                السور (١١٤)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIndexTab('juz')}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 9,
                backgroundColor: indexTab === 'juz' ? THEME.colors.gold : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: indexTab === 'juz' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
                الأجزاء (٣٠)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIndexTab('pages')}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 9,
                backgroundColor: indexTab === 'pages' ? THEME.colors.gold : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: indexTab === 'pages' ? '#000' : THEME.colors.textSecondary, fontFamily: THEME.fonts.arabicBold, fontSize: 12.5 }}>
                الصفحات
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Virtualized Surahs List (Instant 60fps render) */}
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

              <FlatList
                data={filteredSurahs}
                keyExtractor={(s) => `surah_${s.id}`}
                renderItem={renderSurahItem}
                initialNumToRender={14}
                maxToRenderPerBatch={14}
                windowSize={5}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Tab 2: Virtualized Juz List */}
          {indexTab === 'juz' && (
            <FlatList
              data={JUZ_CATALOG}
              keyExtractor={(j) => `juz_${j.id}`}
              renderItem={renderJuzItem}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={5}
              removeClippedSubviews={true}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Tab 3: Direct Page Grid Jump */}
          {indexTab === 'pages' && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Text style={{ color: THEME.colors.goldLight, fontSize: 17, fontFamily: THEME.fonts.arabicBold, marginBottom: 6 }}>
                الانتقال السريع لصفحة محددة
              </Text>
              <Text style={{ color: THEME.colors.textMuted, fontSize: 12.5, textAlign: 'center', marginBottom: 18 }}>
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
                  marginBottom: 18,
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
                  paddingVertical: 11,
                  paddingHorizontal: 36,
                  borderRadius: 14,
                }}
              >
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14.5 }}>فتح الصفحة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Tafsir Bottom Sheet Drawer Modal (Respects bottom system insets) */}
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
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
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
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
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
                borderRadius: 14,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text style={{ color: THEME.colors.textPrimary, fontWeight: 'bold' }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Global Quran Search Modal (Virtualized) */}
      <Modal
        visible={isSearchModalOpen}
        animationType="slide"
        onRequestClose={() => setIsSearchModalOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: THEME.colors.canvas,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
            <Text style={{ color: THEME.colors.goldLight, fontSize: 16.5, fontFamily: THEME.fonts.arabicBold }}>
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
              paddingVertical: 11,
              textAlign: 'right',
              marginBottom: 10,
            }}
          />

          {searchQuery.trim().length > 0 && (
            <Text style={{ color: THEME.colors.textMuted, fontSize: 11.5, marginBottom: 8, textAlign: 'right' }}>
              عثر على {searchResults.length} موضع في {searchLatencyMs} مللي ثانية ⚡
            </Text>
          )}

          <FlatList
            data={searchResults}
            keyExtractor={(item) => `search_${item.id || item.surah_id}_${item.ayah_number}`}
            renderItem={renderSearchItem}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews={true}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Tajweed Rule & Makhraj Inspector Modal */}
      {selectedTajweedWord && (
        <TajweedInspectorModal
          visible={!!selectedTajweedWord}
          onClose={() => setSelectedTajweedWord(null)}
          wordText={selectedTajweedWord.wordText}
          surahId={selectedTajweedWord.surahId}
          ayahNumber={selectedTajweedWord.ayahNumber}
          pageNumber={selectedTajweedWord.pageNumber}
          rules={selectedTajweedWord.rules}
        />
      )}

      {/* Next Ayah Linking Quiz Challenge */}
      <HifdhQuizModal
        visible={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
        pageAyahs={pageAyahs}
        allAyahs={pageAyahs}
      />

      {/* Personal Mistake Vault & Weak Spot Review */}
      <MistakeVaultModal
        visible={isMistakeVaultOpen}
        onClose={() => setIsMistakeVaultOpen(false)}
        onJumpToPage={(p) => {
          handleDirectJump(p);
        }}
      />

      {/* Local Voice Tasmee Modal */}
      {voiceTargetAyah && (
        <VoiceTasmeeModal
          visible={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          targetAyah={voiceTargetAyah}
        />
      )}
    </View>
  );
};
