'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AuthHomeLink from '../AuthHomeLink';

import {
  auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  AuthError,
  UserCredential,
  AuthProvider,
  OAuthCredential,
} from '../../../../firebaseConfig';

// Type definitions
type LoadingProvider = 'email' | 'google' | 'facebook' | null;
type AuthMethod = 'google.com' | 'facebook.com' | 'password';

interface LinkingData {
  pendingCred: OAuthCredential;
  email: string;
  existingMethods: AuthMethod[];
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

// Utility Functions
const getFirebaseErrorMessage = (code: string): string => {
  const errorMap: Record<string, string> = {
    'auth/email-already-in-use': 'Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна. Нэвтэрнэ үү.',
    'auth/invalid-email': 'И-мэйл хаяг буруу байна.',
    'auth/weak-password': 'Нууц үг хэтэрхий сул байна. Хамгийн багадаа 6 тэмдэгт оруулна уу.',
    'auth/operation-not-allowed': 'И-мэйл/Нууц үгээр бүртгүүлэх боломжгүй байна. Системийн админтай холбогдоно уу.',
    'auth/network-request-failed': 'Интернэт холболтоо шалгаад дахин оролдоно уу.',
    'auth/too-many-requests': 'Хэт олон удаа оролдсон байна. Хэсэг хүлээгээд дахин оролдоно уу.',
    'auth/popup-closed-by-user': 'Нэвтрэх цонхыг хаасан байна.',
    'auth/popup-blocked': 'Хөтөч цонхыг хаасан байна. Pop-up-г зөвшөөрч дахин оролдону уу.',
    'auth/cancelled-popup-request': 'Нэвтрэх хүсэлтийг цуцалсан байна.',
    'auth/user-disabled': 'Энэ хэрэглэгчийн эрх хязгаарлагдсан байна.',
    'auth/account-exists-with-different-credential': 'Энэ и-мэйл хаяг өөр нэвтрэх аргаар бүртгэлтэй байна.',
    'auth/credential-already-in-use': 'Энэ бүртгэл аль хэдийн холбогдсон байна.',
    'auth/provider-already-linked': 'Энэ нэвтрэх арга аль хэдийн холбогдсон байна.',
  };

  return errorMap[code] || 'Алдаа гарлаа. Дахин оролдоно уу.';
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Хэтэрхий сул';
  let color = 'bg-red-500';

  if (score >= 5) {
    label = 'Маш хүчтэй';
    color = 'bg-green-500';
  } else if (score >= 4) {
    label = 'Хүчтэй';
    color = 'bg-green-400';
  } else if (score >= 3) {
    label = 'Дунд зэрэг';
    color = 'bg-yellow-500';
  } else if (score >= 2) {
    label = 'Сул';
    color = 'bg-orange-500';
  }

  return { score, label, color, requirements };
};

const getProviderDisplayName = (method: AuthMethod): string => {
  const displayNames: Record<AuthMethod, string> = {
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'password': 'И-мэйл/Нууц үг',
  };
  return displayNames[method];
};

// Password Strength Indicator Component
interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = false,
}) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const widthPercentage = (strength.score / 5) * 100;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: `${widthPercentage}%` }}
          />
        </div>
        <span className="text-xs text-neutral-400 min-w-[80px]">{strength.label}</span>
      </div>

      {showRequirements && (
        <div className="space-y-1 text-xs">
          <div className={`flex items-center gap-1.5 ${strength.requirements.length ? 'text-green-400' : 'text-neutral-500'}`}>
            {strength.requirements.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Хамгийн багадаа 8 тэмдэгт</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.requirements.uppercase ? 'text-green-400' : 'text-neutral-500'}`}>
            {strength.requirements.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Том үсэг (A-Z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.requirements.lowercase ? 'text-green-400' : 'text-neutral-500'}`}>
            {strength.requirements.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Жижиг үсэг (a-z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.requirements.number ? 'text-green-400' : 'text-neutral-500'}`}>
            {strength.requirements.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Тоо (0-9)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${strength.requirements.special ? 'text-green-400' : 'text-neutral-500'}`}>
            {strength.requirements.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            <span>Тусгай тэмдэгт (!@#$...)</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Account Linking Modal Component
interface AccountLinkingModalProps {
  isOpen: boolean;
  linkingData: LinkingData | null;
  isLoading: boolean;
  onClose: () => void;
  onLink: (method: AuthMethod) => void;
}

const AccountLinkingModal: React.FC<AccountLinkingModalProps> = ({
  isOpen,
  linkingData,
  isLoading,
  onClose,
  onLink,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements?.[0] as HTMLElement;
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !linkingData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="bg-neutral-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-neutral-700/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="linking-modal-title"
      >
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 id="linking-modal-title" className="text-xl font-semibold text-white">
            Бүртгэл холбох
          </h3>
        </div>
        <p className="text-neutral-300 mb-6">
          <strong>{linkingData.email}</strong> хаяг өөр нэвтрэх аргаар бүртгэлтэй байна. Та бүртгэлүүдээ холбож нэг данс болгохыг хүсэж байна уу?
        </p>
        <div className="space-y-3 mb-6">
          <p className="text-sm font-semibold text-neutral-200">Одоо байгаа нэвтрэх аргууд:</p>
          {linkingData.existingMethods.map((method, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-neutral-300">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {getProviderDisplayName(method)}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-neutral-700 text-neutral-100 rounded-2xl hover:bg-neutral-600 transition-all font-semibold disabled:opacity-50"
          >
            Цуцлах
          </button>
          {linkingData.existingMethods.includes('google.com') && (
            <button
              onClick={() => onLink('google.com')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Холбож байна...' : 'Google-тэй холбох'}
            </button>
          )}
          {linkingData.existingMethods.includes('facebook.com') && (
            <button
              onClick={() => onLink('facebook.com')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#1877f2] text-white rounded-2xl hover:bg-[#166fe5] transition-all font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Холбож байна...' : 'Facebook-тэй холбох'}
            </button>
          )}
          {linkingData.existingMethods.includes('password') && (
            <button
              onClick={() => onLink('password')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-900 text-white rounded-2xl hover:bg-black transition-all font-semibold disabled:opacity-50"
            >
              Нууц үгээр нэвтрэх
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<LoadingProvider>(null);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const [linkingData, setLinkingData] = useState<LinkingData | null>(null);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const router = useRouter();

  // Memoized password matching check
  const passwordsMatch = useMemo(() => {
    if (!password || !confirmPassword) return null;
    return password === confirmPassword;
  }, [password, confirmPassword]);

  /**
   * Handles email/password signup.
   */
  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error('И-мэйл, нууц үг болон нууц үгээ баталгаажуулна уу.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Зөв и-мэйл хаяг оруулна уу.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Нууц үгнүүд таарахгүй байна. Дахин шалгана уу.');
      return;
    }

    const strength = calculatePasswordStrength(password);
    if (strength.score < 2) {
      toast.error('Нууц үг хэтэрхий сул байна. Илүү хүчтэй нууц үг оруулна уу.');
      return;
    }

    setIsLoading(true);
    setLoadingProvider('email');

    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Email/Password signup successful:', userCredential.user);
      toast.success('Амжилттай бүртгүүллээ!');
      router.push('/');
    } catch (error) {
      const authError = error as AuthError;
      console.error('Email/Password signup error:', authError);
      toast.error(getFirebaseErrorMessage(authError.code));
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  /**
   * Handles account linking.
   */
  const handleAccountLinking = async (existingMethod: AuthMethod) => {
    if (!linkingData) return;

    setIsLoading(true);

    try {
      if (existingMethod === 'google.com') {
        const googleProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, googleProvider);
        await linkWithCredential(result.user, linkingData.pendingCred);
        toast.success('Амжилттай! Та одоо Google болон Facebook хоёулангаас нь ашиглан нэвтэрч болно.');
        router.push('/');
      } else if (existingMethod === 'facebook.com') {
        const facebookProvider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, facebookProvider);
        await linkWithCredential(result.user, linkingData.pendingCred);
        toast.success('Амжилттай! Та одоо Google болон Facebook хоёулангаас нь ашиглан нэвтэрч болно.');
        router.push('/');
      } else if (existingMethod === 'password') {
        toast.info('Та эхлээд и-мэйл/нууц үгээрээ нэвтэрч, дараань тохиргооноос бусад аргуудыг холбоно уу.');
        setShowLinkingModal(false);
        setLinkingData(null);
        return;
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Account linking error:', authError);
      toast.error(getFirebaseErrorMessage(authError.code));
    } finally {
      setIsLoading(false);
      setShowLinkingModal(false);
      setLinkingData(null);
    }
  };

  /**
   * Handles social media logins.
   */
  const handleSocialLogin = async (providerName: 'google' | 'facebook') => {
    setIsLoading(true);
    setLoadingProvider(providerName);

    let provider: AuthProvider;
    if (providerName === 'google') {
      provider = new GoogleAuthProvider();
    } else {
      provider = new FacebookAuthProvider();
    }

    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      console.log(`${providerName} signup/login successful:`, result.user);
      toast.success(`${providerName === 'google' ? 'Google' : 'Facebook'}-ээр амжилттай бүртгүүллээ/нэвтэрлээ!`);
      router.push('/');
    } catch (error) {
      const authError = error as AuthError & { customData?: { email?: string } };
      console.error(`${providerName} signup/login error:`, authError);

      if (authError.code === 'auth/account-exists-with-different-credential') {
        const email = authError.customData?.email;
        const credential =
          providerName === 'google'
            ? GoogleAuthProvider.credentialFromError(authError)
            : FacebookAuthProvider.credentialFromError(authError);

        if (email && credential) {
          try {
            const existingMethods = await fetchSignInMethodsForEmail(auth, email);
            setLinkingData({
              pendingCred: credential,
              email: email,
              existingMethods: existingMethods as AuthMethod[],
            });
            setShowLinkingModal(true);
          } catch (fetchError) {
            console.error('Error fetching sign-in methods:', fetchError);
            toast.error('Энэ и-мэйл хаяг өөр нэвтрэх аргаар бүртгэлтэй байна. Тухайн аргаар нэвтэрнэ үү.');
          }
        } else {
          toast.error('Энэ и-мэйл хаяг өөр нэвтрэх аргаар бүртгэлтэй байна. Тухайн аргаар нэвтэрч орно уу.');
        }
      } else if (authError.code === 'auth/cancelled-popup-request') {
        // Silent - user intentionally cancelled
      } else {
        toast.error(getFirebaseErrorMessage(authError.code));
      }
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center font-sans bg-[#111111] text-white">
      <AuthHomeLink />
      {/* Account Linking Modal */}
      <AccountLinkingModal
        isOpen={showLinkingModal}
        linkingData={linkingData}
        isLoading={isLoading}
        onClose={() => {
          if (!isLoading) {
            setShowLinkingModal(false);
            setLinkingData(null);
          }
        }}
        onLink={handleAccountLinking}
      />

      {/* Main Signup Content */}
      <div className="flex w-full min-h-screen">
        {/* Left Half: Background Image */}
        <div
          className="hidden md:flex w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://cdn.cosmos.so/745b057c-5dec-459c-84a5-a7a48e11bee7?format=jpeg")',
          }}
          role="img"
          aria-label="Signup page background"
        />

        {/* Right Half: Signup Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-[#111111]">
          <div className="w-full max-w-sm mx-auto">
            <h1 className="text-3xl font-semibold mb-8 text-white text-center">Бүртгэл үүсгэх</h1>

            <form onSubmit={handleSignup} className="space-y-4 text-left">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
                  И-мэйл хаяг
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-600 rounded-full bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
                  Нууц үг
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    className="w-full px-4 py-3 border border-neutral-600 rounded-full bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 focus:outline-none"
                    aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} showRequirements={showPasswordRequirements} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-1">
                  Нууц үгээ баталгаажуулах
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-full bg-neutral-700 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 pr-10 ${
                      passwordsMatch === null
                        ? 'border-neutral-600 focus:ring-blue-500 focus:border-blue-500'
                        : passwordsMatch
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
                        : 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    }`}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordsMatch !== null && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    {passwordsMatch ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Нууц үгнүүд таарч байна</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">Нууц үгнүүд таарахгүй байна</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword || !passwordsMatch}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-base font-medium text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading && loadingProvider === 'email' ? (
                  <div className="w-5 h-5 border-2 border-gray-500/30 border-t-gray-700 rounded-full animate-spin"></div>
                ) : (
                  'Бүртгүүлэх'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-neutral-400 mt-6">
              Аль хэдийн бүртгэлтэй юу?{' '}
              <a href="/auth/login" className="font-medium underline hover:text-neutral-300">
                Нэвтрэх
              </a>
            </p>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#111111] text-neutral-400 font-medium">эсвэл</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
                className="relative rounded-full h-11 text-base font-bold px-4 bg-transparent text-white shadow-inset-1 border border-neutral-600 hover:bg-neutral-700 active:bg-neutral-700 hover:border-neutral-500 active:border-neutral-500 focus-visible:ring-4 focus-visible:ring-blue-500/50 cursor-pointer transition-colors ease-out w-full flex items-center justify-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingProvider === 'google' ? (
                  <div className="w-5 h-5 border-2 border-neutral-400/30 border-t-neutral-100 rounded-full animate-spin"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <g clipPath="url(#clip0_9_516)">
                      <path d="M19.8052 10.2304C19.8052 9.55059 19.7501 8.86714 19.6325 8.19839H10.2002V12.0492H15.6016C15.3775 13.2912 14.6573 14.3898 13.6027 15.088V17.5866H16.8252C18.7176 15.8449 19.8052 13.2728 19.8052 10.2304Z" fill="#4285F4"></path>
                      <path d="M10.1999 20.0007C12.897 20.0007 15.1714 19.1151 16.8286 17.5866L13.6061 15.0879C12.7096 15.6979 11.5521 16.0433 10.2036 16.0433C7.59474 16.0433 5.38272 14.2832 4.58904 11.9169H1.26367V14.4927C2.96127 17.8695 6.41892 20.0007 10.1999 20.0007V20.0007Z" fill="#34A853"></path>
                      <path d="M4.58565 11.9169C4.16676 10.675 4.16676 9.33011 4.58565 8.08814V5.51236H1.26395C-0.154389 8.33801 -0.154389 11.6671 1.26395 14.4927L4.58565 11.9169V11.9169Z" fill="#FBBC04"></path>
                      <path d="M10.1999 3.95805C11.6256 3.936 13.0035 4.47247 14.036 5.45722L16.8911 2.60218C15.0833 0.904587 12.6838 -0.0287217 10.1999 0.000673888C6.41892 0.000673888 2.96127 2.13185 1.26367 5.51234L4.58537 8.08813C5.37538 5.71811 7.59107 3.95805 10.1999 3.95805V3.95805Z" fill="#EA4335"></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_9_516">
                        <rect width="20" height="20" fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                )}
                <span className="truncate">Google-ээр үргэлжлүүлэх</span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
                className="relative rounded-full h-11 text-base font-bold px-4 bg-transparent text-white shadow-inset-1 border border-neutral-600 hover:bg-neutral-700 active:bg-neutral-700 hover:border-neutral-500 active:border-neutral-500 focus-visible:ring-4 focus-visible:ring-blue-500/50 cursor-pointer transition-colors ease-out w-full flex items-center justify-center gap-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && loadingProvider === 'facebook' ? (
                  <div className="w-5 h-5 border-2 border-neutral-400/30 border-t-neutral-100 rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                    <linearGradient id="Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1" x1="9.993" x2="40.615" y1="9.993" y2="40.615" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#2aa4f4"></stop>
                      <stop offset="1" stopColor="#007ad9"></stop>
                    </linearGradient>
                    <path fill="url(#Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1)" d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z"></path>
                    <path fill="#fff" d="M26.707,29.301h5.176l0.813-5.258h-5.989v-2.874c0-2.184,0.714-4.121,2.757-4.121h3.283V12.46 c-0.577-0.078-1.797-0.248-4.102-0.248c-4.814,0-7.636,2.542-7.636,8.334v3.498H16.06v5.258h4.948v14.452 C21.988,43.9,22.981,44,24,44c0.921,0,1.82-0.084,2.707-0.204V29.301z"></path>
                  </svg>
                )}
                <span className="truncate">Facebook-ээр үргэлжлүүлэх</span>
              </button>
            </div>

            <div className="mt-12 text-sm text-neutral-400">
              <p className="text-center">
                Үргэлжлүүлснээр та SAINTO-ийн{' '}
                <a href="/terms" className="underline hover:text-neutral-300">
                  Үйлчилгээний Нөхцөл
                </a>
                -ийг зөвшөөрч буй болно.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background-color: #111111;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .shadow-inset-1 {
          box-shadow: inset 0 0 0 1px rgba(64, 64, 64, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SignupPage;