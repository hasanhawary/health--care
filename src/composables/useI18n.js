// Lightweight i18n composable: reactive locale (ar/en), dir, t(), and
// provider display-field helpers. Locale is persisted and synced to <html>.
import { computed, ref, watch } from 'vue'

const LOCALE_KEY = 'allianz_locale'
const locale = ref(localStorage.getItem(LOCALE_KEY) === 'en' ? 'en' : 'ar')

const STRINGS = {
  appTitle: { ar: 'شبكة أليانز مصر الطبية', en: 'Allianz Egypt Medical Network' },
  appSubtitle: { ar: 'دليل مقدمي الخدمة الطبية', en: 'Healthcare Provider Directory' },
  madeBy: { ar: 'صُنع بواسطة', en: 'Made by' },
  searchPlaceholder: {
    ar: 'ابحث بالاسم، التخصص، الخدمة، العنوان، المدينة، المحافظة، التليفون…',
    en: 'Search by name, specialty, service, address, city, governorate, phone…',
  },
  filters: { ar: 'الفلاتر', en: 'Filters' },
  filtersTitle: { ar: 'تصفية النتائج', en: 'Filter Results' },
  clearFilters: { ar: 'مسح الفلاتر', en: 'Clear filters' },
  clearAll: { ar: 'مسح الكل', en: 'Clear all' },
  apply: { ar: 'تطبيق', en: 'Apply' },
  close: { ar: 'إغلاق', en: 'Close' },
  showFilters: { ar: 'الفلاتر', en: 'Filters' },
  results: { ar: 'نتيجة', en: 'results' },
  result: { ar: 'نتيجة', en: 'result' },
  noResultsTitle: { ar: 'لا توجد نتائج مطابقة', en: 'No matching results' },
  noResultsDesc: {
    ar: 'جرّب تعديل كلمات البحث أو مسح بعض الفلاتر للعثور على مقدمي الخدمة.',
    en: 'Try adjusting your search terms or clearing some filters to find providers.',
  },
  errorTitle: { ar: 'تعذّر تحميل البيانات', en: 'Failed to load data' },
  errorDesc: {
    ar: 'حدث خطأ أثناء قراءة ملف مقدمي الخدمة. تأكد من وجود الملف ثم أعد المحاولة.',
    en: 'An error occurred while reading the providers file. Make sure the file exists and try again.',
  },
  retry: { ar: 'إعادة المحاولة', en: 'Retry' },
  loading: { ar: 'جارٍ تحميل مقدمي الخدمة…', en: 'Loading providers…' },
  sortBy: { ar: 'ترتيب حسب', en: 'Sort by' },
  sortBest: { ar: 'أفضل تطابق', en: 'Best match' },
  sortName: { ar: 'الاسم', en: 'Name' },
  sortGovernorate: { ar: 'المحافظة', en: 'Governorate' },
  sortArea: { ar: 'المنطقة', en: 'Area' },
  sortDistance: { ar: 'الأقرب مسافة', en: 'Nearest' },
  viewCards: { ar: 'عرض بطاقات', en: 'Cards view' },
  viewTable: { ar: 'عرض جدول', en: 'Table view' },
  cards: { ar: 'بطاقات', en: 'Cards' },
  table: { ar: 'جدول', en: 'Table' },
  specialty: { ar: 'التخصص', en: 'Specialty' },
  services: { ar: 'الخدمات', en: 'Services' },
  providerType: { ar: 'نوع مقدم الخدمة', en: 'Provider Type' },
  governorate: { ar: 'المحافظة', en: 'Governorate' },
  area: { ar: 'المنطقة / المدينة', en: 'Area / City' },
  city: { ar: 'المدينة', en: 'City' },
  citiesDependOnGov: { ar: 'المدن تتبع المحافظة المختارة', en: 'Cities follow the selected governorate' },
  networkType: { ar: 'نوع الشبكة', en: 'Network Type' },
  mainBranch: { ar: 'رئيسي / فرع', en: 'Main / Branch' },
  pulseStatus: { ar: 'حالة PULSE', en: 'PULSE Status' },
  liveOnly: { ar: 'النشطة (LIVE) فقط', en: 'LIVE only' },
  phone: { ar: 'التليفون', en: 'Phone' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  address: { ar: 'العنوان', en: 'Address' },
  call: { ar: 'اتصال', en: 'Call' },
  openMaps: { ar: 'فتح في خرائط Google', en: 'Open in Google Maps' },
  copyAddress: { ar: 'نسخ العنوان', en: 'Copy address' },
  share: { ar: 'مشاركة', en: 'Share' },
  details: { ar: 'التفاصيل', en: 'Details' },
  addToFavorites: { ar: 'إضافة للمفضلة', en: 'Add to favorites' },
  removeFromFavorites: { ar: 'إزالة من المفضلة', en: 'Remove from favorites' },
  favorites: { ar: 'المفضلة', en: 'Favorites' },
  recent: { ar: 'زيارات أخيرة', en: 'Recently viewed' },
  recentSearches: { ar: 'عمليات بحث أخيرة', en: 'Recent searches' },
  detectLocation: { ar: 'تحديد موقعي', en: 'Detect my location' },
  detecting: { ar: 'جارٍ تحديد الموقع…', en: 'Detecting…' },
  locationOn: { ar: 'تم تحديد الموقع', en: 'Location detected' },
  locationNotice: {
    ar: 'لا تتوفر إحداثيات دقيقة للمقدمين؛ يتم فتح خرائط Google بناءً على العنوان. لحساب المسافة بدقة يلزم وجود إحداثيات.',
    en: 'Providers do not have precise coordinates; Google Maps opens by address. Accurate distance needs coordinates.',
  },
  backToTop: { ar: 'العودة للأعلى', en: 'Back to top' },
  loadMore: { ar: 'تحميل المزيد', en: 'Load more' },
  showing: { ar: 'عرض', en: 'Showing' },
  of: { ar: 'من', en: 'of' },
  export: { ar: 'تصدير CSV', en: 'Export CSV' },
  all: { ar: 'الكل', en: 'All' },
  total: { ar: 'إجمالي المقدمين', en: 'Total providers' },
  currentResults: { ar: 'النتائج الحالية', en: 'Current results' },
  entireNetwork: { ar: 'إجمالي الشبكة', en: 'Entire network' },
  activeProviders: { ar: 'نشطون', en: 'Active' },
  doctors: { ar: 'الأطباء', en: 'Doctors' },
  hospitals: { ar: 'مستشفيات', en: 'Hospitals' },
  pharmacies: { ar: 'صيدليات', en: 'Pharmacies' },
  labs: { ar: 'معامل', en: 'Labs' },
  liveProviders: { ar: 'مقدمون نشطون', en: 'LIVE providers' },
  providerKey: { ar: 'كود المقدم', en: 'Provider Key' },
  externalRef: { ar: 'المرجع الخارجي', en: 'External Ref.' },
  copied: { ar: 'تم النسخ', en: 'Copied' },
  live: { ar: 'نشط', en: 'LIVE' },
  notLive: { ar: 'غير نشط', en: 'NOT LIVE' },
  main: { ar: 'رئيسي', en: 'Main' },
  branch: { ar: 'فرع', en: 'Branch' },
  language: { ar: 'English', en: 'العربية' },
  darkMode: { ar: 'الوضع الليلي', en: 'Dark mode' },
  noData: { ar: 'لا توجد بيانات', en: 'No data' },
  quickCategories: { ar: 'فئات سريعة', en: 'Quick categories' },
  search: { ar: 'بحث', en: 'Search' },
  resetQuery: { ar: 'مسح البحث', en: 'Clear search' },
  geoDenied: {
    ar: 'تم رفض إذن الوصول للموقع. يرجى السماح به من إعدادات المتصفح والمحاولة مجددًا.',
    en: 'Location permission was denied. Please allow location access in your browser settings and try again.',
  },
  geoUnavailable: {
    ar: 'تعذّر تحديد الموقع حاليًا. تأكّد من تفعيل خدمة تحديد الموقع (GPS) والاتصال بالإنترنت.',
    en: 'Could not determine your location right now. Make sure location services (GPS) and internet are enabled.',
  },
  geoTimeout: {
    ar: 'انتهت مهلة تحديد الموقع. حاول مرة أخرى.',
    en: 'Location request timed out. Please try again.',
  },
  geoUnsupported: {
    ar: 'متصفحك لا يدعم خدمة تحديد الموقع.',
    en: 'Your browser does not support geolocation.',
  },
  geoInsecure: {
    ar: 'تحديد الموقع يتطلب اتصالًا آمنًا (HTTPS) أو استخدام localhost.',
    en: 'Geolocation requires a secure connection (HTTPS) or localhost.',
  },
  yourLocation: { ar: 'موقعك', en: 'Your location' },
  openMyLocation: { ar: 'عرض موقعك على الخريطة', en: 'View your location on map' },
  groupByProvider: { ar: 'تجميع حسب المقدم', en: 'Group by provider' },
  groups: { ar: 'مجموعة', en: 'groups' },
  branches: { ar: 'الفروع', en: 'Branches' },
  locations: { ar: 'موقع', en: 'locations' },
  showBranches: { ar: 'عرض الفروع', en: 'Show branches' },
  hideBranches: { ar: 'إخفاء الفروع', en: 'Hide branches' },
  mainBranchLabel: { ar: 'الفرع الرئيسي', en: 'Main branch' },
  mapView: { ar: 'خريطة', en: 'Map' },
  listView: { ar: 'قائمة', en: 'List' },
  distance: { ar: 'المسافة', en: 'Distance' },
  km: { ar: 'كم', en: 'km' },
  m: { ar: 'م', en: 'm' },
  similarProviders: { ar: 'مقدمون مشابهون', en: 'Similar providers' },
  nearbyProviders: { ar: 'مقدمون قريبون', en: 'Nearby providers' },
  branchInfo: { ar: 'الفروع', en: 'Branches' },
  copyPhone: { ar: 'نسخ التليفون', en: 'Copy phone' },
  selectNumber: { ar: 'اختر رقمًا للاتصال', en: 'Select a number to call' },
  walking: { ar: 'سيرًا', en: 'Walking' },
  driving: { ar: 'بالسيارة', en: 'Driving' },
  minutes: { ar: 'دقيقة', en: 'min' },
  directions: { ar: 'الاتجاهات', en: 'Directions' },
  savePreset: { ar: 'حفظ الإعداد', en: 'Save preset' },
  presetName: { ar: 'اسم الإعداد', en: 'Preset name' },
  presets: { ar: 'الإعدادات المحفوظة', en: 'Saved presets' },
  shareFilters: { ar: 'مشاركة الفلاتر', en: 'Share filters' },
  shareCopied: { ar: 'تم نسخ رابط الفلاتر', en: 'Filter link copied' },
  exportExcel: { ar: 'تصدير Excel', en: 'Export Excel' },
  exportPdf: { ar: 'تصدير PDF', en: 'Export PDF' },
  print: { ar: 'طباعة', en: 'Print' },
  installApp: { ar: 'تثبيت التطبيق', en: 'Install app' },
  trending: { ar: 'الأكثر بحثًا', en: 'Trending' },
  showingOnMap: { ar: 'يتم عرض المقدمين على الخريطة', en: 'Showing providers on map' },
  searchThisArea: { ar: 'ابحث في هذه المنطقة', en: 'Search this area' },
  recenter: { ar: 'توسيط', en: 'Recenter' },
  resetMap: { ar: 'إعادة ضبط الخريطة', en: 'Reset map' },
  showList: { ar: 'عرض القائمة', en: 'Show list' },
  legend: { ar: 'مفتاح الخريطة', en: 'Map legend' },
  fullscreen: { ar: 'ملء الشاشة', en: 'Fullscreen' },
  exitFullscreen: { ar: 'إنهاء ملء الشاشة', en: 'Exit fullscreen' },
  radiusFilter: { ar: 'المسافة منك', en: 'Radius around you' },
  allDistances: { ar: 'كل المسافات', en: 'All distances' },
  within: { ar: 'ضمن', en: 'Within' },
  nearMe: { ar: 'الأقرب إليّ', en: 'Near me' },
  findNearMe: { ar: 'ابحث بالقرب مني', en: 'Find near me' },
  radiusNotice: {
    ar: 'تصفية النطاق تتطلب إحداثيات للمقدمين. المقدمون بدون إحداثيات يُخفون أثناء تفعيل النطاق.',
    en: 'Radius filtering requires provider coordinates. Providers without coordinates are hidden while a radius is active.',
  },
  mapPlaceholderTitle: {
    ar: 'جارٍ تحضير الخريطة',
    en: 'Preparing the map',
  },
  mapPlaceholderDesc: {
    ar: 'يتم تحميل إحداثيات المقدمين. استخدم زر «فتح في خرائط Google» لعرض أي مقدم على الخريطة.',
    en: 'Loading provider coordinates. Use "Open in Google Maps" to view any provider on the map.',
  },
  home: { ar: 'الرئيسية', en: 'Home' },
  providerName: { ar: 'مقدم الخدمة', en: 'Provider' },
  splitView: { ar: 'عرض مقسّم', en: 'Split view' },
  similarNearby: { ar: 'مقدمون مشابهون قريبون', en: 'Similar nearby' },
}

function applyDocument() {
  const dir = locale.value === 'en' ? 'ltr' : 'rtl'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', locale.value)
}

applyDocument()
watch(locale, (val) => {
  localStorage.setItem(LOCALE_KEY, val)
  applyDocument()
})

export function useI18n() {
  const dir = computed(() => (locale.value === 'en' ? 'ltr' : 'rtl'))
  const isAr = computed(() => locale.value === 'ar')
  function t(key) {
    const entry = STRINGS[key]
    if (!entry) return key
    return entry[locale.value] ?? entry.ar ?? key
  }
  function toggle() {
    locale.value = locale.value === 'ar' ? 'en' : 'ar'
  }
  /** Pick the locale-appropriate field from a provider. */
  function field(provider, arKey, enKey) {
    if (locale.value === 'en') return provider[enKey] || provider[arKey] || ''
    return provider[arKey] || provider[enKey] || ''
  }
  return { locale, dir, isAr, t, toggle, field }
}
