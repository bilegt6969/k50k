'use client' // Needed for state (unit selection, tabs)

  import React, { useState } from 'react'
  import Link from 'next/link'
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
  import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Ruler, Home, Shirt, Footprints, Sparkles, AlertTriangle } from 'lucide-react' // Icons

  // --- Sizing Data (Example - Replace/Expand with your general data in CM) ---
  const apparelSizesCm = {
    tops: [
      { size: 'XS', chest: 88, length: 66 },
      { size: 'S', chest: 94, length: 69 },
      { size: 'M', chest: 100, length: 72 },
      { size: 'L', chest: 106, length: 74 },
      { size: 'XL', chest: 112, length: 76 },
      { size: 'XXL', chest: 118, length: 78 },
    ],
    outerwear: [ // Example: Might have different measurements like sleeve
      { size: 'S', chest: 104, length: 70, sleeve: 65 },
      { size: 'M', chest: 110, length: 72, sleeve: 66 },
      { size: 'L', chest: 116, length: 74, sleeve: 67 },
      { size: 'XL', chest: 122, length: 76, sleeve: 68 },
      { size: 'XXL', chest: 128, length: 78, sleeve: 69 },
    ],
    bottoms: [ // Example: Waist, Hip, Inseam
      { size: 'S (W28-30)', waist: 76, hip: 96, inseam: 78 },
      { size: 'M (W31-33)', waist: 81, hip: 101, inseam: 80 },
      { size: 'L (W34-36)', waist: 86, hip: 106, inseam: 81 },
      { size: 'XL (W37-39)', waist: 91, hip: 111, inseam: 82 },
      { size: 'XXL (W40+)', waist: 96, hip: 116, inseam: 83 },
    ]
  };

  const shoeSizes = [
    // Data combines common conversions. CM/JP often match.
    // Add more rows as needed. Source reliable conversion charts.
    { cm: 23.5, us_w: 6.5, us_m: 5, uk: 4, eu: 37 },
    { cm: 24, us_w: 7, us_m: 5.5, uk: 4.5, eu: 38 },
    { cm: 24.5, us_w: 7.5, us_m: 6, uk: 5, eu: 38.5 },
    { cm: 25, us_w: 8, us_m: 6.5, uk: 5.5, eu: 39 },
    { cm: 25.5, us_w: 8.5, us_m: 7, uk: 6, eu: 40 },
    { cm: 26, us_w: 9, us_m: 7.5, uk: 6.5, eu: 40.5 },
    { cm: 26.5, us_w: 9.5, us_m: 8, uk: 7, eu: 41 },
    { cm: 27, us_w: 10, us_m: 8.5, uk: 7.5, eu: 42 },
    { cm: 27.5, us_w: 10.5, us_m: 9, uk: 8, eu: 42.5 },
    { cm: 28, us_w: 11, us_m: 9.5, uk: 8.5, eu: 43 },
    { cm: 28.5, us_w: 11.5, us_m: 10, uk: 9, eu: 44 },
    { cm: 29, us_w: 12, us_m: 10.5, uk: 9.5, eu: 44.5 },
    { cm: 29.5, us_w: null, us_m: 11, uk: 10, eu: 45 }, // Example where W size might not be standard
    { cm: 30, us_w: null, us_m: 11.5, uk: 10.5, eu: 45.5 },
  ];

  const hatSizesCm = [
      { size: 'S/M', circumference: 55-57 },
      { size: 'L/XL', circumference: 58-60 },
      // Add more specific sizes if needed (e.g., numeric fitted sizes)
  ];
  // --- End Sizing Data ---


  // --- Helper Function for Unit Conversion ---
  const CM_TO_INCH = 0.393701;

  function displayMeasurement(cmValue: number | null | undefined, unit: 'cm' | 'in'): string {
      if (cmValue == null) return '-'; // Handle null/undefined values
      if (unit === 'in') {
          return (cmValue * CM_TO_INCH).toFixed(1);
      }
      return Math.round(cmValue).toString();
  }
  // --- End Helper Function ---


  export default function ComprehensiveSizeChartPage() {
    const [apparelUnit, setApparelUnit] = useState<'cm' | 'in'>('cm');

    return (
      <div className="min-h-screen bg-black text-neutral-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-10"> {/* Wider container */}

          {/* Page Header */}
          <div className="text-center">
             <Ruler className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-100 mb-3">
              Ерөнхий Хэмжээний Заавар
            </h1>
             {/* IMPORTANT DISCLAIMER */}
             <Card className="max-w-3xl mx-auto bg-yellow-900/30 border-yellow-700/50 text-yellow-200 p-4 mt-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5"/>
                    <div>
                        <p className="font-semibold mb-1">Анхаарна уу:</p>
                        <p className="text-sm">
                           Энэхүү хүснэгтүүд нь <span className="font-medium">ерөнхий зааварчилгаа</span> болно. Брэнд, загвар, материал, оёдол зэргээс шалтгаалан бодит хэмжээ ялгаатай байж болно.
                           Хамгийн зөв мэдээллийг тухайн <span className="font-medium">бүтээгдэхүүний дэлгэрэнгүй тайлбараас</span> шалгана уу, эсвэл эргэлзээтэй бол бидэнтэй холбогдоно уу.
                        </p>
                    </div>
                </div>
             </Card>
          </div>

          {/* --- Main Content Tabs --- */}
          <Tabs defaultValue="apparel" className="w-full">
            {/* Tab Triggers */}
            <TabsList className="grid w-full grid-cols-3 bg-neutral-900 border border-neutral-800 h-12 p-1 mb-8">
              <TabsTrigger value="apparel" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-400 text-sm font-medium h-full flex items-center justify-center gap-2">
                 <Shirt className="h-4 w-4"/> Хувцас (Apparel)
              </TabsTrigger>
              <TabsTrigger value="footwear" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-400 text-sm font-medium h-full flex items-center justify-center gap-2">
                 <Footprints className="h-4 w-4"/> Гутал (Footwear)
              </TabsTrigger>
              <TabsTrigger value="accessories" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-400 text-sm font-medium h-full flex items-center justify-center gap-2">
                 <Sparkles className="h-4 w-4"/> Аксесуар (Accessories)
              </TabsTrigger>
            </TabsList>

            {/* === Apparel Tab === */}
            <TabsContent value="apparel" className="space-y-8">
                {/* Unit Selection for Apparel */}
                <div className="flex justify-center">
                    <ToggleGroup
                        type="single" defaultValue="cm" value={apparelUnit}
                        onValueChange={(value: 'cm' | 'in') => { if (value) setApparelUnit(value); }}
                        aria-label="Select measurement unit for apparel"
                        className="bg-neutral-900 border border-neutral-800 rounded-lg p-1"
                    >
                        <ToggleGroupItem value="cm" aria-label="Centimeters" className="px-5 py-1.5 data-[state=on]:bg-blue-600 data-[state=on]:text-white text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 rounded-md text-sm">
                        CM
                        </ToggleGroupItem>
                        <ToggleGroupItem value="in" aria-label="Inches" className="px-5 py-1.5 data-[state=on]:bg-blue-600 data-[state=on]:text-white text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 rounded-md text-sm">
                        IN
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* How to Measure Apparel */}
                <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-neutral-100">Хувцас Хэрхэн Хэмжих Вэ?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4 text-neutral-300">
                         <p><strong className="text-neutral-100">Цээж (Chest):</strong> Цээжний хамгийн өргөн хэсгээр тойруулан хэмжинэ.</p>
                         <p><strong className="text-neutral-100">Бүсэлхий (Waist):</strong> Байгалийн бүсэлхийн шугамаар (хамгийн нарийн хэсэг) тойруулан хэмжинэ.</p>
                         <p><strong className="text-neutral-100">Ташаа (Hip):</strong> Ташааны хамгийн өргөн хэсгээр тойруулан хэмжинэ.</p>
                         <p><strong className="text-neutral-100">Урт (Length):</strong> Хувцасны мөрний оёдлын дээд цэгээс доод ирмэг хүртэл.</p>
                         <p><strong className="text-neutral-100">Ханцуй (Sleeve):</strong> Мөрний оёдлоос ханцуйны ирмэг хүртэл.</p>
                         <p><strong className="text-neutral-100">Дотор урт (Inseam):</strong> Өмдний дотор талын ца паас доод ирмэг хүртэл.</p>
                         <p className="text-xs text-neutral-500 pt-2">*Өөрт таардаг хувцсаа хэмжиж харьцуулах нь илүү найдвартай байж болно.*</p>
                    </CardContent>
                </Card>

                {/* Apparel Size Tables */}
                <div className="space-y-10">
                    {/* --- Tops --- */}
                    <section>
                         <h4 className="text-xl font-semibold text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Дээгүүр Хувцас (Tops)</h4>
                         <ApparelTable data={apparelSizesCm.tops} unit={apparelUnit} columns={['size', 'chest', 'length']} />
                    </section>
                     {/* --- Outerwear --- */}
                    <section>
                         <h4 className="text-xl font-semibold text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Гадуур Хувцас (Outerwear)</h4>
                         <ApparelTable data={apparelSizesCm.outerwear} unit={apparelUnit} columns={['size', 'chest', 'length', 'sleeve']} />
                    </section>
                     {/* --- Bottoms --- */}
                     <section>
                         <h4 className="text-xl font-semibold text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Доогуур Хувцас (Bottoms)</h4>
                         <ApparelTable data={apparelSizesCm.bottoms} unit={apparelUnit} columns={['size', 'waist', 'hip', 'inseam']} />
                    </section>
                </div>
            </TabsContent>

            {/* === Footwear Tab === */}
            <TabsContent value="footwear" className="space-y-8">
                {/* How to Measure Foot */}
                 <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-neutral-100">Хөлөө Хэрхэн Хэмжих Вэ?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-4 text-neutral-300">
                        <p>1. Цаасыг шалан дээр, хананд тулган байрлуул.</p>
                        <p>2. Хөлөө цаасан дээр гишгэж, өсгийгөө хананд тулгана.</p>
                        <p>3. Хөлийн хамгийн урт хурууны үзүүрийг цаасан дээр тэмдэглэ.</p>
                        <p>4. Өсгийнөөс тэмдэглэсэн цэг хүртэлх зайг <strong className="text-neutral-100">сантиметрээр (CM)</strong> хэмж.</p>
                        <p>5. Хоёр хөлөө хэмжиж, урт хэмжээг нь ашиглана уу.</p>
                        <p>6. Гарсан хэмжээгээ доорх хүснэгтийн CM/JP баганатай харьцуулж, өөрийн US, UK, EU хэмжээг олоорой.</p>
                         <p className="text-xs text-neutral-500 pt-2">*Гуталны дотор зай, оймс зэргийг бодолцож, бага зэрэг том хэмжээ сонгох нь эвтэйхэн байж болно.*</p>
                    </CardContent>
                </Card>

                 {/* Shoe Size Conversion Table */}
                 <section>
                     <h4 className="text-xl font-semibold text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Гуталны Хэмжээний Харьцуулалт</h4>
                     <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900">
                        <table className="w-full min-w-[700px] text-sm text-left">
                             <thead className="bg-neutral-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">CM / JP</th>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">US Women</th>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">US Men</th>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">UK</th>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">EU</th>
                                </tr>
                             </thead>
                              <tbody className="divide-y divide-neutral-800">
                                {shoeSizes.map((row) => (
                                <tr key={`shoe-${row.cm}`}>
                                    <td className="px-4 py-3 font-medium text-neutral-100">{row.cm}</td>
                                    <td className="px-4 py-3 text-neutral-300">{row.us_w ?? '-'}</td>
                                    <td className="px-4 py-3 text-neutral-300">{row.us_m ?? '-'}</td>
                                    <td className="px-4 py-3 text-neutral-300">{row.uk ?? '-'}</td>
                                    <td className="px-4 py-3 text-neutral-300">{row.eu ?? '-'}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                     <p className="text-xs text-neutral-500 mt-3">*Энэ бол ерөнхий хөрвүүлэлт бөгөөд брэндээс хамаарч ялгаатай байж болно.*</p>
                 </section>
            </TabsContent>

             {/* === Accessories Tab === */}
            <TabsContent value="accessories" className="space-y-8">
                 {/* How to Measure Hats */}
                 <Card className="bg-neutral-900 border-neutral-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-neutral-100">Малгай Хэрхэн Хэмжих Вэ?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 text-neutral-300">
                         <p>1. Уян хатан метр ашиглан толгойгоо тойруулан хэмжинэ.</p>
                         <p>2. Хэмжихдээ метрийг хөмсөгний дээгүүр, чихний дээгүүр байрлуулна (малгай суух хэсгээр).</p>
                         <p>3. Хэмжээгээ <strong className="text-neutral-100">сантиметрээр (CM)</strong> тэмдэглэж аваад доорх хүснэгттэй харьцуулна уу.</p>
                    </CardContent>
                </Card>

                 {/* Hat Size Table */}
                 <section>
                     <h4 className="text-xl font-semibold text-neutral-100 mb-4 border-b border-neutral-800 pb-2">Малгайны Хэмжээ</h4>
                      <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900">
                        <table className="w-full min-w-[400px] text-sm text-left">
                            <thead className="bg-neutral-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">Хэмжээ (Size)</th>
                                    <th className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider">Толгойн тойрог (CM)</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-neutral-800">
                                {hatSizesCm.map((item) => (
                                <tr key={`hat-${item.size}`}>
                                    <td className="px-4 py-3 font-medium text-neutral-100">{item.size}</td>
                                    <td className="px-4 py-3 text-neutral-300">{`${item.circumference} cm`}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                      </div>
                 </section>

                 {/* Add tables/info for other accessories like belts if needed */}

            </TabsContent>
          </Tabs>


          {/* Back to Shop Button */}
          <div className="text-center pt-8"> {/* Added top padding */}
            <Button asChild size="lg" className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Дэлгүүр лүү буцах
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }


// --- Helper Component for Apparel Tables ---
// Simplifies creating similar tables for different apparel types
 


interface ApparelSizeData {
    size: string;
    chest?: number;
    length?: number;
    sleeve?: number;
    waist?: number;
    hip?: number;
    inseam?: number;
    // Add other possible measurement properties here
}

interface ApparelTableProps {
    data: ApparelSizeData[];
    unit: 'cm' | 'in';
    columns: (keyof ApparelSizeData)[];
}

function ApparelTable({ data, unit, columns }: ApparelTableProps) {
    const columnHeaders: Record<string, string> = {
        size: 'Хэмжээ',
        chest: `Цээж (${unit})`,
        length: `Урт (${unit})`,
        sleeve: `Ханцуй (${unit})`,
        waist: `Бүсэлхий (${unit})`,
        hip: `Ташаа (${unit})`,
        inseam: `Дотор урт (${unit})`,
        // Add other potential headers here
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900">
            <table className="w-full min-w-[500px] text-sm text-left">
                <thead className="bg-neutral-800">
                    <tr>
                        {columns.map(colKey => (
                            <th key={colKey} className="px-4 py-3 font-medium text-neutral-400 uppercase tracking-wider text-xs">
                                {columnHeaders[colKey] || colKey}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                    {data.map((item, index) => (
                        <tr key={`apparel-${columns[0]}-${item[columns[0]] || index}`}>
                            {columns.map((colKey, colIndex) => (
                                <td key={colKey} className={`px-4 py-3 whitespace-nowrap ${colIndex === 0 ? 'font-medium text-neutral-100' : 'text-neutral-300'}`}>
                                    {colKey === 'size' ? item[colKey] : displayMeasurement(item[colKey], unit)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
                            }