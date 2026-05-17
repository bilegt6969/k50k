'use client';
import { useState, useEffect, useCallback } from 'react';
import useCartStore from '../../store/cartStore';
import useOrderStore from '../orderStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, ShoppingBag, Info, Copy, Check, Home, Landmark, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast, Toaster } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map, type MapViewport, MapControls } from '@/components/ui/map';

// Interfaces
interface CartItem {
  product: {
    id: string;
    name: string;
    image_url?: string;
    mainPictureUrl?: string;
  };
  size: string;
  quantity: number;
  price: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

// Updated bank account keys
type BankAccountKey = 'Account1';

// Location data for Mongolia
const mongolianLocations: Record<string, string[]> = {
  'Улаанбаатар': ['Баянзүрх дүүрэг','Хан-Уул дүүрэг','Баянгол дүүрэг','Чингэлтэй дүүрэг','Сүхбаатар дүүрэг','Сонгинохайрхан дүүрэг','Налайх дүүрэг','Багануур дүүрэг','Багахангай дүүрэг'],
  'Архангай':['Эрдэнэбулган сум','Батцэнгэл сум','Булган сум (Архангай)','Жаргалант сум (Архангай)','Ихтамир сум','Тариат сум','Хайрхан сум (Архангай)','Хотонт сум','Цахир сум','Цэцэрлэг сум (Архангай)','Чулуут сум','Өгийнуур сум','Өлзийт сум (Архангай)','Өндөр-Улаан сум','Эрдэнэмандал сум'],
  'Баян-Өлгий':['Өлгий сум','Алтай сум (Баян-Өлгий)','Алтанцөгц сум','Баяннуур сум (Баян-Өлгий)','Бугат сум (Баян-Өлгий)','Булган сум (Баян-Өлгий)','Дэлүүн сум','Ногооннуур сум','Сагсай сум','Толбо сум','Улаанхус сум','Цэнгэл сум'],
  // ... (keep all other provinces as in original)
};

// Updated BankAccountDetails
const bankAccounts: Record<BankAccountKey, { number: string; name: string; recipient: string; logo?: string; IBAN?: string }> = {
  Account1: {
    number: '2205202046',
    IBAN: '28001500',
    name: 'Голомт Банк',
    recipient: 'Аззаяа Түвшинтөгс',
  }
};

export default function PaymentPage() {
  const { cart, clearCart } = useCartStore();
  const router = useRouter();
  const { transferCode, setTransferCode, setOrderNumber, orderNumber } = useOrderStore();
  const [paymentMethod, setPaymentMethod] = useState<BankAccountKey | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState(1);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    province: '',
    district: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
  });
  const [infoToastShown, setInfoToastShown] = useState(false);
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  // Map viewport state - centered on Ulaanbaatar
  const [viewport, setViewport] = useState<MapViewport>({
    center: [106.9057, 47.9184], // Ulaanbaatar coordinates
    zoom: 12,
    bearing: 0,
    pitch: 0,
  });

  // Marker position state
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  // Get current date/time for receipt
  useEffect(() => {
    setCurrentDateTime(new Date().toLocaleString('mn-MN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }, []);

  // Generate unique codes on mount if cart is not empty
  useEffect(() => {
    if (cart.length > 0 && !transferCode && cart[0]?.product?.name) {
      const productPrefix = cart[0].product.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const code = `${productPrefix}${randomNum}`;
      setTransferCode(code);
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      setOrderNumber(orderNum);
    }
  }, [cart, setTransferCode, setOrderNumber, transferCode]);

  // Show payment method info toast when entering step 2
  useEffect(() => {
    if (step === 2 && !infoToastShown) {
      toast.info('Уучлаарай, бид төлбөрийн системтэй хараахан холбогдоогүй байна. Төлбөрөө заавал шилжүүлгээр хийгээрэй.', {
        icon: <Info className="h-5 w-5 text-blue-300" />,
        style: { background: '#1e40af', color: 'white', border: 'none', borderRadius: '12px' },
        duration: 8000,
      });
      setInfoToastShown(true);
    }
    if (step === 1) {
      setInfoToastShown(false);
    }
  }, [step, infoToastShown]);

  // Calculate prices
  const subtotal = cart.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 5000;
  const commissionRate = 0.15;
  const commissionFee = subtotal * commissionRate;
  const grandTotal = subtotal + deliveryFee + commissionFee;

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'province' && { district: '' }),
    }));
  };

  const handlePaymentMethodSelect = (key: BankAccountKey) => {
    setPaymentMethod(key);
  };

  const handleCopyCode = useCallback(async () => {
    if (!transferCode) return;
    try {
      await navigator.clipboard.writeText(transferCode);
      setIsCopied(true);
      toast.success("Гүйлгээний утга хуулагдлаа!", {
        style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("Хуулж чадсангүй. Та өөрөө хуулна уу.", {
        style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
      });
      console.error('Failed to copy text:', err);
    }
  }, [transferCode]);

  const showToastError = (message: string) => {
    toast.error(message, {
      style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
    });
  };

  const isCyrillicName = (name: string): boolean => /^[\u0400-\u04FF\u0500-\u052F\s]+$/.test(name.trim());
  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidPhone = (phone: string): boolean => /^\d{8}$/.test(phone.trim());

  const validateShippingInfo = (): boolean => {
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();

    if (!trimmedName) { showToastError('Нэрээ оруулна уу.'); return false; }
    if (!isCyrillicName(trimmedName)) { showToastError('Нэрээ заавал кирилл үсгээр бичнэ үү.'); return false; }
    if (!trimmedPhone) { showToastError('Утасны дугаараа оруулна уу.'); return false; }
    if (!isValidPhone(trimmedPhone)) { showToastError('Утасны дугаараа зөв оруулна уу (яг 8 оронтой тоо).'); return false; }
    if (!trimmedEmail) { showToastError('И-мэйл хаягаа оруулна уу.'); return false; }
    if (!isValidEmail(trimmedEmail)) { showToastError('И-мэйл хаягаа зөв оруулна уу.'); return false; }
    if (!formData.province) { showToastError('Аймаг/Хот сонгоно уу.'); return false; }
    if (!formData.district) { showToastError('Дүүрэг/Сум сонгоно уу.'); return false; }
    if (!trimmedAddress) { showToastError('Дэлгэрэнгүй хаягаа оруулна уу.'); return false; }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShippingInfo()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepNavigation = (targetStep: number) => {
    if (targetStep === 1) {
      setStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep === 2) {
      handleContinueToPayment();
    }
  };

  /** Save lng/lat + reverse geocode (used by center-pin button and current-location). */
  const applyCoordinatesToDelivery = useCallback(async (lng: number, lat: number) => {
    setMarkerPosition([lng, lat]);
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=mn`
      );
      const data = await response.json();

      if (data && data.address) {
        const addressParts = [
          data.address.road,
          data.address.suburb || data.address.neighbourhood,
          data.address.city || data.address.town,
        ].filter(Boolean);

        const addressString = addressParts.join(', ');

        setFormData((prev) => ({
          ...prev,
          address: addressString || prev.address,
        }));

        toast.success('Байршил сонгогдлоо!', {
          style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
        });
      } else {
        toast.info('Байршил хадгалагдлаа. Хаягаа шаардлагатай бол гараар оруулна уу.', {
          style: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px' },
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.info('Байршил хадгалагдлаа. Хаягаа гараар оруулна уу.', {
        style: { background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px' },
      });
    }
  }, []);

  const handleConfirmMapCenter = useCallback(() => {
    const [lng, lat] = viewport.center;
    void applyCoordinatesToDelivery(lng, lat);
  }, [viewport.center, applyCoordinatesToDelivery]);

  // Toggle map picker visibility
  const toggleMapPicker = () => {
    setShowMapPicker(!showMapPicker);
  };

  // Use current location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setViewport((prev) => ({
            ...prev,
            center: [longitude, latitude],
            zoom: 15,
          }));
          await applyCoordinatesToDelivery(longitude, latitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Байршлыг тогтоож чадсангүй. Зөвшөөрөл өгсөн эсэхээ шалгана уу.', {
            style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
          });
        }
      );
    } else {
      toast.error('Таны хөтөч байршил тогтоохыг дэмжихгүй байна.', {
        style: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px' },
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateShippingInfo()) {
      setStep(1);
      showToastError('Хүргэлтийн мэдээллээ бүрэн шалгана уу.');
      return;
    }
    if (!paymentMethod) {
      showToastError('Төлбөрийн хэрэгсэл сонгоно уу.');
      return;
    }
    setIsSubmitting(true);
    try {
      const orderPayload = {
        _type: 'order',
        orderNumber,
        transferCode,
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        province: formData.province,
        district: formData.district,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        paymentMethod,
        bankName: bankAccounts[paymentMethod].name,
        bankAccount: bankAccounts[paymentMethod].number,
        subtotal,
        deliveryFee,
        commissionFee,
        totalAmount: grandTotal,
        orderStatus: 'PendingPayment',
        items: cart.map((item: CartItem) => ({
          _key: `${item.product.id}-${item.size}`,
          productId: item.product.id,
          name: item.product.name,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.product.mainPictureUrl
        })),
        createdAt: new Date().toISOString(),
      };
      const response = await fetch('/api/createorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorData;
        if (contentType && contentType.indexOf("application/json") !== -1) {
          errorData = await response.json();
        } else {
          const textError = await response.text();
          errorData = { message: `Серверээс алдаатай хариу буцлаа: ${response.status}. ${textError.substring(0, 100)}...` };
        }
        throw new Error(errorData.message || 'Захиалга үүсгэхэд алдаа гарлаа.');
      }

      setIsSubmittedSuccessfully(true);
      toast.success(`Захиалга #${orderNumber} амжилттай! Гүйлгээний утга: ${transferCode}. Төлбөрөө шилжүүлнэ үү.`, {
        style: { background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px' },
        duration: 10000
      });
      clearCart();
      router.push('/payment-success');
    } catch (error: unknown) {
      console.error("Order submission error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Дахин оролдоно уу.';
      showToastError(`Захиалга илгээхэд алдаа гарлаа: ${errorMessage}`);
      setIsSubmittedSuccessfully(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !isSubmitting && !isSubmittedSuccessfully) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-neutral-900">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-8 py-10 shadow-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white mb-6 border border-neutral-200 shadow-sm">
            <ShoppingBag className="h-10 w-10 text-neutral-500" />
          </div>
          <h2 className="text-3xl font-semibold text-neutral-900 mb-3">Таны сагс хоосон байна</h2>
          <p className="text-neutral-600 mb-10 text-lg">Захиалга хийхийн тулд эхлээд хүссэн бараагаа сагсандаа нэмнэ үү.</p>
          <Link href="/">
            <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-8 py-6 rounded-full">
              <Home className="mr-2 h-4 w-4" />
              Дэлгүүр лүү буцах
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ProgressIndicator = () => (
    <div className="mb-10 flex flex-col items-center">
      <div className="flex items-center justify-center space-x-2 sm:space-x-4 w-full max-w-xs sm:max-w-sm">
        <div className="flex flex-col items-center">
          <button type="button" onClick={() => handleStepNavigation(1)} className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'} font-semibold transition-colors duration-300 ${step !== 1 ? 'cursor-pointer hover:bg-neutral-300 hover:text-neutral-900' : ''}`} disabled={step === 1 && !isSubmitting} aria-label="Go to Step 1: Shipping">1</button>
          <span className={`mt-1.5 text-xs ${step >= 1 ? 'text-neutral-900 font-medium' : 'text-neutral-500'} ${step !== 1 ? 'cursor-pointer hover:text-neutral-900' : ''}`} onClick={() => step !== 1 && handleStepNavigation(1)}>Хүргэлт</span>
        </div>
        <div className={`flex-grow h-0.5 mt-[-1em] ${step >= 2 ? 'bg-neutral-900' : 'bg-neutral-200'} transition-colors duration-300`}></div>
        <div className="flex flex-col items-center">
          <button type="button" onClick={() => handleStepNavigation(2)} className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'} font-semibold transition-colors duration-300 ${step !== 2 ? 'cursor-pointer hover:bg-neutral-300 hover:text-neutral-900' : ''}`} disabled={(step === 2 && !isSubmitting) || isSubmitting} aria-label="Go to Step 2: Payment">2</button>
          <span className={`mt-1.5 text-xs ${step >= 2 ? 'text-neutral-900 font-medium' : 'text-neutral-500'} ${step !== 2 ? 'cursor-pointer hover:text-neutral-900' : ''}`} onClick={() => step !== 2 && handleStepNavigation(2)}>Төлбөр</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <Toaster position="bottom-right" richColors />
      <div className="max-w-6xl mx-auto mb-6">
        <Button variant="ghost" onClick={() => step === 1 ? router.back() : handleStepNavigation(1)} className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 px-0 hover:bg-transparent" aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? 'Буцах' : 'Хүргэлтийн мэдээлэл рүү буцах'}
        </Button>
      </div>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-neutral-900 mb-4 text-center">{step === 1 ? 'Хүргэлтийн мэдээлэл' : 'Төлбөрийн хэлбэр'}</h1>
        <ProgressIndicator />

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="bg-neutral-100 border border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4 border-b border-neutral-200/80 bg-neutral-100">
                      <CardTitle className="text-xl font-medium text-neutral-900">Хүргэлтийн мэдээлэл</CardTitle>
                      <CardDescription className="text-neutral-600">Барааг хүлээн авах хүний мэдээллийг үнэн зөв оруулна уу.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-neutral-700 font-medium">Нэр<span className="text-red-500">*</span></Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required autoComplete="name" aria-required="true" className="bg-white border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500 h-12 shadow-sm" placeholder="Кириллээр бичнэ үү" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-neutral-700 font-medium">Утасны дугаар<span className="text-red-500">*</span></Label>
                          <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required autoComplete="tel" aria-required="true" maxLength={8} className="bg-white border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500 h-12 shadow-sm" placeholder="8 оронтой дугаар" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-neutral-700 font-medium">И-мэйл хаяг<span className="text-red-500">*</span></Label>
                        <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required autoComplete="email" className="bg-white border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500 h-12 shadow-sm" placeholder="yourname@example.com" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-neutral-700 font-medium">Аймаг/Хот<span className="text-red-500">*</span></Label>
                          <Select value={formData.province} onValueChange={(value) => handleSelectChange('province', value)}>
                            <SelectTrigger className="bg-white border-neutral-200 rounded-xl text-neutral-900 h-12 shadow-sm">
                              <SelectValue placeholder="Аймаг/Хот сонгоно уу" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900 max-h-60">
                              {Object.keys(mongolianLocations).sort().map((province) => (
                                <SelectItem key={province} value={province} className="hover:bg-neutral-100 focus:bg-neutral-100">{province}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-700 font-medium">Дүүрэг/Сум<span className="text-red-500">*</span></Label>
                          <Select value={formData.district} onValueChange={(value) => handleSelectChange('district', value)} disabled={!formData.province}>
                            <SelectTrigger className="bg-white border-neutral-200 rounded-xl text-neutral-900 h-12 shadow-sm">
                              <SelectValue placeholder="Дүүрэг/Сум сонгоно уу" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-neutral-200 text-neutral-900 max-h-60">
                              {formData.province && mongolianLocations[formData.province]?.sort().map((district) => (
                                <SelectItem key={district} value={district} className="hover:bg-neutral-100 focus:bg-neutral-100">{district}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Map Location Picker Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-neutral-700 font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Байршил: төвийн зураасан дээр байрлуулж, доорх товчоор хадгална
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleMapPicker}
                            className="bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
                          >
                            {showMapPicker ? 'Газрын зураг хаах' : 'Газрын зураг нээх'}
                          </Button>
                        </div>

                        <AnimatePresence>
                          {showMapPicker && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                  <Info className="h-4 w-4" />
                                  <span>Газрын зургийг зөөх/томруулах — одоогийн төвийн доорх цэгийг сонгоно. Дараа нь <span className="font-medium text-neutral-800">«Энэ байршлыг сонгох»</span> дарна уу. Эсвэл одоогийн GPS-ээ ашиглана уу.</span>
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={handleUseCurrentLocation}
                                  className="w-full bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100"
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Одоогийн байршлаа ашиглах
                                </Button>

                                <div className="h-[400px] relative w-full rounded-lg overflow-hidden border border-neutral-200">
                                  <Map
                                    viewport={viewport}
                                    onViewportChange={setViewport}
                                    styles={{
                                      light: {
                                        version: 8,
                                        sources: {
                                          'carto-light': {
                                            type: 'raster',
                                            tiles: [
                                              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                                            ],
                                            tileSize: 256,
                                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                          }
                                        },
                                        layers: [
                                          {
                                            id: 'carto-light-layer',
                                            type: 'raster',
                                            source: 'carto-light',
                                            minzoom: 0,
                                            maxzoom: 22
                                          }
                                        ]
                                      },
                                      dark: {
                                        version: 8,
                                        sources: {
                                          'carto-light': {
                                            type: 'raster',
                                            tiles: [
                                              'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                                              'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
                                            ],
                                            tileSize: 256,
                                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                          }
                                        },
                                        layers: [
                                          {
                                            id: 'carto-light-layer',
                                            type: 'raster',
                                            source: 'carto-light',
                                            minzoom: 0,
                                            maxzoom: 22
                                          }
                                        ]
                                      }
                                    }}
                                  >
                                    <MapControls position="top-right" />
                                  </Map>

                                  {/* Fixed center pin — saved coords match map center (viewport.center) */}
                                  <div
                                    className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center"
                                    aria-hidden
                                  >
                                    <div className="-translate-y-3 flex flex-col items-center">
                                      <div className="rounded-full bg-white p-1 shadow-md ring-2 ring-red-500/90">
                                        <MapPin className="h-8 w-8 text-red-600" strokeWidth={2.25} aria-hidden />
                                      </div>
                                      <div className="h-2 w-px bg-red-600/80" />
                                    </div>
                                  </div>

                                  <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="w-full bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg"
                                      onClick={handleConfirmMapCenter}
                                    >
                                      <MapPin className="h-4 w-4 mr-2 shrink-0" />
                                      Энэ байршлыг сонгох (төвийн координат)
                                    </Button>
                                  </div>

                                  {/* Viewport info overlay */}
                                  <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono bg-white/95 backdrop-blur px-3 py-2 rounded-lg border border-neutral-200 shadow-sm">
                                    <span>
                                      <span className="text-neutral-500">Lng:</span>{' '}
                                      <span className="text-neutral-900">{viewport.center[0].toFixed(4)}</span>
                                    </span>
                                    <span>
                                      <span className="text-neutral-500">Lat:</span>{' '}
                                      <span className="text-neutral-900">{viewport.center[1].toFixed(4)}</span>
                                    </span>
                                    <span>
                                      <span className="text-neutral-500">Zoom:</span>{' '}
                                      <span className="text-neutral-900">{viewport.zoom.toFixed(1)}</span>
                                    </span>
                                  </div>
                                </div>

                                {markerPosition && (
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-900">
                                    <div className="flex items-center gap-2 mb-1">
                                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                                      <span className="font-medium">Байршил сонгогдлоо</span>
                                    </div>
                                    <div className="text-xs text-emerald-800 ml-6">
                                      Координат: {markerPosition[1].toFixed(5)}, {markerPosition[0].toFixed(5)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-neutral-700 font-medium">Дэлгэрэнгүй хаяг<span className="text-red-500">*</span></Label>
                        <Textarea id="address" name="address" value={formData.address} onChange={handleInputChange} required rows={3} aria-required="true" placeholder="Гудамж, хороолол, байр, орц, тоот..." className="bg-white border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:ring-blue-500 shadow-sm" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                  <Card className="bg-neutral-100 border border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4 border-b border-neutral-200/80 bg-neutral-100">
                      <CardTitle className="text-xl font-medium text-neutral-900">Төлбөрийн хэрэгсэл сонгох</CardTitle>
                      <CardDescription className="text-neutral-600">Төлбөрөө доорх данснуудын аль нэг рүү шилжүүлж, гүйлгээний утгад кодыг бичээд захиалгаа баталгаажуулна уу.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div>
                        <Label className="text-neutral-700 font-medium mb-3 block">Шилжүүлэх Банк<span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                          {Object.entries(bankAccounts).map(([key, { name }]) => {
                            const isSelected = paymentMethod === key;
                            return (
                              <button type="button" key={key} onClick={() => handlePaymentMethodSelect(key as BankAccountKey)} className={`relative p-4 h-20 sm:h-24 flex flex-col items-center justify-center rounded-xl border-2 text-center transition-all duration-200 ease-in-out group focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 ${isSelected ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600 ring-offset-2 ring-offset-neutral-100' : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm'}`} aria-pressed={isSelected}>
                                <span className={`font-medium text-xs sm:text-sm ${isSelected ? 'text-blue-900' : 'text-neutral-800'}`}>{name}</span>
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 text-blue-600">
                                    <CheckCircle className="h-4 w-4" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {paymentMethod && bankAccounts[paymentMethod] && (
                        <motion.div initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: '24px' }} transition={{ duration: 0.3, ease: "easeOut" }} className="bg-gradient-to-br from-white via-neutral-50 to-blue-50/60 border border-neutral-200 p-5 sm:p-6 rounded-2xl shadow-sm overflow-hidden">
                          <h3 className="font-medium text-blue-900 mb-4 flex items-center gap-2 text-lg">
                            <Landmark className="h-5 w-5 flex-shrink-0 text-blue-700" />
                            Төлбөр хүлээн авагч
                          </h3>
                          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm sm:text-base text-neutral-800 mb-5">
                            <dt className="font-medium text-blue-800/90">Банк:</dt>
                            <dd className="text-neutral-900">{bankAccounts[paymentMethod].name}</dd>
                            <dt className="font-medium text-blue-800/90 self-start pt-1">IBAN:</dt>
                            <dd className="font-mono text-neutral-900 text-lg sm:text-xl tracking-wider bg-white border border-neutral-200 px-3 py-1 rounded-md w-fit">{bankAccounts[paymentMethod].IBAN}</dd>
                            <dt className="font-medium text-blue-800/90 self-start pt-1">Данс:</dt>
                            <dd className="font-mono text-neutral-900 text-lg sm:text-xl tracking-wider bg-white border border-neutral-200 px-3 py-1 rounded-md w-fit">{bankAccounts[paymentMethod].number}</dd>
                            <dt className="font-medium text-blue-800/90">Хүлээн авагч:</dt>
                            <dd className="text-neutral-900">{bankAccounts[paymentMethod].recipient}</dd>
                          </dl>
                          <Separator className="my-5 bg-neutral-200" />
                          <div>
                            <span className="font-medium text-blue-900 block mb-2 text-sm sm:text-base">Гүйлгээний утга (Заавал хуулж бичнэ үү):</span>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white px-3 sm:px-4 py-3 rounded-xl border border-neutral-200 w-fit shadow-sm">
                              <span className="font-bold text-neutral-900 text-xl sm:text-2xl tracking-widest">{transferCode}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 p-0 text-blue-700 hover:bg-blue-100 hover:text-blue-900 rounded-full" onClick={handleCopyCode} aria-label="Copy transfer code" disabled={!transferCode}>
                                {isCopied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm text-neutral-700 pt-4 mt-4 bg-blue-50/80 p-3 sm:p-4 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-2">
                              <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-blue-700" />
                              <p><span className="font-medium text-neutral-900">Анхаарах зүйл:</span> Төлбөр хийсний дараа захиалгын дугаар <span className="font-bold">{orderNumber}</span> болон гүйлгээний утга <span className="font-mono font-bold">{transferCode}</span> зөв бичсэн эсэхийг шалгана уу. Төлбөр хийгдэх хүртэл захиалга хүчинтэй байх хугацаа 24 цаг.</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-neutral-100 border border-neutral-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-4 border-b border-neutral-200/80 bg-neutral-100">
                  <CardTitle className="text-xl font-medium text-neutral-900">Захиалгын дэлгэрэнгүй</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                    {cart.map((item: CartItem) => (
                      <div key={`${item.product.id}-${item.size}`} className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-neutral-200 flex-shrink-0 shadow-sm">
                            {item.product.mainPictureUrl ? (
                              <Image src={item.product.mainPictureUrl} alt={item.product.name} fill className="object-cover" sizes="64px" />
                            ) : (
                              <ShoppingBag className="h-8 w-8 text-neutral-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900 line-clamp-2">{item.product.name}</p>
                            <p className="text-xs text-neutral-600">Хэмжээ: {item.size} × {item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-neutral-900 pl-2 flex-shrink-0">
                          {(item.price * item.quantity).toLocaleString()}₮
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 text-sm mb-6">
                    <div className="flex justify-between text-neutral-700">
                      <span>Барааны дүн:</span>
                      <span className="font-medium text-neutral-900">{subtotal.toLocaleString()}₮</span>
                    </div>
                    <div className="flex justify-between text-neutral-700">
                      <span>Хүргэлтийн төлбөр:</span>
                      <span className="font-medium text-neutral-900">{deliveryFee.toLocaleString()}₮</span>
                    </div>
                    <div className="flex justify-between text-neutral-700">
                      <span>Үйлчилгээний шимтгэл (15%):</span>
                      <span className="font-medium text-neutral-900">{commissionFee.toLocaleString()}₮</span>
                    </div>
                  </div>
                  <Separator className="bg-neutral-200 mb-6" />
                  <div className="flex justify-between text-lg font-semibold mb-6 text-neutral-900">
                    <span>Нийт төлөх дүн:</span>
                    <span>{grandTotal.toLocaleString()}₮</span>
                  </div>
                  <div className="text-xs text-neutral-600 space-y-2">
                    <p>Захиалгын дугаар: <span className="font-mono text-neutral-800">{orderNumber}</span></p>
                    <p>Огноо: <span className="text-neutral-800">{currentDateTime}</span></p>
                  </div>
                </CardContent>
                <CardFooter className="bg-neutral-200/30 border-t border-neutral-200/90 pt-4">
                  {step === 1 ? (
                    <Button type="button" onClick={handleContinueToPayment} className="w-full py-6 text-base font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-full">
                      Төлбөр рүү үргэлжлүүлэх
                    </Button>
                  ) : (
                    <Button type="submit" disabled={!paymentMethod || isSubmitting} className="w-full py-6 text-base font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Баталгаажуулж байна...
                        </span>
                      ) : (
                        'Захиалга баталгаажуулах'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}