/**
 * Athar (أَثَر) Sovereign Tajweed Rules Engine (محرّك أحكام التجويد ومخارج الحروف)
 *
 * Implements classical Quranic phonology and Tajweed classifications:
 * - Ahkam an-Noon as-Sakinah & Tanween (Izhar, Idgham, Iqlab, Ikhfa)
 * - Ahkam al-Meem as-Sakinah (Ikhfa Shafawi, Idgham, Izhar Shafawi)
 * - Qalqalah (Kubra, Sughra across قطب جد)
 * - Ahkam al-Mudood (Lazim 6 counts, Muttasil/Munfasil 4-5 counts, Arid 2-4-6 counts)
 * - Ghunnah Mushaddadah (Nun/Meem Mushaddadah)
 * - Tafkheem & Tarqeeq (Khasa Daght Qiz, Lam & Ra rules)
 * - Full Riwaya awareness (Hafs 'an 'Asim & Warsh 'an Nafi')
 */

import { Riwaya } from '../database/types';

export type TajweedCategory =
  | 'NOON_SAKINAH'
  | 'MEEM_SAKINAH'
  | 'MADD'
  | 'QALQALAH'
  | 'GHUNNAH'
  | 'TAFKHEEM'
  | 'IDGHAM_NO_GHUNNAH';

export type TajweedRuleType =
  | 'IZHAR_HALQI'
  | 'IDGHAM_GHUNNAH'
  | 'IDGHAM_BILA_GHUNNAH'
  | 'IQLAB'
  | 'IKHFA_HAQIQI'
  | 'IKHFA_SHAFAWI'
  | 'IDGHAM_SHAFAWI'
  | 'IZHAR_SHAFAWI'
  | 'QALQALAH_SUGHRA'
  | 'QALQALAH_KUBRA'
  | 'MADD_LAZIM'
  | 'MADD_MUTTASIL'
  | 'MADD_MUNFASIL'
  | 'MADD_ARID'
  | 'GHUNNAH_MUSHADDADAH'
  | 'TAFKHEEM_RA'
  | 'TARQEEQ_RA'
  | 'TAGHLEEZ_LAM_WARSH'
  | 'NORMAL';

export interface TajweedRuleDetail {
  readonly type: TajweedRuleType;
  readonly category: TajweedCategory;
  readonly titleAr: string;
  readonly categoryAr: string;
  readonly color: string;
  readonly harakatCount?: string;
  readonly explanationAr: string;
  readonly makhrajAr: string;
  readonly pronunciationTipAr: string;
}

export const TAJWEED_COLORS = {
  // Madd 6 Harakat (Crimson Red)
  MADD_6: '#EF4444',
  // Madd 4-5 Harakat (Vibrant Orange / Coral)
  MADD_4_5: '#F97316',
  // Madd 2-4-6 Harakat (Warm Amber Gold)
  MADD_2: '#FBBF24',
  // Ghunnah & Ikhfa & Iqlab (Sacred Emerald Green)
  GHUNNAH: '#10B981',
  // Qalqalah (Cyan / Sky Blue)
  QALQALAH: '#0284C7',
  // Tafkheem (Warm Terracotta Bronze)
  TAFKHEEM: '#B45309',
  // Silent / Idgham without Ghunnah (Muted Slate)
  MUTED: '#94A3B8',
  // Standard text (Ivory / Off-white)
  NORMAL: '#F8FAFC',
};

export const TAJWEED_RULES_CATALOG: Record<TajweedRuleType, TajweedRuleDetail> = {
  IZHAR_HALQI: {
    type: 'IZHAR_HALQI',
    category: 'NOON_SAKINAH',
    titleAr: 'إظهار حلقي',
    categoryAr: 'أحكام النون الساكنة والتنوين',
    color: TAJWEED_COLORS.NORMAL,
    harakatCount: 'بدون مد',
    explanationAr: 'إخراج النون الساكنة أو التنوين من مخرجها ناصعة واضحة بغير غنة زائدة عند ملاقاة أحد حروف الحلق الستة: (ء، هـ، ع، ح، غ، خ).',
    makhrajAr: 'الحلق (أقصى، وسط، أو أدنى الحلق بحسب حرف الإظهار).',
    pronunciationTipAr: 'انطق النون والتنوين بوضوح تام وثبات على طرف اللسان دون تمطيط أو غنة زائدة.',
  },
  IDGHAM_GHUNNAH: {
    type: 'IDGHAM_GHUNNAH',
    category: 'NOON_SAKINAH',
    titleAr: 'إدغام بغنة (ناقص)',
    categoryAr: 'أحكام النون الساكنة والتنوين',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'إدخال النون الساكنة أو التنوين في الحرف الذي يليها إذا كان من حروف (ي، ن، م، و) مع بقاء صوت الغنة الرنان بمقدار حركتين.',
    makhrajAr: 'الخيشوم (للغنة) مع مخرج الحرف المدغم فيه.',
    pronunciationTipAr: 'ادمج الحرفين بلطف ودع الصوت يجري في الخيشوم زمناً قدره حركتان قبل الانتقال للحركة التالية.',
  },
  IDGHAM_BILA_GHUNNAH: {
    type: 'IDGHAM_BILA_GHUNNAH',
    category: 'IDGHAM_NO_GHUNNAH',
    titleAr: 'إدغام بغير غنة (كامل)',
    categoryAr: 'أحكام النون الساكنة والتنوين',
    color: TAJWEED_COLORS.MUTED,
    harakatCount: 'بدون غنة',
    explanationAr: 'إدخال النون الساكنة أو التنوين في اللام أو الراء إدخالاً تاماً بحيث يذهب الحرف وصفته معاً.',
    makhrajAr: 'طرف اللسان (مخرج اللام أو الراء مباشرة).',
    pronunciationTipAr: 'انتقل مباشرة إلى نطق اللام أو الراء مشددة بقوة دون أي أثر لصوت النون أو الغنة.',
  },
  IQLAB: {
    type: 'IQLAB',
    category: 'NOON_SAKINAH',
    titleAr: 'إقلاب',
    categoryAr: 'أحكام النون الساكنة والتنوين',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'قلب النون الساكنة أو التنوين ميماً خالصة لفظاً لا خطاً عند ملاقاة حرف الباء، مع إخفاء الميم والغنة بمقدار حركتين.',
    makhrajAr: 'الشفتان بانطباق لطيف دون كز، مع الخيشوم لصوت الغنة.',
    pronunciationTipAr: 'لامس الشفتين برفق دون ضغط شديد وأخرج الغنة من الأنف لمدة حركتين ثم افتح الشفتين على الباء.',
  },
  IKHFA_HAQIQI: {
    type: 'IKHFA_HAQIQI',
    category: 'NOON_SAKINAH',
    titleAr: 'إخفاء حقيقي',
    categoryAr: 'أحكام النون الساكنة والتنوين',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'النطق بالنون الساكنة أو التنوين بحال بين الإظهار والإدغام عارٍ عن التشديد مع بقاء الغنة بمقدار حركتين عند حروف الإخفاء الـ ١٥.',
    makhrajAr: 'قريب من مخرج حرف الإخفاء مع اعتماد الصوت كلياً على الخيشوم.',
    pronunciationTipAr: 'هيّئ لسانك عند مخرج الحرف الآتي وفخّم الغنة إن كان حرف الإخفاء مفخماً (ص، ض، ط، ظ، ق) ورقّقها إن كان مرققاً.',
  },
  IKHFA_SHAFAWI: {
    type: 'IKHFA_SHAFAWI',
    category: 'MEEM_SAKINAH',
    titleAr: 'إخفاء شفوي',
    categoryAr: 'أحكام الميم الساكنة',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'إخفاء الميم الساكنة إذا وقع بعدها حرف الباء مع إظهار الغنة بمقدار حركتين.',
    makhrajAr: 'الشفتان بتلامس خفيف جداً.',
    pronunciationTipAr: 'تلامس الشفتان بلطف دون ضغط أو إطباق شديد مع إطالة صوت الغنة حركتين.',
  },
  IDGHAM_SHAFAWI: {
    type: 'IDGHAM_SHAFAWI',
    category: 'MEEM_SAKINAH',
    titleAr: 'إدغام شفوي (متماثلين)',
    categoryAr: 'أحكام الميم الساكنة',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'إدغام الميم الساكنة في ميم متحركة تليها لتصبحا ميماً واحدة مشددة بغنة أكمل ما تكون.',
    makhrajAr: 'الشفتان معاً.',
    pronunciationTipAr: 'أطبق الشفتين على الميم المشددة مع غنة متمكنة حركتين.',
  },
  IZHAR_SHAFAWI: {
    type: 'IZHAR_SHAFAWI',
    category: 'MEEM_SAKINAH',
    titleAr: 'إظهار شفوي',
    categoryAr: 'أحكام الميم الساكنة',
    color: TAJWEED_COLORS.NORMAL,
    harakatCount: 'بدون مد',
    explanationAr: 'نطق الميم الساكنة ظاهرة واضحة دون غنة زائدة عند جميع الحروف عدا الباء والميم، وتكون أشد إظهاراً عند الواو والفاء.',
    makhrajAr: 'انطباق الشفتين انطباقاً تاماً.',
    pronunciationTipAr: 'احذر من إخفاء الميم عند الواو والفاء لاتحادهما في المخرج وقربه.',
  },
  QALQALAH_SUGHRA: {
    type: 'QALQALAH_SUGHRA',
    category: 'QALQALAH',
    titleAr: 'قلقلة صغرى',
    categoryAr: 'أحكام القلقلة',
    color: TAJWEED_COLORS.QALQALAH,
    harakatCount: 'نبرة سريعة',
    explanationAr: 'اضطراب صوت الحرف الساكن من حروف (ق، ط، ب، ج، د) إذا وقع ساكناً في وسط الكلمة أو وسط الكلام موصولاً.',
    makhrajAr: 'مخرج حرف القلقلة المحدد.',
    pronunciationTipAr: 'لا تجعل القلقلة تميل إلى فتح أو كسر، بل اجعلها نبرة اهتزازية سريعة تفك انغلاق المخرج.',
  },
  QALQALAH_KUBRA: {
    type: 'QALQALAH_KUBRA',
    category: 'QALQALAH',
    titleAr: 'قلقلة كبرى',
    categoryAr: 'أحكام القلقلة',
    color: TAJWEED_COLORS.QALQALAH,
    harakatCount: 'نبرة قوية',
    explanationAr: 'اضطراب مخرج الحرف من حروف (ق، ط، ب، ج، د) عند الوقف عليه ساكناً في آخر الكلمة، وتكون أشد إذا كان الحرف مشدداً (أكبر).',
    makhrajAr: 'مخرج حرف القلقلة عند انقطاع الصوت عليه بالوقف.',
    pronunciationTipAr: 'قف على الحرف بوضوح وبيان واهتزاز قوي يفصح عن ذات الحرف.',
  },
  MADD_LAZIM: {
    type: 'MADD_LAZIM',
    category: 'MADD',
    titleAr: 'مد لازم (كلمي أو حرفي)',
    categoryAr: 'أحكام المدود',
    color: TAJWEED_COLORS.MADD_6,
    harakatCount: '٦ حركات وجوباً',
    explanationAr: 'أن يأتي بعد حرف المد حرف ساكن سكوناً أصلياً وصلاً ووقفاً (مشداً في المثقل أو ساكناً في المخفف). مقداره ٦ حركات لزوماً لجميع القراء.',
    makhrajAr: 'الجوف (مخرج حروف المد الثلاثة: الألف، الواو، والياء السواكن).',
    pronunciationTipAr: 'أشبع المد تماماً بمقدار ست حركات متساوية دون تذبذب أو خفض في الصوت.',
  },
  MADD_MUTTASIL: {
    type: 'MADD_MUTTASIL',
    category: 'MADD',
    titleAr: 'مد واجب متصل',
    categoryAr: 'أحكام المدود',
    color: TAJWEED_COLORS.MADD_4_5,
    harakatCount: '٤ أو ٥ حركات (٦ في ورش)',
    explanationAr: 'أن يجتمع حرف المد والهمز في كلمة واحدة. حكمه الوجوب، ومقداره ٤ أو ٥ حركات في حفص، و٦ حركات إشباعاً في رواية ورش عن نافع.',
    makhrajAr: 'الجوف يليه أقصى الحلق للهمزة.',
    pronunciationTipAr: 'مد الصوت بثبات ثم انطق الهمزة محققة واضحة بغير بتر.',
  },
  MADD_MUNFASIL: {
    type: 'MADD_MUNFASIL',
    category: 'MADD',
    titleAr: 'مد جائز منفصل',
    categoryAr: 'أحكام المدود',
    color: TAJWEED_COLORS.MADD_4_5,
    harakatCount: '٤ أو ٥ حركات (٦ في ورش)',
    explanationAr: 'أن يأتي حرف المد في آخر الكلمة والهمزة في أول الكلمة التي تليها. مقداره ٤ أو ٥ حركات من الشاطبية (و٦ حركات إشباعاً في ورش).',
    makhrajAr: 'الجوف متبوعاً بالهمزة في الكلمة التالية.',
    pronunciationTipAr: 'سوّ بين أزمنة المدود المنفصلة والمتصلة طوال تلاوتك دون تفاوت.',
  },
  MADD_ARID: {
    type: 'MADD_ARID',
    category: 'MADD',
    titleAr: 'مد عارض للسكون',
    categoryAr: 'أحكام المدود',
    color: TAJWEED_COLORS.MADD_2,
    harakatCount: '٢ أو ٤ أو ٦ حركات',
    explanationAr: 'أن يقع بعد حرف المد حرف متحرك سكن لأجل الوقف عليه في آخر الآية أو الكلمة. يجوز فيه القصر (حركتان)، التوسط (٤)، أو الإشباع (٦).',
    makhrajAr: 'الجوف متبوعاً بالحرف الموقوف عليه مسكناً.',
    pronunciationTipAr: 'التزم وجهاً واحداً في التلاوة الواحدة (إن وقفت بأربع حركات فالتزم بها سائر الوقف).',
  },
  GHUNNAH_MUSHADDADAH: {
    type: 'GHUNNAH_MUSHADDADAH',
    category: 'GHUNNAH',
    titleAr: 'غنة مشددة (النون والميم)',
    categoryAr: 'أحكام الغنن',
    color: TAJWEED_COLORS.GHUNNAH,
    harakatCount: 'حركتان',
    explanationAr: 'النون والميم المشددتان حكمهما وجوب الغنة بمقدار حركتين وتكون الغنة هنا في أعلى مراتبها (أكمل ما تكون).',
    makhrajAr: 'الخيشوم بتدفق هوائي صوتي رخيم.',
    pronunciationTipAr: 'امكث على النون أو الميم المشددة زمناً يماثل حركتين واجعله رناناً صريحاً.',
  },
  TAFKHEEM_RA: {
    type: 'TAFKHEEM_RA',
    category: 'TAFKHEEM',
    titleAr: 'تفخيم الراء',
    categoryAr: 'أحكام الراءات',
    color: TAJWEED_COLORS.TAFKHEEM,
    harakatCount: 'صفة صوتية',
    explanationAr: 'تغليظ صوت الراء وتسمينه بامتلاء الفم بصداه إذا كانت مفتوحة أو مضمومة أو ساكنة بعد فتح أو ضم.',
    makhrajAr: 'طرف اللسان مع ما يحاذيه من لثة الأسنان العليا.',
    pronunciationTipAr: 'ارفع أقصى اللسان مع تقعير وسطه ليمتلئ الفم بصدى الحرف.',
  },
  TARQEEQ_RA: {
    type: 'TARQEEQ_RA',
    category: 'TAFKHEEM',
    titleAr: 'ترقيق الراء (خاصة في ورش)',
    categoryAr: 'أحكام الراءات',
    color: TAJWEED_COLORS.NORMAL,
    harakatCount: 'صفة صوتية',
    explanationAr: 'تنحيف صوت الراء إذا كانت مكسورة، أو ساكنة بعد كسر أصلي، أو بعد ياء ساكنة، وترقق في ورش بعد الكسرة اللازمة والياء الساكنة.',
    makhrajAr: 'طرف اللسان دون استعلاء أقصاه.',
    pronunciationTipAr: 'انطق الراء نحيلة رقيقة بانخفاض اللسان في قاع الفم.',
  },
  TAGHLEEZ_LAM_WARSH: {
    type: 'TAGHLEEZ_LAM_WARSH',
    category: 'TAFKHEEM',
    titleAr: 'تغليظ اللام (رواية ورش)',
    categoryAr: 'أصول رواية ورش عن نافع',
    color: TAJWEED_COLORS.TAFKHEEM,
    harakatCount: 'صفة مغلظة',
    explanationAr: 'يغلظ ورش اللام المفتوحة إذا سبقت بحرف مفتوح أو ساكن من ثلاثة أحرف: (الصاد، الطاء، الظاء) مثل: (الصَّلَاة، طَلَّقَ، ظَلَمَ).',
    makhrajAr: 'حافتا اللسان مع لثة الثنايا والضواحك العليا.',
    pronunciationTipAr: 'سَمّن صوت اللام بملء الفم بصداها إشعاراً بفخامة الحرف السابق.',
  },
  NORMAL: {
    type: 'NORMAL',
    category: 'NOON_SAKINAH',
    titleAr: 'أصل النطق',
    categoryAr: 'أصول التلاوة',
    color: TAJWEED_COLORS.NORMAL,
    harakatCount: 'حركة طبيعية',
    explanationAr: 'النطق الطبيعي السليم للحرف وفق مخرجه وصفته الأصلية بحركته المعينة.',
    makhrajAr: 'مخرج الحرف الخاص به.',
    pronunciationTipAr: 'أعط كل حرف حقه ومستحقه دون إفراط أو تفريط.',
  },
};

/**
 * Intelligent Rule Identifier: Analyzes a single Arabic word or token
 * and discovers any Tajweed occurrences based on diacritics and letters.
 */
export function detectWordTajweedRules(
  word: string,
  nextWord: string = '',
  riwaya: Riwaya = 'HAFS'
): TajweedRuleType[] {
  const rules: TajweedRuleType[] = [];
  const cleanWord = word.trim();
  if (!cleanWord) return rules;

  // 1. Madd Lazim Check: Contains madd sign (~) followed by Shaddah
  if (cleanWord.includes('~') || cleanWord.includes('\u0653')) {
    if (cleanWord.includes('ّ') || cleanWord.includes('\u0651')) {
      rules.push('MADD_LAZIM');
    } else if (cleanWord.includes('ء') || cleanWord.includes('ئ') || cleanWord.includes('ؤ')) {
      rules.push('MADD_MUTTASIL');
    } else {
      rules.push(riwaya === 'WARSH' ? 'MADD_MUTTASIL' : 'MADD_MUNFASIL');
    }
  }

  // 2. Qalqalah Check: Letters of قطب جد with sukoon or at end of word
  const qalqalahRegex = /[قطبجد][ْ\u0652]/;
  if (qalqalahRegex.test(cleanWord)) {
    rules.push('QALQALAH_SUGHRA');
  } else if (/[قطبجد]$/.test(cleanWord.replace(/[\u064B-\u065F]/g, ''))) {
    rules.push('QALQALAH_KUBRA');
  }

  // 3. Ghunnah Mushaddadah: Nun or Meem with Shaddah (نّ / مّ)
  if (/[نم][ّ\u0651]/.test(cleanWord)) {
    rules.push('GHUNNAH_MUSHADDADAH');
  }

  // 4. Iqlab: Contains small meem sign (ۢ) or noon followed by ba (نْ ب)
  if (cleanWord.includes('ۢ') || cleanWord.includes('\u06E2') || /[ن][ْ\u0652]?\s*ب/.test(cleanWord)) {
    rules.push('IQLAB');
  }

  // 5. Warsh Specific: Taghleez Lam (الصَّلَاة، طَلَّقَ، ظَلَمَ)
  if (riwaya === 'WARSH') {
    if (/[صطظ][\u064B-\u065F]*ل[\u064B-\u065F]*/.test(cleanWord)) {
      rules.push('TAGHLEEZ_LAM_WARSH');
    }
  }

  // 6. Ikhfa Haqiqi Check: Noon sakinah or Tanween followed by 15 letters
  const ikhfaLetters = 'صذثكجشقسدطزفتضظ';
  const firstLetterOfNext = nextWord.replace(/^[\s\u064B-\u065F]+/, '')[0] || '';
  const endsWithTanween = /[\u064B\u064C\u064D]$/.test(cleanWord);
  const endsWithNoonSakin = /[ن][ْ\u0652]?$/.test(cleanWord);

  if ((endsWithTanween || endsWithNoonSakin) && ikhfaLetters.includes(firstLetterOfNext)) {
    rules.push('IKHFA_HAQIQI');
  } else if ((endsWithTanween || endsWithNoonSakin) && 'ينمو'.includes(firstLetterOfNext)) {
    rules.push('IDGHAM_GHUNNAH');
  } else if ((endsWithTanween || endsWithNoonSakin) && 'لر'.includes(firstLetterOfNext)) {
    rules.push('IDGHAM_BILA_GHUNNAH');
  } else if ((endsWithTanween || endsWithNoonSakin) && 'ءهعحغخ'.includes(firstLetterOfNext)) {
    rules.push('IZHAR_HALQI');
  }

  return rules.length > 0 ? rules : ['NORMAL'];
}

/**
 * Returns primary Tajweed display color for a word
 */
export function getWordTajweedColor(rules: TajweedRuleType[]): string {
  if (rules.includes('MADD_LAZIM')) return TAJWEED_COLORS.MADD_6;
  if (rules.includes('MADD_MUTTASIL') || rules.includes('MADD_MUNFASIL')) return TAJWEED_COLORS.MADD_4_5;
  if (rules.includes('QALQALAH_KUBRA') || rules.includes('QALQALAH_SUGHRA')) return TAJWEED_COLORS.QALQALAH;
  if (rules.includes('GHUNNAH_MUSHADDADAH') || rules.includes('IKHFA_HAQIQI') || rules.includes('IQLAB') || rules.includes('IDGHAM_GHUNNAH')) return TAJWEED_COLORS.GHUNNAH;
  if (rules.includes('IDGHAM_BILA_GHUNNAH')) return TAJWEED_COLORS.MUTED;
  if (rules.includes('TAGHLEEZ_LAM_WARSH') || rules.includes('TAFKHEEM_RA')) return TAJWEED_COLORS.TAFKHEEM;
  return TAJWEED_COLORS.NORMAL;
}
