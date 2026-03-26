import { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Navbar
    explore: 'Explore', register: 'Register', dashboard: 'Dashboard',
    signIn: 'Sign In', getStarted: 'Get Started', logout: 'Logout',
    myLicenses: 'My Licenses', myFaces: 'My Faces', wishlist: 'Wishlist',
    earnings: 'Earnings', profile: 'Profile',

    // Landing
    heroTag: 'AI Face Licensing Platform',
    heroTitle1: 'License Real Faces.', heroTitle2: 'Use Them Legally.',
    heroDesc: 'A consent-based marketplace connecting face providers with businesses. Protected, verified, premium.',
    exploreFaces: 'Explore Faces', startProvider: 'Start as Provider',
    licensedFaces: 'Licensed Faces', paidToProviders: 'Paid to Providers', disputeFree: 'Dispute-Free',
    featured: 'Featured', curatedFaces: 'Curated Faces', viewAll: 'View All',
    process: 'Process', howItWorks: 'How It Works',
    step1: 'Upload & Verify', step1Desc: 'Submit your photos and complete identity verification. Our AI creates a secure biometric profile.',
    step2: 'Set Your Terms', step2Desc: 'Define pricing, usage rights, and restrictions. You maintain complete control over your face data.',
    step3: 'Earn Royalties', step3Desc: 'Businesses license your face legally. Get paid automatically with transparent, real-time tracking.',
    readyToLicense: 'Ready to license?',

    // Marketplace
    marketplace: 'Marketplace', browseVerified: 'Browse verified faces for your next project',
    searchFaces: 'Search faces...', noFacesFound: 'No faces found', facesFound: 'faces found',
    gender: 'Gender', ethnicity: 'Ethnicity', style: 'Style',
    trendingFaces: 'Trending Faces', advancedSearch: 'Advanced Search', licensingGuide: 'Licensing Guide',

    // Face Detail
    verifiedModel: 'Verified Model', licenseOptions: 'License Options',
    standardLicense: 'Standard License', extendedLicense: 'Extended License',
    licenseNow: 'License Now', requestCustom: 'Request Custom',
    reviews: 'Reviews', writeReview: 'Write a Review', submitReview: 'Submit Review',

    // Auth
    signInToAccount: 'Sign in to your account', createAccount: 'Create your account',
    email: 'Email', password: 'Password', name: 'Name',
    dontHaveAccount: "Don't have an account?", alreadyHaveAccount: 'Already have an account?',
    signUp: 'Sign Up',

    // Dashboard
    welcomeBack: 'Welcome back', balance: 'Balance', activeLicenses: 'Active Licenses',
    totalSpent: 'Total Spent', totalEarned: 'Total Earned',
    recentLicenses: 'Recent Licenses', quickActions: 'Quick Actions',
    browseFaces: 'Browse Faces', registerFace: 'Register Face', licenseHistory: 'License History',
  },
  ko: {
    explore: '탐색', register: '등록', dashboard: '대시보드',
    signIn: '로그인', getStarted: '시작하기', logout: '로그아웃',
    myLicenses: '내 라이선스', myFaces: '내 얼굴', wishlist: '위시리스트',
    earnings: '수익', profile: '프로필',

    heroTag: 'AI 얼굴 라이선싱 플랫폼',
    heroTitle1: '진짜 얼굴을 라이선스하세요.', heroTitle2: '합법적으로 사용하세요.',
    heroDesc: '얼굴 제공자와 기업을 연결하는 동의 기반 마켓플레이스. 보호, 검증, 프리미엄.',
    exploreFaces: '얼굴 탐색', startProvider: '제공자로 시작',
    licensedFaces: '라이선스된 얼굴', paidToProviders: '제공자에게 지급', disputeFree: '분쟁 없음',
    featured: '추천', curatedFaces: '엄선된 얼굴', viewAll: '전체 보기',
    process: '프로세스', howItWorks: '이용 방법',
    step1: '업로드 & 인증', step1Desc: '사진을 제출하고 본인 인증을 완료하세요. AI가 안전한 생체 프로필을 생성합니다.',
    step2: '조건 설정', step2Desc: '가격, 사용 권한, 제한 사항을 정의하세요. 얼굴 데이터에 대한 완전한 통제권을 유지합니다.',
    step3: '로열티 수령', step3Desc: '기업이 합법적으로 얼굴을 라이선스합니다. 투명한 실시간 추적으로 자동 지급됩니다.',
    readyToLicense: '라이선스할 준비되셨나요?',

    marketplace: '마켓플레이스', browseVerified: '다음 프로젝트를 위한 인증된 얼굴을 찾아보세요',
    searchFaces: '얼굴 검색...', noFacesFound: '얼굴을 찾을 수 없습니다', facesFound: '개의 얼굴 발견',
    gender: '성별', ethnicity: '민족', style: '스타일',
    trendingFaces: '인기 얼굴', advancedSearch: '고급 검색', licensingGuide: '라이선싱 가이드',

    verifiedModel: '인증된 모델', licenseOptions: '라이선스 옵션',
    standardLicense: '표준 라이선스', extendedLicense: '확장 라이선스',
    licenseNow: '지금 라이선스', requestCustom: '맞춤 요청',
    reviews: '리뷰', writeReview: '리뷰 작성', submitReview: '리뷰 제출',

    signInToAccount: '계정에 로그인', createAccount: '계정 만들기',
    email: '이메일', password: '비밀번호', name: '이름',
    dontHaveAccount: '계정이 없으신가요?', alreadyHaveAccount: '이미 계정이 있으신가요?',
    signUp: '가입하기',

    welcomeBack: '돌아오신 것을 환영합니다', balance: '잔액', activeLicenses: '활성 라이선스',
    totalSpent: '총 지출', totalEarned: '총 수익',
    recentLicenses: '최근 라이선스', quickActions: '빠른 작업',
    browseFaces: '얼굴 탐색', registerFace: '얼굴 등록', licenseHistory: '라이선스 기록',
  },
};

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('facepay_lang') || 'en');

  const toggleLang = () => {
    const next = lang === 'en' ? 'ko' : 'en';
    setLang(next);
    localStorage.setItem('facepay_lang', next);
  };

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be within LangProvider');
  return ctx;
}
