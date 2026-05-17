'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';

type LangCode = 'en' | 'mn';

interface TermsContactInfo {
  phone: string;
  email: string;
  facebook?: string;
  instagram?: string;
  address: string;
}

interface TermsData {
  lastUpdated: string;
  published: string;
  version?: string;
  contactInfo: TermsContactInfo;
}

interface TranslationSection {
  id: string;
  title: string;
  content: string;
  subsections?: Array<{
    id: string;
    title: string;
    content: string;
    items?: string[];
  }>;
}

interface Translation {
  language: string;
  country: string;
  pageTitle: string;
  published: string;
  effective: string;
  previousVersion: string;
  agreement: string;
  contactInfo: string;
  phone: string;
  email: string;
  socialMedia: string;
  address: string;
  version: string;
  lastUpdated: string;
  legalDocs: string;
  description: string;
  sections: TranslationSection[];
}

const translations: Record<LangCode, Translation> = {
  en: {
    language: 'English',
    country: 'United States',
    pageTitle: 'Terms of Use',
    published: 'Published',
    effective: 'Effective',
    previousVersion: 'previous version',
    agreement:
      'By using Sainto, you confirm that you have read, understood, and agree to these Terms and Conditions.',
    contactInfo: 'Contact Information',
    phone: 'Phone',
    email: 'Email',
    socialMedia: 'Social Media',
    address: 'Address',
    version: 'Version',
    lastUpdated: 'Last updated',
    legalDocs: 'Terms of Use',
    description:
      'Please read these terms and conditions carefully before using our service. By accessing and using Sainto, you agree to be bound by these terms.',
    sections: [
      {
        id: 'basics',
        title: 'The Basics',
        content:
          'These fundamental terms explain what you need to know about using our service.',
        subsections: [
          {
            id: 'what-are-terms',
            title: "What's in these terms?",
            content:
              'These terms tell you the rules for using our website www.sainto.mn (our site).',
          },
          {
            id: 'who-we-are',
            title: 'Who we are and how to contact us?',
            content:
              'Our site is operated by Sainto (we or us). We are a company based in Ulaanbaatar, Mongolia. To contact us, please use the contact information provided below.',
          },
        ],
      },
      {
        id: 'website-use',
        title: 'Use of the Website',
        content: 'Guidelines for proper and acceptable use of our platform.',
        subsections: [
          {
            id: 'acceptable-use',
            title: 'Acceptable use',
            content:
              'You may use our site only for lawful purposes. You may not use our site:',
            items: [
              'In any way that breaches any applicable local, national or international law or regulation',
              'To transmit, or procure the sending of, any unsolicited or unauthorized advertising or promotional material',
              'To knowingly transmit any data or material that contains viruses or other harmful components',
            ],
          },
          {
            id: 'interactive-services',
            title: 'Interactive services',
            content:
              'We may from time to time provide interactive services on our site, including chat rooms, bulletin boards, and user reviews. We will provide clear information to you about the kind of service offered and whether it is moderated.',
          },
        ],
      },
      {
        id: 'accounts',
        title: 'Your Account',
        content:
          'Information regarding account creation, responsibilities, and management.',
        subsections: [
          {
            id: 'account-creation',
            title: 'Account Creation',
            content:
              'To access certain features of our service, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials.',
          },
          {
            id: 'account-security',
            title: 'Account Security',
            content:
              'You must immediately notify us of any unauthorized access to or use of your account. We are not liable for any harm or losses resulting from unauthorized use of your account.',
          },
        ],
      },
      {
        id: 'orders-payments',
        title: 'Orders and Payments',
        content: 'Terms related to purchasing and payment processing.',
        subsections: [
          {
            id: 'order-process',
            title: 'Order process',
            content:
              'When you place an order through our website, the following process applies:',
            items: [
              'Order confirmation via email and SMS',
              'Daily delivery location updates',
              'Phone call coordination for delivery',
            ],
          },
          {
            id: 'payment-methods',
            title: 'Payment methods',
            content:
              'We currently accept cash on delivery. Future payment methods will include StorePay, QPay, and Stripe.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Data Privacy',
        content:
          'How we collect, use, and protect your personal information.',
        subsections: [
          {
            id: 'data-collection',
            title: 'Data Collection',
            content:
              'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.',
          },
          {
            id: 'data-usage',
            title: 'How We Use Your Data',
            content:
              'We use your information to provide, maintain, and improve our services, process transactions, and communicate with you about your account and our services.',
          },
        ],
      },
      {
        id: 'termination',
        title: 'Termination',
        content: 'Conditions under which these terms may be terminated.',
        subsections: [
          {
            id: 'termination-by-user',
            title: 'Termination by You',
            content:
              'You may terminate your account at any time by contacting our customer support or using the account deletion feature in your settings.',
          },
          {
            id: 'termination-by-us',
            title: 'Termination by Us',
            content:
              'We may suspend or terminate your access to our services if you violate these terms or engage in activities that harm our platform or other users.',
          },
        ],
      },
    ],
  },
  mn: {
    language: 'Монгол',
    country: 'Монгол Улс',
    pageTitle: 'Үйлчилгээний Нөхцөл',
    published: 'Нийтэлсэн',
    effective: 'Хүчин төгөлдөр',
    previousVersion: 'өмнөх хувилбар',
    agreement:
      'Sainto-г ашигласнаар та эдгээр Үйлчилгээний Нөхцөлийг уншиж, ойлгож, зөвшөөрч байгаагаа баталж байна.',
    contactInfo: 'Холбоо Барих Мэдээлэл',
    phone: 'Утас',
    email: 'Имэйл',
    socialMedia: 'Нийгмийн Сүлжээ',
    address: 'Хаяг',
    version: 'Хувилбар',
    lastUpdated: 'Сүүлд шинэчилсэн',
    legalDocs: 'Үйлчилгээний Нөхцөл',
    description:
      'Манай үйлчилгээг ашиглахын өмнө эдгээр нөхцөлийг анхааралтай уншина уу. Sainto-г ашиглаж, хандах замаар та эдгээр нөхцөлийг хүлээн зөвшөөрч байна.',
    sections: [
      {
        id: 'basics',
        title: 'Үндсэн Зүйлс',
        content:
          'Эдгээр үндсэн нөхцөлүүд нь манай үйлчилгээг ашиглахад таны мэдэх ёстой зүйлсийг тайлбарладаг.',
        subsections: [
          {
            id: 'what-are-terms',
            title: 'Эдгээр нөхцөлд юу байгаа вэ?',
            content:
              'Эдгээр нөхцөлүүд нь манай www.sainto.mn вэбсайт (манай сайт) ашиглах дүрмийг танд хэлж өгдөг.',
          },
          {
            id: 'who-we-are',
            title: 'Бид хэн бэ, хэрхэн холбогдох вэ?',
            content:
              'Манай сайтыг Sainto (бид эсвэл биднийх) компани ажиллуулдаг. Бид Улаанбаатар хотод байрладаг компани юм. Бидэнтэй холбогдохдоо доош өгөгдсөн холбоо барих мэдээллийг ашиглана уу.',
          },
        ],
      },
      {
        id: 'website-use',
        title: 'Вэбсайт Ашиглах',
        content: 'Манай платформыг зөв, зохистой ашиглах удирдамж.',
        subsections: [
          {
            id: 'acceptable-use',
            title: 'Зөвшөөрөгдөх ашиглалт',
            content:
              'Та манай сайтыг зөвхөн хууль ёсны зорилгоор ашиглаж болно. Та манай сайтыг дараах зорилгоор ашиглаж болохгүй:',
            items: [
              'Орон нутгийн, үндэсний эсвэл олон улсын хууль, журмыг зөрчихөд',
              'Зөвшөөрөлгүй сурталчилгаа, сурталчилгааны материал илгээхэд',
              'Вирус болон бусад хортой бүрэлдэхүүн агуулсан өгөгдөл, материал илгээхэд',
            ],
          },
          {
            id: 'interactive-services',
            title: 'Интерактив үйлчилгээ',
            content:
              'Бид үе үе манай сайт дээр чат өрөө, зарын самбар, хэрэглэгчийн үнэлгээ зэрэг интерактив үйлчилгээ үзүүлж болно. Бид танд санал болгож буй үйлчилгээний төрөл, хяналттай эсэх талаар тодорхой мэдээлэл өгөх болно.',
          },
        ],
      },
      {
        id: 'accounts',
        title: 'Таны Данс',
        content: 'Данс үүсгэх, хариуцлага, удирдлагатай холбоотой мэдээлэл.',
        subsections: [
          {
            id: 'account-creation',
            title: 'Данс Үүсгэх',
            content:
              'Манай зарим үйлчилгээнд хандахын тулд та данс үүсгэх шаардлагатай. Та өөрийн дансны нэвтрэх мэдээллийг нууцлах хариуцлагатай.',
          },
          {
            id: 'account-security',
            title: 'Дансны Аюулгүй Байдал',
            content:
              'Таны данс зөвшөөрөлгүйгээр ашиглагдсан тохиолдолд шууд бидэнд мэдэгдэх ёстой. Бид таны дансыг зөвшөөрөлгүйгээр ашигласны улмаас учирсан хохирлын хариуцлага хүлээхгүй.',
          },
        ],
      },
      {
        id: 'orders-payments',
        title: 'Захиалга, Төлбөр',
        content: 'Худалдана авалт, төлбөрийн процесстой холбоотой нөхцөлүүд.',
        subsections: [
          {
            id: 'order-process',
            title: 'Захиалгын процесс',
            content:
              'Та манай вэбсайтаар дамжуулан захиалга өгөхөд дараах процесс хэрэгжинэ:',
            items: [
              'Имэйл болон SMS-ээр захиалга баталгаажуулах',
              'Өдөр бүр хүргэлтийн байршлын мэдээлэл өгөх',
              'Хүргэлтийн талаар утсаар харилцах',
            ],
          },
          {
            id: 'payment-methods',
            title: 'Төлбөрийн аргууд',
            content:
              'Бид одоогоор хүргэлтийн үед бэлэн мөнгөөр төлбөр хүлээн авдаг. Ирээдүйд StorePay, QPay, Stripe зэрэг төлбөрийн аргуудыг нэмж оруулна.',
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Мэдээллийн Нууцлал',
        content:
          'Бид таны хувийн мэдээллийг хэрхэн цуглуулж, ашиглаж, хамгаалдаг талаар.',
        subsections: [
          {
            id: 'data-collection',
            title: 'Мэдээлэл Цуглуулах',
            content:
              'Бид таны шууд өгсөн мэдээллийг цуглуулдаг, жишээлбэл данс үүсгэх, худалдан авалт хийх, эсвэл тусламж авахаар холбогдох үед.',
          },
          {
            id: 'data-usage',
            title: 'Мэдээллийг Хэрхэн Ашигладаг',
            content:
              'Бид таны мэдээллийг үйлчилгээ үзүүлэх, засвар үйлчилгээ хийх, сайжруулах, гүйлгээ хийх, таны данс болон үйлчилгээний талаар харилцахад ашигладаг.',
          },
        ],
      },
      {
        id: 'termination',
        title: 'Дуусгавар',
        content: 'Эдгээр нөхцөлийг дуусгах нөхцөлүүд.',
        subsections: [
          {
            id: 'termination-by-user',
            title: 'Таны Талаас Дуусгах',
            content:
              'Та хүссэн үедээ манай хэрэглэгчийн тусламжид хандаж эсвэл тохиргооныхоо данс устгах функцийг ашиглан дансаа устгаж болно.',
          },
          {
            id: 'termination-by-us',
            title: 'Манай Талаас Дуусгах',
            content:
              'Хэрэв та эдгээр нөхцөлийг зөрчих эсвэл манай платформ болон бусад хэрэглэгчдэд хор хохирол учруулах үйлдэл хийвэл бид таны хандалтыг түр зогсоож эсвэл бүрмөсөн дуусгаж болно.',
          },
        ],
      },
    ],
  },
};

const defaultTermsData: TermsData = {
  lastUpdated: 'July 23, 2025',
  published: 'July 23, 2025',
  version: '1.0',
  contactInfo: {
    phone: '(+976) 9019 5589',
    email: 'bilegt6969@gmail.com',
    facebook: 'https://www.facebook.com/profile.php?id=61573613619465',
    instagram: 'https://www.instagram.com/sainto.ub/',
    address: 'Ulaanbaatar, Mongolia',
  },
};

function LanguageSwitcher({
  onToggle,
  t,
  isVisible,
}: {
  onToggle: (lang: LangCode) => void;
  t: Translation;
  isVisible: boolean;
}) {
  const isEnglish = t.language === 'English';
  const buttonText = isEnglish
    ? 'English (United States)'
    : 'Монгол (Монгол Улс)';

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        onClick={() => onToggle(isEnglish ? 'mn' : 'en')}
        className="flex items-center justify-center space-x-2 px-5 py-3 text-sm font-semibold rounded-full bg-neutral-700/90 backdrop-blur-md text-white hover:bg-neutral-600/50 transition-colors duration-200"
      >
        <Globe className="w-4 h-4" />
        <span>{buttonText}</span>
      </button>
    </div>
  );
}

export default function TermsView({
  termsData = defaultTermsData,
}: {
  termsData?: TermsData;
}) {
  const [currentLang, setCurrentLang] = useState<LangCode>('en');
  const [isLanguageSwitcherVisible, setIsLanguageSwitcherVisible] =
    useState(true);
  const footerRef = useRef<HTMLDivElement>(null);
  const t = translations[currentLang];

  const toggleLanguage = (langCode: LangCode) => {
    setCurrentLang(langCode);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!footerRef.current) return;
      const footerRect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const shouldHide = footerRect.top <= windowHeight + 100;
      setIsLanguageSwitcherVisible(!shouldHide);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased">
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="mb-16">
          <p className="text-gray-100 text-sm mb-4">
            {t.published}: {termsData.published}
          </p>
          <h1 className="text-7xl font-normal text-white tracking-tight">
            {t.pageTitle}
          </h1>
        </div>

        <div className="text-left space-y-8 text-lg max-w-xl mx-auto">
          <div className="flex text-left text-gray-100 text-sm mt-6 mb-16">
            <span>
              {t.effective}: {termsData.lastUpdated}
            </span>
            <span className="ml-1 text-white">({t.previousVersion})</span>
          </div>

          <p className="font-semibold">{t.description}</p>

          {t.sections.map((section) => (
            <div key={section.id} className="pt-4">
              <h2 className="text-3xl font-bold text-white mb-4">
                {section.title}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6">
                {section.content}
              </p>
              {section.subsections && (
                <div className="space-y-6">
                  {section.subsections.map((subsection) => (
                    <div key={subsection.id}>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {subsection.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {subsection.content}
                      </p>
                      {subsection.items && (
                        <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-gray-300">
                          {subsection.items.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div
            ref={footerRef}
            className="z-[500] pt-8 mt-8 border-t border-gray-800"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {t.contactInfo}
            </h2>
            <div className="space-y-4 text-gray-300">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span>
                  {t.address}: {termsData.contactInfo.address}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span>
                  {t.email}: {termsData.contactInfo.email}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span>
                  {t.phone}: {termsData.contactInfo.phone}
                </span>
              </div>
            </div>
            <div className="h-32" />
          </div>
        </div>
      </main>

      <LanguageSwitcher
        onToggle={toggleLanguage}
        t={t}
        isVisible={isLanguageSwitcherVisible}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          background-color: #000;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}
