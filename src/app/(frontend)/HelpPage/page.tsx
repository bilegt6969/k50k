'use client' // Needed for Accordion interaction

  import Link from 'next/link'
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
  import { Button } from '@/components/ui/button'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Separator } from '@/components/ui/separator'
  import { HelpCircle, Mail, Phone, ArrowUpRight, Home, Truck, RotateCcw, CreditCard } from 'lucide-react'

  // Placeholder FAQ data - replace with your actual FAQs
  const faqs = [
    {
      id: 'faq-1',
      icon: Truck,
      question: 'Хүргэлт хэрхэн хийгддэг вэ?',
      answer: 'Бид Улаанбаатар хот дотор MGL Express хүргэлтийн үйлчилгээгээр дамжуулан захиалгыг хүргэдэг. Хүргэлтийн хугацаа захиалга баталгаажсанаас хойш ажлын 1-2 өдөр байна. Дэлгэрэнгүй мэдээллийг Хүргэлтийн бодлого хуудаснаас харна уу.',
    },
    {
      id: 'faq-2',
      icon: RotateCcw,
      question: 'Барааг буцаах эсвэл солих боломжтой юу?',
      answer: 'Тийм ээ, та барааг хүлээн авснаас хойш 7 хоногийн дотор буцаах эсвэл солиулах боломжтой. Бараа нь эвдрэлгүй, шошготойгоо байх шаардлагатай. Буцаалт, солилтын нөхцөлийн талаар манай Буцаалтын бодлого хуудаснаас уншина уу.',
    },
    {
        id: 'faq-3',
        icon: CreditCard,
        question: 'Төлбөрийг хэрхэн хийх вэ?',
        answer: 'Та захиалгаа баталгаажуулсны дараа манай банкны данс руу шилжүүлэг хийх боломжтой. Шилжүүлэг хийхдээ гүйлгээний утга хэсэгт захиалгын кодыг заавал бичнэ үү. Бид одоогоор Хаан Банк, Голомт Банк, Худалдаа Хөгжлийн Банкны дансаар төлбөр хүлээн авч байна.',
    },
    {
      id: 'faq-4',
      icon: HelpCircle,
      question: 'Захиалгын статусыг хэрхэн шалгах вэ?',
      answer: 'Захиалгын статусыг шалгах боломж одоогоор вэбсайтаар байхгүй байна. Та манай тусламжийн багтай имэйл эсвэл утсаар холбогдож захиалгынхаа талаар лавлана уу.',
    },
  ]

  export default function HelpPage() {
    return (
      <div className="min-h-screen bg-black text-neutral-100 py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto"> {/* Adjusted max-width for content */}

          {/* Page Header */}
          <div className="mb-10 text-center">
             <HelpCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-100 mb-2">
              Тусламж, Дэмжлэг
            </h1>
            <p className="text-neutral-400 text-lg">
              Түгээмэл асуултууд болон холбоо барих мэдээлэл.
            </p>
          </div>

           {/* Optional: Search Bar - uncomment if needed
           <div className="mb-10 relative">
             <Input
               type="search"
               placeholder="Асуултаа эндээс хайна уу..."
               className="pl-10 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 h-11"
               aria-label="Search help articles"
             />
             <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
           </div>
           */}


          {/* --- Frequently Asked Questions --- */}
          <Card className="mb-10 bg-neutral-900 border-neutral-800">
             <CardHeader>
                <CardTitle className="text-xl font-medium text-neutral-100">Түгээмэл Асуултууд</CardTitle>
             </CardHeader>
             <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b-neutral-800">
                        <AccordionTrigger className="text-left hover:no-underline py-4 text-base text-neutral-200 hover:text-blue-400">
                           <span className="flex items-center gap-3">
                               <faq.icon className="h-5 w-5 text-neutral-500 flex-shrink-0" />
                               {faq.question}
                           </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-4 text-neutral-400 text-sm leading-relaxed">
                           {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
             </CardContent>
          </Card>


          {/* --- Contact Information --- */}
          <Card className="mb-10 bg-neutral-900 border-neutral-800">
             <CardHeader>
                <CardTitle className="text-xl font-medium text-neutral-100">Холбоо Барих</CardTitle>
                <CardDescription className="text-neutral-400">Асуух зүйл байвал бидэнтэй холбогдоорой.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-neutral-500 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-neutral-400">Имэйл хаяг:</p>
                        <a href="mailto:support@zuufu.mn" className="text-blue-400 hover:text-blue-300 hover:underline">
                           support@zuufu.mn
                        </a>
                    </div>
                </div>
                <Separator className="bg-neutral-800"/>
                 <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-neutral-500 flex-shrink-0" />
                     <div>
                        <p className="text-sm text-neutral-400">Утас:</p>
                        <a href="tel:+97677XXAAAA" className="text-blue-400 hover:text-blue-300 hover:underline">
                           +976 77XX-AAAA {/* Replace with actual phone */}
                        </a>
                    </div>
                </div>
                 {/* Add other contact methods if needed (e.g., social media, address) */}
             </CardContent>
          </Card>

           {/* --- Policy Links --- */}
          <Card className="mb-10 bg-neutral-900 border-neutral-800">
             <CardHeader>
                <CardTitle className="text-xl font-medium text-neutral-100">Бодлого, Нөхцөл</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                 {/* Replace '#' with actual links */}
                 <PolicyLink href="/privacy-policy" text="Нууцлалын бодлого" />
                 <Separator className="bg-neutral-800"/>
                 <PolicyLink href="/terms-of-service" text="Үйлчилгээний нөхцөл" />
                 <Separator className="bg-neutral-800"/>
                 <PolicyLink href="/shipping-policy" text="Хүргэлтийн бодлого" />
                 <Separator className="bg-neutral-800"/>
                 <PolicyLink href="/return-policy" text="Буцаалтын бодлого" />
             </CardContent>
          </Card>


          {/* Back to Shop Button */}
          <div className="text-center mt-12">
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


// Helper component for consistent policy link styling
function PolicyLink({ href, text }: { href: string; text: string }) {
    return (
        <Link href={href} className="flex justify-between items-center group py-2">
            <span className="text-neutral-200 group-hover:text-blue-400">{text}</span>
            <ArrowUpRight className="h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Link>
    );
}