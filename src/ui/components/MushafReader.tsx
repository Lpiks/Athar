import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  QuranVaultService,
  Riwaya,
  TafsirType,
  Surah,
  AyahView,
  SearchMatch,
} from '../../core/database';

export const MushafReader: React.FC = () => {
  // Modes: 'page' (604-page Mushaf) vs 'vertical' (fluid reading)
  const [readingMode, setReadingMode] = useState<'page' | 'vertical'>('vertical');
  // Dual Riwaya toggle: Warsh vs Hafs
  const [riwaya, setRiwaya] = useState<Riwaya>('WARSH');

  // Surahs & Ayahs state
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurahId, setSelectedSurahId] = useState<number>(1);
  const [ayahs, setAyahs] = useState<AyahView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Tafsir Sheet
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState<AyahView | null>(null);
  const [tafsirType, setTafsirType] = useState<TafsirType>('MUYASSAR');

  // Search State (< 15ms FTS5)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number>(0);

  const vault = QuranVaultService.getInstance();

  // Load Surahs on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await vault.initialize();
        const list = await vault.getSurahs();
        if (isMounted) {
          setSurahs(list);
          if (list.length > 0) {
            setSelectedSurahId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Vault init error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load Ayahs when Surah or Riwaya changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const rows = await vault.getAyahsBySurah(selectedSurahId, riwaya);
        if (isMounted) {
          setAyahs(rows);
        }
      } catch (err) {
        console.warn('Error fetching ayahs:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedSurahId, riwaya]);

  // FTS5 Search trigger
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const start = performance.now();
    try {
      const results = await vault.search(text, riwaya, 20);
      const elapsed = performance.now() - start;
      setSearchLatencyMs(Number(elapsed.toFixed(2)));
      setSearchResults(results);
    } catch (e) {
      console.warn('Search error:', e);
    }
  };

  const selectedSurah = surahs.find((s) => s.id === selectedSurahId);

  return (
    <View className="bg-void-card border border-void-border rounded-3xl p-5 mb-6">
      {/* Header & Controls */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-gold text-lg font-bold">
            المصحف الشريف · THE MUSHAF
          </Text>
          <Text className="text-spiritual-subtle text-xs">
            خزانة القرآن والتفاسير السيادية (Offline Vault)
          </Text>
        </View>

        {/* Dual Riwaya Switcher */}
        <View className="flex-row bg-void-surface rounded-xl p-1 border border-void-border">
          <TouchableOpacity
            onPress={() => setRiwaya('WARSH')}
            className={`px-3 py-1 rounded-lg ${
              riwaya === 'WARSH' ? 'bg-gold' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                riwaya === 'WARSH' ? 'text-void-pure' : 'text-spiritual-muted'
              }`}
            >
              ورش عن نافع
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRiwaya('HAFS')}
            className={`px-3 py-1 rounded-lg ${
              riwaya === 'HAFS' ? 'bg-gold' : ''
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                riwaya === 'HAFS' ? 'text-void-pure' : 'text-spiritual-muted'
              }`}
            >
              حفص
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Toggle: Authentic Page vs Fluid Vertical */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row bg-void-surface rounded-xl p-1 border border-void-border flex-1 mr-2">
          <TouchableOpacity
            onPress={() => setReadingMode('vertical')}
            className={`flex-1 py-1.5 items-center rounded-lg ${
              readingMode === 'vertical' ? 'bg-emerald-deep border border-emerald-light/40' : ''
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                readingMode === 'vertical' ? 'text-emerald-light' : 'text-spiritual-muted'
              }`}
            >
              القراءة السلسة (Fluid)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setReadingMode('page')}
            className={`flex-1 py-1.5 items-center rounded-lg ${
              readingMode === 'page' ? 'bg-emerald-deep border border-emerald-light/40' : ''
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                readingMode === 'page' ? 'text-emerald-light' : 'text-spiritual-muted'
              }`}
            >
              المصحف المصور (604 ص)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FTS5 Fast Search Input */}
      <View className="mb-4">
        <TextInput
          placeholder="ابحث في كامل القرآن (FTS5 < 15ms)..."
          placeholderTextColor="#52556B"
          value={searchQuery}
          onChangeText={handleSearch}
          className="bg-void-surface text-spiritual-text px-4 py-2.5 rounded-2xl border border-void-border text-right text-sm"
        />
        {isSearching && (
          <Text className="text-spiritual-subtle text-[11px] mt-1 text-right font-mono">
            وجدت {searchResults.length} نتيجة في {searchLatencyMs} مللي ثانية ⚡
          </Text>
        )}
      </View>

      {/* If Searching: Render FTS5 Results */}
      {isSearching && searchResults.length > 0 ? (
        <ScrollView style={{ maxHeight: 300 }} className="mb-2">
          {searchResults.map((m) => (
            <TouchableOpacity
              key={`${m.surah_id}_${m.ayah_number}`}
              onPress={() => {
                setSelectedSurahId(m.surah_id);
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="p-3 my-1 rounded-xl bg-void-surface border border-void-border/80"
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-gold text-xs font-bold">
                  سورة {m.surah_name_ar} · آية {m.ayah_number}
                </Text>
              </View>
              <Text className="text-spiritual-text text-sm leading-6 text-right font-uthmani">
                {m.text}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {/* Surah Selector Pills */}
      {!isSearching && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 flex-row"
        >
          {surahs.slice(0, 30).map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => setSelectedSurahId(s.id)}
              className={`px-3 py-1.5 rounded-full mr-2 border ${
                selectedSurahId === s.id
                  ? 'bg-gold-light/20 border-gold'
                  : 'bg-void-surface border-void-border'
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedSurahId === s.id ? 'text-gold-light font-bold' : 'text-spiritual-muted'
                }`}
              >
                {s.name_ar} ({s.id})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Surah Header Banner */}
      {selectedSurah && !isSearching && (
        <View className="items-center py-3 mb-4 rounded-2xl bg-void-surface/60 border border-gold/20">
          <Text className="text-gold text-xl font-bold font-uthmani">
            سُورَةُ {selectedSurah.name_ar}
          </Text>
          <Text className="text-spiritual-subtle text-[11px] mt-0.5">
            {selectedSurah.type === 'meccan' ? 'مكية' : 'مدنية'} · {selectedSurah.total_ayahs} آية · {riwaya === 'WARSH' ? 'رواية ورش عن نافع' : 'رواية حفص عن عاصم'}
          </Text>
        </View>
      )}

      {/* Ayahs Display */}
      {loading ? (
        <View className="py-12 items-center justify-center">
          <ActivityIndicator color="#C5A059" />
          <Text className="text-spiritual-subtle text-xs mt-2">
            جاري تحميل آيات الذكر الحكيم...
          </Text>
        </View>
      ) : (
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {readingMode === 'vertical' ? (
            /* Fluid Verse-by-Verse Mode */
            ayahs.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => setSelectedAyahForTafsir(a)}
                className="py-3 px-2 border-b border-void-border/40"
                activeOpacity={0.7}
              >
                <Text className="text-spiritual-text text-lg leading-9 text-right font-uthmani">
                  {a.text}{' '}
                  <Text className="text-gold text-sm font-sans font-bold">
                    ﴿{a.ayah_number}﴾
                  </Text>
                </Text>
                <Text className="text-spiritual-subtle text-[10px] text-left mt-1">
                  انقر لعرض التفسير (الميسر / السعدي)
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            /* Authentic Mushaf Page Mode */
            <View className="p-4 rounded-2xl bg-void-pure border border-gold-muted/40">
              <View className="border border-gold-muted/20 p-4 rounded-xl">
                <Text className="text-spiritual-text text-base leading-10 text-justify font-uthmani">
                  {ayahs.map((a) => (
                    <Text key={a.id}>
                      {a.text}{' '}
                      <Text
                        onPress={() => setSelectedAyahForTafsir(a)}
                        className="text-gold text-xs font-sans font-bold"
                      >
                        ﴿{a.ayah_number}﴾{' '}
                      </Text>
                    </Text>
                  ))}
                </Text>
              </View>
              <View className="items-center mt-2">
                <Text className="text-spiritual-subtle text-[11px] font-mono">
                  صفحة المصحف · اضغط على رقم الآية للتفسير
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Sheet Tafsir Modal */}
      <Modal
        visible={selectedAyahForTafsir !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedAyahForTafsir(null)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-void-card border-t border-gold/30 rounded-t-3xl p-6 max-h-[80%]">
            {/* Sheet Handle */}
            <View className="w-12 h-1 bg-void-border rounded-full self-center mb-4" />

            {selectedAyahForTafsir && (
              <>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gold-light text-base font-bold">
                    تفسير الآية ﴿{selectedAyahForTafsir.ayah_number}﴾
                  </Text>

                  {/* Tafsir Switcher */}
                  <View className="flex-row bg-void-surface rounded-xl p-1 border border-void-border">
                    <TouchableOpacity
                      onPress={() => setTafsirType('MUYASSAR')}
                      className={`px-3 py-1 rounded-lg ${
                        tafsirType === 'MUYASSAR' ? 'bg-gold' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          tafsirType === 'MUYASSAR'
                            ? 'text-void-pure'
                            : 'text-spiritual-muted'
                        }`}
                      >
                        التفسير الميسر
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setTafsirType('SAADI')}
                      className={`px-3 py-1 rounded-lg ${
                        tafsirType === 'SAADI' ? 'bg-gold' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          tafsirType === 'SAADI'
                            ? 'text-void-pure'
                            : 'text-spiritual-muted'
                        }`}
                      >
                        تفسير السعدي
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Selected Ayah Text */}
                <View className="p-3 mb-4 rounded-xl bg-void-surface border border-gold/20">
                  <Text className="text-spiritual-text text-base leading-8 text-right font-uthmani">
                    {selectedAyahForTafsir.text}
                  </Text>
                </View>

                {/* Tafsir Text Scrollable */}
                <ScrollView className="mb-4">
                  <Text className="text-spiritual-text text-sm leading-7 text-right">
                    {tafsirType === 'MUYASSAR'
                      ? selectedAyahForTafsir.tafsir_muyassar
                      : selectedAyahForTafsir.tafsir_saadi}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  onPress={() => setSelectedAyahForTafsir(null)}
                  className="py-3 rounded-2xl bg-void-surface border border-void-border items-center"
                >
                  <Text className="text-spiritual-text text-sm font-semibold">
                    إغلاق التفسير
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};
