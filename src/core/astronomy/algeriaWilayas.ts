/**
 * Athar (أَثَر) - Complete Algerian 58 Wilayas Database (أوفلاين 100%)
 * 
 * Provides official coordinates for all 58 Wilayas of Algeria
 * for deterministic, 100% offline prayer calculations without GPS.
 */

export interface AlgeriaWilaya {
  code: number;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}

export const ALGERIA_58_WILAYAS: AlgeriaWilaya[] = [
  { code: 1, nameAr: 'أدرار', nameEn: 'Adrar', latitude: 27.8742, longitude: -0.2939 },
  { code: 2, nameAr: 'الشلف', nameEn: 'Chlef', latitude: 36.1653, longitude: 1.3344 },
  { code: 3, nameAr: 'الأغواط', nameEn: 'Laghouat', latitude: 33.8000, longitude: 2.8651 },
  { code: 4, nameAr: 'أم البواقي', nameEn: 'Oum El Bouaghi', latitude: 35.8755, longitude: 7.1135 },
  { code: 5, nameAr: 'باتنة', nameEn: 'Batna', latitude: 35.5558, longitude: 6.1741 },
  { code: 6, nameAr: 'بجاية', nameEn: 'Béjaïa', latitude: 36.7511, longitude: 5.0567 },
  { code: 7, nameAr: 'بسكرة', nameEn: 'Biskra', latitude: 34.8504, longitude: 5.7281 },
  { code: 8, nameAr: 'بشار', nameEn: 'Béchar', latitude: 31.6167, longitude: -2.2167 },
  { code: 9, nameAr: 'البليدة', nameEn: 'Blida', latitude: 36.4700, longitude: 2.8300 },
  { code: 10, nameAr: 'البويرة', nameEn: 'Bouira', latitude: 36.3749, longitude: 3.9020 },
  { code: 11, nameAr: 'تمنراست', nameEn: 'Tamanrasset', latitude: 22.7850, longitude: 5.5228 },
  { code: 12, nameAr: 'تبسة', nameEn: 'Tébessa', latitude: 35.4042, longitude: 8.1242 },
  { code: 13, nameAr: 'تلمسان', nameEn: 'Tlemcen', latitude: 34.8783, longitude: -1.3150 },
  { code: 14, nameAr: 'تيارت', nameEn: 'Tiaret', latitude: 35.3710, longitude: 1.3170 },
  { code: 15, nameAr: 'تيزي وزو', nameEn: 'Tizi Ouzou', latitude: 36.7118, longitude: 4.0459 },
  { code: 16, nameAr: 'الجزائر العاصمة', nameEn: 'Algiers', latitude: 36.7538, longitude: 3.0588 },
  { code: 17, nameAr: 'الجلفة', nameEn: 'Djelfa', latitude: 34.6728, longitude: 3.2630 },
  { code: 18, nameAr: 'جيجل', nameEn: 'Jijel', latitude: 36.8206, longitude: 5.7667 },
  { code: 19, nameAr: 'سطيف', nameEn: 'Sétif', latitude: 36.1911, longitude: 5.4137 },
  { code: 20, nameAr: 'سعيدة', nameEn: 'Saïda', latitude: 34.8303, longitude: 0.1517 },
  { code: 21, nameAr: 'سكيكدة', nameEn: 'Skikda', latitude: 36.8663, longitude: 6.9044 },
  { code: 22, nameAr: 'سيدي بلعباس', nameEn: 'Sidi Bel Abbès', latitude: 35.1899, longitude: -0.6308 },
  { code: 23, nameAr: 'عنابة', nameEn: 'Annaba', latitude: 36.9000, longitude: 7.7667 },
  { code: 24, nameAr: 'قالمة', nameEn: 'Guelma', latitude: 36.4622, longitude: 7.4261 },
  { code: 25, nameAr: 'قسنطينة', nameEn: 'Constantine', latitude: 36.3650, longitude: 6.6147 },
  { code: 26, nameAr: 'المدية', nameEn: 'Médéa', latitude: 36.2642, longitude: 2.7539 },
  { code: 27, nameAr: 'مستغانم', nameEn: 'Mostaganem', latitude: 35.9312, longitude: 0.0892 },
  { code: 28, nameAr: 'المسيلة', nameEn: "M'Sila", latitude: 35.7058, longitude: 4.5419 },
  { code: 29, nameAr: 'معسكر', nameEn: 'Mascara', latitude: 35.3967, longitude: 0.1403 },
  { code: 30, nameAr: 'ورقلة', nameEn: 'Ouargla', latitude: 31.9539, longitude: 5.3204 },
  { code: 31, nameAr: 'وهران', nameEn: 'Oran', latitude: 35.6971, longitude: -0.6308 },
  { code: 32, nameAr: 'البيض', nameEn: 'El Bayadh', latitude: 33.6832, longitude: 1.0193 },
  { code: 33, nameAr: 'إليزي', nameEn: 'Illizi', latitude: 26.4833, longitude: 8.4667 },
  { code: 34, nameAr: 'برج بوعريريج', nameEn: 'Bordj Bou Arréridj', latitude: 36.0732, longitude: 4.7607 },
  { code: 35, nameAr: 'بومرداس', nameEn: 'Boumerdès', latitude: 36.7664, longitude: 3.4772 },
  { code: 36, nameAr: 'الطارف', nameEn: 'El Tarf', latitude: 36.7672, longitude: 8.3138 },
  { code: 37, nameAr: 'تندوف', nameEn: 'Tindouf', latitude: 27.6711, longitude: -8.1478 },
  { code: 38, nameAr: 'تسمسيلت', nameEn: 'Tissemsilt', latitude: 35.6072, longitude: 1.8108 },
  { code: 39, nameAr: 'الوادي', nameEn: 'El Oued', latitude: 33.3683, longitude: 6.8675 },
  { code: 40, nameAr: 'خنشلة', nameEn: 'Khenchela', latitude: 35.4358, longitude: 7.1433 },
  { code: 41, nameAr: 'سوق أهراس', nameEn: 'Souk Ahras', latitude: 36.2864, longitude: 7.9511 },
  { code: 42, nameAr: 'تيبازة', nameEn: 'Tipaza', latitude: 36.5942, longitude: 2.4430 },
  { code: 43, nameAr: 'ميلة', nameEn: 'Mila', latitude: 36.4503, longitude: 6.2644 },
  { code: 44, nameAr: 'عين الدفلى', nameEn: 'Aïn Defla', latitude: 36.2641, longitude: 1.9679 },
  { code: 45, nameAr: 'النعامة', nameEn: 'Naâma', latitude: 33.2667, longitude: -0.3167 },
  { code: 46, nameAr: 'عين تموشنت', nameEn: 'Aïn Témouchent', latitude: 35.2975, longitude: -1.1404 },
  { code: 47, nameAr: 'غرداية', nameEn: 'Ghardaïa', latitude: 32.4909, longitude: 3.6736 },
  { code: 48, nameAr: 'غليزان', nameEn: 'Relizane', latitude: 35.7373, longitude: 0.5559 },
  { code: 49, nameAr: 'تيميمون', nameEn: 'Timimoun', latitude: 29.2639, longitude: 0.2310 },
  { code: 50, nameAr: 'برج باجي مختار', nameEn: 'Bordj Badji Mokhtar', latitude: 21.3278, longitude: 0.9542 },
  { code: 51, nameAr: 'أولاد جلال', nameEn: 'Ouled Djellal', latitude: 34.4333, longitude: 5.0667 },
  { code: 52, nameAr: 'بني عباس', nameEn: 'Béni Abbès', latitude: 30.1333, longitude: -2.1667 },
  { code: 53, nameAr: 'عين صالح', nameEn: 'In Salah', latitude: 27.1936, longitude: 2.4608 },
  { code: 54, nameAr: 'عين قزام', nameEn: 'In Guezzam', latitude: 19.5686, longitude: 5.7719 },
  { code: 55, nameAr: 'تقرت', nameEn: 'Touggourt', latitude: 33.1064, longitude: 6.0644 },
  { code: 56, nameAr: 'جانت', nameEn: 'Djanet', latitude: 24.5539, longitude: 9.4842 },
  { code: 57, nameAr: 'المغير', nameEn: "El M'Ghair", latitude: 33.9500, longitude: 5.9167 },
  { code: 58, nameAr: 'المنيعة', nameEn: 'El Meniaa', latitude: 30.5833, longitude: 2.8833 },
];

export const DEFAULT_ALGERIA_WILAYA = ALGERIA_58_WILAYAS[15]; // الجزائر العاصمة
