// app/terms/page.tsx
import { Metadata } from 'next';
import TermsView from './TermsView';

// --- TYPE DEFINITIONS ---

// Represents the structure of a terms section
interface TermsSection {
    id: string;
    title: string;
    content: string;
    subsections?: TermsSubsection[];
}

// Represents a subsection within a terms section
interface TermsSubsection {
    id: string;
    title: string;
    content: string;
    items?: string[];
}

// Represents contact information
interface ContactInfo {
    phone: string;
    email: string;
    facebook: string;
    instagram: string;
    address: string;
}

// Represents the complete terms data structure
interface TermsData {
    lastUpdated: string;
    // Added 'published' property as per the error message
    published: string;
    version: string;
    sections: TermsSection[];
    contactInfo: ContactInfo;
}

// --- DATA FETCHING HELPER (Runs on the server) ---
async function getTermsData(): Promise<TermsData | null> {
    try {
        // In a real app, this might fetch from a CMS, database, or API
        // For now, we'll return static data that matches your terms structure
        const termsData: TermsData = {
            lastUpdated: "June 18, 2025",
            published: "June 1, 2025", // Added a default value for 'published'
            version: "1.0",
            contactInfo: {
                phone: "90195589",
                email: "bilegt6969@gmail.com",
                facebook: "https://www.facebook.com/profile.php?id=61573613619465",
                instagram: "https://www.instagram.com/sainto.ub/",
                address: "Ulaanbaatar, Mongolia"
            },
            sections: [
                {
                    id: "basics",
                    title: "The basics",
                    content: "These fundamental terms explain what you need to know about using our service.",
                    subsections: [
                        {
                            id: "what-are-terms",
                            title: "What's in these terms?",
                            content: "These terms tell you the rules for using our website www.sainto.mn (our site)."
                        },
                        {
                            id: "who-we-are",
                            title: "Who we are and how to contact us?",
                            content: "Our site is operated by Sainto (we or us). We are a company based in Ulaanbaatar, Mongolia. To contact us, please use the contact information provided below."
                        }
                    ]
                },
                {
                    id: "website-use",
                    title: "Use of the website",
                    content: "Guidelines for proper and acceptable use of our platform.",
                    subsections: [
                        {
                            id: "acceptable-use",
                            title: "Acceptable use",
                            content: "You may use our site only for lawful purposes. You may not use our site:",
                            items: [
                                "In any way that breaches any applicable local, national or international law or regulation",
                                "To transmit, or procure the sending of, any unsolicited or unauthorized advertising or promotional material",
                                "To knowingly transmit any data or material that contains viruses or other harmful components"
                            ]
                        },
                        {
                            id: "interactive-services",
                            title: "Interactive services",
                            content: "We may from time to time provide interactive services on our site, including chat rooms, bulletin boards, and user reviews. We will provide clear information to you about the kind of service offered and whether it is moderated."
                        }
                    ]
                },
                {
                    id: "orders-payments",
                    title: "Orders and payments",
                    content: "Terms related to purchasing and payment processing.",
                    subsections: [
                        {
                            id: "order-process",
                            title: "Order process",
                            content: "When you place an order through our website, the following process applies:",
                            items: [
                                "Order confirmation via email and SMS",
                                "Daily delivery location updates",
                                "Phone call coordination for delivery"
                            ]
                        },
                        {
                            id: "payment-methods",
                            title: "Payment methods",
                            content: "We currently accept cash on delivery. Future payment methods will include StorePay, QPay, and Stripe."
                        }
                    ]
                },
                {
                    id: "privacy-data",
                    title: "Privacy and data",
                    content: "How we handle your personal information and data security.",
                    subsections: [
                        {
                            id: "data-collection",
                            title: "Data collection",
                            content: "We collect the following information to provide our services:",
                            items: [
                                "Full name for order processing and delivery",
                                "Phone number for order confirmation and delivery coordination",
                                "Email address for order confirmation and customer service",
                                "Delivery address for product delivery",
                                "Website usage statistics via Vercel Web Analytics and Google Analytics"
                            ]
                        },
                        {
                            id: "data-security",
                            title: "Data security",
                            content: "Your information is securely stored on Firebase platform, which follows international security standards. We implement appropriate technical and organizational measures to protect against unauthorized access and use."
                        }
                    ]
                },
                {
                    id: "liability",
                    title: "Limitation of liability",
                    content: "Our legal responsibilities and limitations.",
                    subsections: [
                        {
                            id: "our-responsibility",
                            title: "Our responsibility to you",
                            content: "Nothing in these terms excludes or limits our liability for death or personal injury arising from our negligence, or our fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited by Mongolian law."
                        },
                        {
                            id: "changes-to-terms",
                            title: "Changes to terms",
                            content: "We may revise these terms at any time by amending this page. You are expected to check this page regularly to take notice of any changes we made, as they are binding on you."
                        }
                    ]
                }
            ]
        };

        return termsData;
    } catch (error) {
        console.error("An error occurred in getTermsData:", error);
        return null;
    }
}

// --- METADATA (Runs on the server) ---
export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Terms & Conditions | Sainto',
        description: 'Read our terms and conditions to understand the rules for using Sainto services.',
        openGraph: {
            title: 'Terms & Conditions | Sainto',
            description: 'Read our terms and conditions to understand the rules for using Sainto services.',
            type: 'website',
        },
        robots: {
            index: true,
            follow: true,
        }
    };
}

// --- PAGE COMPONENT (Runs on the server) ---
export default async function TermsPage() {
    const termsData = await getTermsData();

    if (!termsData) {
        // Clean error state if terms data cannot be loaded
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-10 bg-white rounded-2xl shadow-sm max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-gray-900">Terms Unavailable</h1>
                    <p className="text-gray-600">
                        Sorry, we couldn&apos;t load the terms and conditions at this time. Please try again later.
                    </p>
                </div>
            </div>
        );
    }

    // The TermsView component receives the fully typed, clean data
    return <TermsView termsData={termsData} />;
}

// Export types for use in other components
export type { TermsData, TermsSection, TermsSubsection, ContactInfo };
