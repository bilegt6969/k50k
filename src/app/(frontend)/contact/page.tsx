'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fieldBase =
  'w-full rounded-xl border bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20';

const glassPanel =
  'bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl';

export default function ContactPage() {
  const [formStatus, setFormStatus] = useState('');
  const [formData, setFormData] = useState({
    companySize: '',
    companyName: '',
    firstName: '',
    lastName: '',
    workEmail: '',
    phoneNumber: '',
    productInterest: '',
    businessNeeds: '',
  });
  const [showSubmitAgain, setShowSubmitAgain] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  type FormDataKeys = keyof typeof formData;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
    if (formStatus && !showSubmitAgain) {
      setFormStatus('');
    }
  };

  const resetForm = () => {
    setFormData({
      companySize: '',
      companyName: '',
      firstName: '',
      lastName: '',
      workEmail: '',
      phoneNumber: '',
      productInterest: '',
      businessNeeds: '',
    });
    setFormStatus('');
    setShowSubmitAgain(false);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    const requiredFields: FormDataKeys[] = [
      'companySize',
      'companyName',
      'firstName',
      'lastName',
      'workEmail',
      'phoneNumber',
      'productInterest',
    ];

    requiredFields.forEach((field) => {
      if (!formData[field] || String(formData[field]).trim() === '') {
        newErrors[field] = 'Энэ талбарыг бөглөнө үү.';
      }
    });

    if (formData.workEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = 'Бодит имэйл хаяг оруулна уу.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormStatus('Шаардлагатай бүх талбарыг бөглөнө үү эсвэл алдааг засна уу.');
      setShowSubmitAgain(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        setFormStatus('Баярлалаа! Манай борлуулалтын баг тантай удахгүй холбогдох болно.');
        setShowSubmitAgain(true);
        setErrors({});
      } else {
        setFormStatus('Хүсэлт илгээхэд алдаа гарлаа. Дахин оролдоно уу.');
        setShowSubmitAgain(false);
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setFormStatus('Сүлжээний алдаа гарлаа. Дахин оролдоно уу.');
      setShowSubmitAgain(false);
    }
  };

  const inputError = (name: string) => (errors[name] ? 'border-red-400/70' : 'border-white/10');

  const selectChevron = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a3a3a3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`;

  return (
    <div className="relative min-h-screen bg-[#0B0B0B] font-sans antialiased">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-48 bg-gradient-to-t from-black via-[#141414]/80 to-transparent"
        aria-hidden
      />

      <div className="page-container relative z-10">
        <div className="container mx-auto max-w-6xl px-4 pb-16 pt-2 md:pb-24 md:pt-4">
          <nav className="mb-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-white/70">
            <Link href="/" className="transition-colors hover:text-white hover:underline">
              Home
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-white/50">Contact</span>
          </nav>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className={`${glassPanel} overflow-hidden`}
          >
            <div className="grid gap-0 lg:grid-cols-12">
              <aside className="border-b border-white/10 bg-white/[0.03] p-6 sm:p-8 md:p-10 lg:col-span-5 lg:border-b-0 lg:border-r lg:border-white/10">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                  Sainto
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm md:text-4xl">
                  Борлуулалтын багтай холбогдох
                </h1>
                <p className="mt-4 text-sm leading-relaxed text-white/65 md:text-base">
                  Хамтран ажиллах шинэ санаа байна уу? Тэгвэл Sainto-той хамт эхэлье.
                </p>
                <div className="mt-8 space-y-4 border-t border-white/10 pt-8">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                    Шууд холбогдох
                  </p>
                  <a
                    href="mailto:support@sainto.mn"
                    className="block text-sm text-white/80 transition-colors hover:text-white"
                  >
                    support@sainto.mn
                  </a>
                  <Link
                    href="/support"
                    className="inline-flex text-sm font-medium text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white"
                  >
                    Дэмжлэгийн хуудас
                  </Link>
                </div>
              </aside>

              <div className="p-6 sm:p-8 md:p-10 lg:col-span-7">
                {!showSubmitAgain ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="companySize"
                        className="mb-2 block text-xs font-medium text-white/70"
                      >
                        Компанийн хэмжээ <span className="text-white">*</span>
                      </label>
                      <select
                        id="companySize"
                        name="companySize"
                        value={formData.companySize}
                        onChange={handleInputChange}
                        className={`${fieldBase} ${inputError('companySize')} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
                        style={{ backgroundImage: selectChevron }}
                      >
                        <option value="" disabled className="bg-neutral-900 text-neutral-500">
                          Сонгоно уу
                        </option>
                        <option value="1-10 ажилтантай" className="bg-neutral-900">
                          1-10 ажилтантай
                        </option>
                        <option value="11-50 ажилтантай" className="bg-neutral-900">
                          11-50 ажилтантай
                        </option>
                        <option value="51-200 ажилтантай" className="bg-neutral-900">
                          51-200 ажилтантай
                        </option>
                        <option value="201-500 ажилтантай" className="bg-neutral-900">
                          201-500 ажилтантай
                        </option>
                        <option value="500+ ажилтантай" className="bg-neutral-900">
                          500+ ажилтантай
                        </option>
                      </select>
                      {errors.companySize && (
                        <p className="mt-1 text-xs text-red-400">{errors.companySize}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="companyName"
                        className="mb-2 block text-xs font-medium text-white/70"
                      >
                        Компанийн нэр <span className="text-white">*</span>
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={`${fieldBase} ${inputError('companyName')}`}
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-2 block text-xs font-medium text-white/70"
                        >
                          Нэр <span className="text-white">*</span>
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`${fieldBase} ${inputError('firstName')}`}
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-2 block text-xs font-medium text-white/70"
                        >
                          Овог <span className="text-white">*</span>
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`${fieldBase} ${inputError('lastName')}`}
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="workEmail"
                          className="mb-2 block text-xs font-medium text-white/70"
                        >
                          Ажлын имэйл <span className="text-white">*</span>
                        </label>
                        <input
                          type="email"
                          id="workEmail"
                          name="workEmail"
                          value={formData.workEmail}
                          onChange={handleInputChange}
                          className={`${fieldBase} ${inputError('workEmail')}`}
                        />
                        {errors.workEmail && (
                          <p className="mt-1 text-xs text-red-400">{errors.workEmail}</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="mb-2 block text-xs font-medium text-white/70"
                        >
                          Утасны дугаар <span className="text-white">*</span>
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          className={`${fieldBase} ${inputError('phoneNumber')}`}
                        />
                        {errors.phoneNumber && (
                          <p className="mt-1 text-xs text-red-400">{errors.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="productInterest"
                        className="mb-2 block text-xs font-medium text-white/70"
                      >
                        Та манай ямар бүтээгдэхүүн, үйлчилгээг сонирхож байна вэ?{' '}
                        <span className="text-white">*</span>
                      </label>
                      <select
                        id="productInterest"
                        name="productInterest"
                        value={formData.productInterest}
                        onChange={handleInputChange}
                        className={`${fieldBase} ${inputError('productInterest')} appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10`}
                        style={{ backgroundImage: selectChevron }}
                      >
                        <option value="" disabled className="bg-neutral-900 text-neutral-500">
                          Доорх сонголтуудаас нэгийг сонгоно уу
                        </option>
                        <option value="Түншлэлийн лавлагаа" className="bg-neutral-900">
                          Түншлэлийн лавлагаа
                        </option>
                        <option value="Худалдагчийн бүртгэлийн дэмжлэг" className="bg-neutral-900">
                          Худалдагчийн бүртгэлийн дэмжлэг
                        </option>
                        <option value="Бөөнөөр худалдан авах" className="bg-neutral-900">
                          Бөөнөөр худалдан авах
                        </option>
                        <option value="API холболт" className="bg-neutral-900">
                          API холболт
                        </option>
                        <option value="Бусад" className="bg-neutral-900">
                          Бусад
                        </option>
                      </select>
                      {errors.productInterest && (
                        <p className="mt-1 text-xs text-red-400">{errors.productInterest}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="businessNeeds"
                        className="mb-2 block text-xs font-medium text-white/70"
                      >
                        Та бизнесийн хэрэгцээ, тулгамдаж буй асуудлынхаа талаар хуваалцана уу?
                      </label>
                      <textarea
                        id="businessNeeds"
                        name="businessNeeds"
                        value={formData.businessNeeds}
                        onChange={handleInputChange}
                        rows={5}
                        className={`${fieldBase} resize-none border-white/10`}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black shadow-lg transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40 md:w-auto"
                      >
                        Илгээх
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-lg leading-relaxed text-white/75">{formStatus}</p>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="mt-8 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    >
                      Дахин илгээх
                    </button>
                  </div>
                )}

                {formStatus && !showSubmitAgain && (
                  <div
                    className={`mt-6 rounded-xl border p-4 ${
                      formStatus.includes('Баярлалаа')
                        ? 'border-emerald-500/35 bg-  -500/10'
                        : 'border-red-500/35 bg-red-500/10'
                    }`}
                  >
                    <p
                      className={`text-center text-sm ${
                        formStatus.includes('Баярлалаа') ? 'text-emerald-300' : 'text-red-300'
                      }`}
                    >
                      {formStatus}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
