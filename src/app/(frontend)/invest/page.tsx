import React, { memo } from 'react';
import Link from 'next/link';

// Utility function remains robust and clear
const replaceText = (text: string): string => {
    // Ensuring input is always treated as a string, then falling back to empty string
    return String(text || '').replace(/GOAT/gi, 'SAINT').replace(/Canada/gi, 'MONGOLIA');
};

// --- Reusable Components (Apple-inspired modularity) ---
// Each section becomes a self-contained, well-defined component

interface SectionCardProps {
    children: React.ReactNode;
    bgColor?: string;
    borderColor?: string;
    icon?: string;
    iconBgColor?: string;
    title: string;
    titleColor?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
    children,
    bgColor = 'bg-neutral-900',
    borderColor = 'border-neutral-700',
    icon,
    iconBgColor = 'bg-blue-500',
    title,
    titleColor = 'text-blue-400',
}) => (
    <section className={`${bgColor} p-8 sm:p-10 rounded-xl shadow-lg border ${borderColor} flex flex-col md:flex-row items-start gap-8`}>
        {icon && (
            <div className="flex-shrink-0">
                <div className={`${iconBgColor} w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-md transition-transform duration-300 ease-out group-hover:scale-105`}>
                    {icon}
                </div>
            </div>
        )}
        <div className="flex-grow"> {/* Allows content to take up available space */}
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 uppercase tracking-wide ${titleColor}`}>
                {title}
            </h2>
            {children}
        </div>
    </section>
);

interface MomentumItemProps {
    title: string;
    value: string;
    icon: string;
}

const MomentumItem: React.FC<MomentumItemProps> = ({ title, value, icon }) => (
    <div className="bg-neutral-800 p-6 rounded-lg border-l-4 border-yellow-400 shadow-md flex items-center space-x-4
                    hover:bg-neutral-700 transition-colors duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-xl">
        <span className="text-4xl">{icon}</span>
        <div>
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-neutral-300 text-lg">{value}</p>
        </div>
    </div>
);

interface TeamCredentialProps {
    text: string;
    icon: string;
}

const TeamCredential: React.FC<TeamCredentialProps> = ({ text, icon }) => (
    <li className="flex items-start text-lg text-neutral-300">
        <span className="text-2xl mr-3 flex-shrink-0">{icon}</span>
        <strong className="text-white">{text}</strong>
    </li>
);

interface RaiseDetailItemProps {
    title: string;
    description: string;
    icon: string;
}

const RaiseDetailItem: React.FC<RaiseDetailItemProps> = ({ title, description, icon }) => (
    <li className="bg-neutral-800 p-6 rounded-lg border-t-4 border-red-500 shadow-md
                   hover:bg-neutral-700 transition-colors duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-xl">
        <span className="block text-4xl mb-3 text-center">{icon}</span>
        <h3 className="text-xl font-bold text-white mb-2 text-center">{title}</h3>
        <p className="text-neutral-300 text-base">{description}</p>
    </li>
);

// --- Main Page Component ---
const InvestmentPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-black text-white font-inter antialiased flex flex-col items-center py-16">
            {/* Overall container for centered "cards" */}
            <div className="w-full max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">

                {/* 1. Headline: MetroCard Top Bar / Large Station Sign with subtle depth */}
                <header className="bg-yellow-400 text-black p-8 sm:p-12 rounded-xl text-center shadow-xl
                                   transform hover:scale-[1.005] transition-transform duration-500 ease-out perspective-1000"> {/* Subtle scale on hover */}
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-none tracking-tighter uppercase font-mono italic">
                        <span className="block text-xl sm:text-2xl mb-2 opacity-90">Invest in</span> {/* Slight opacity for hierarchy */}
                        Saint: Mongolia&apos;s E-commerce Future
                    </h1>
                </header>

                {/* 2. What We’re Building (Vision) - Black "Station Sign" */}
                <SectionCard
                    title="What We’re Building"
                    icon="🌍"
                    iconBgColor="bg-blue-600" // Slightly deeper blue
                    titleColor="text-blue-400"
                >
                    <p className="text-neutral-300 leading-relaxed text-lg">
                        {replaceText("Saint is Mongolia’s first next-generation e-commerce platform designed to empower local sellers and creators to connect directly with consumers. While global giants like Shopify and Amazon dominate internationally, Mongolia currently lacks a scalable, trusted, and locally optimized platform for fast, secure, and efficient online commerce. We are solving this critical gap by building a robust ecosystem tailored to the unique needs of the Mongolian market.")}
                    </p>
                </SectionCard>

                {/* 3. Why It’s Exciting (Market & Timing) - Another Black "Station Sign" */}
                <SectionCard
                    title="Why It’s Exciting"
                    icon="🔥"
                    iconBgColor="bg-purple-600" // Slightly deeper purple
                    titleColor="text-purple-400"
                >
                    <p className="text-neutral-300 leading-relaxed text-lg mb-4">
                        {replaceText("Mongolia's online shopping demand is experiencing unprecedented growth, yet a staggering ")}
                        <strong className="text-yellow-300">90% of local sellers still rely on inefficient and often unstable direct message (DM) based transactions</strong> {replaceText(" across social media. This current landscape is fragmented, lacks security, and hinders scalability for small businesses and independent creators.")}
                    </p>
                    <p className="text-neutral-300 leading-relaxed text-lg">
                        {replaceText("Our approach is fundamentally different: Saint provides a comprehensive, integrated solution. We offer local payment gateways, streamlined logistics, intuitive inventory management, and powerful analytics, all designed for social-first selling. This is more than just a platform; it's the infrastructure that will professionalize and accelerate Mongolia's digital economy.")}
                    </p>
                </SectionCard>

                {/* 4. Early Momentum - Grouped "Station Signs" / "Tickets" */}
                <section className="bg-neutral-900 p-8 sm:p-10 rounded-xl shadow-lg border border-neutral-700">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-8 uppercase tracking-wide text-green-400 text-center">
                        Early Momentum <span className="text-white">🧪</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: "Waitlist Count", value: "Rapidly Growing", icon: "👥" },
                            { title: "MVP Progress", value: "Nearing Completion", icon: "⚙️" },
                            { title: "$20,000 Grant", value: "Secured Non-Dilutive", icon: "💰" },
                            { title: "Government Engagement", value: "Backed National AI Policy", icon: "🇲🇳" },
                            { title: "Marketing Reach", value: "50% of Mongolia's Social Media Population", icon: "📣" },
                        ].map((item, index) => (
                            <MomentumItem key={index} {...item} />
                        ))}
                    </div>
                </section>

                {/* 5. Team & Founder Credibility - Individual "Ticket" for Founder */}
                <section className="bg-neutral-900 p-8 sm:p-10 rounded-xl shadow-lg border border-neutral-700">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-8 uppercase tracking-wide text-yellow-400 text-center">
                        Team & Founder Credibility <span className="text-white">👤</span>
                    </h2>
                    <div className="bg-neutral-800 p-8 rounded-lg shadow-md border-l-8 border-yellow-500
                                    hover:bg-neutral-700 transition-colors duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-xl">
                        <h3 className="text-3xl font-extrabold text-white mb-4 uppercase">Bilegt Amartuvshin</h3>
                        <p className="text-neutral-300 leading-relaxed text-lg mb-6">
                            {replaceText("Bilegt brings a unique blend of academic excellence, technical prowess, and entrepreneurial drive to Saint:")}
                        </p>
                        <ul className="list-none space-y-4">
                            {[
                                { text: "Olympiad Medalist (Physics & Math)", icon: "🏆" },
                                { text: "Ex-Erxes Front-End Developer", icon: "💻" },
                                { text: "Co-founder of Bytecode (STEM EdTech)", icon: "🚀" },
                                { text: "Founder of Saint & $20K Grant Winner", icon: "💡" },
                                { text: "Backed National AI Policy with Gov of Mongolia", icon: "🏛️" },
                            ].map((item, index) => (
                                <TeamCredential key={index} {...item} />
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 6. Raise Details - "Single Ticket" style for amount */}
                <section className="bg-neutral-900 p-8 sm:p-10 rounded-xl shadow-lg border border-neutral-700">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-8 uppercase tracking-wide text-red-400 text-center">
                        We’re Raising Pre-Seed <span className="text-white">💵</span>
                    </h2>
                    <div className="bg-red-600 text-white p-6 sm:p-8 rounded-xl shadow-lg text-center mx-auto max-w-sm flex flex-col items-center justify-center space-y-2
                                    transform hover:rotate-0 transition-transform duration-300 ease-out scale-[1.005] hover:scale-[1.01]"> {/* Removed initial rotation, added subtle scale */}
                        <span className="text-lg uppercase opacity-90">Pre-Seed Round</span>
                        <p className="text-5xl sm:text-6xl font-extrabold tracking-tight">$100,000</p>
                        <span className="text-sm italic opacity-80">To Fuel Public Launch & Initial Growth</span>
                    </div>

                    <p className="text-neutral-300 leading-relaxed text-lg mt-8 mb-6 text-center">
                        This capital will be strategically deployed to:
                    </p>
                    <ul className="list-none space-y-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Product Development", description: "Enhance core platform features, optimize user experience, and build out essential integrations.", icon: "🛠️" },
                            { title: "Marketing & User Acquisition", description: "Implement targeted campaigns to onboard our waitlist and attract a wider user base of creators and small businesses.", icon: "📈" },
                            { title: "Hiring", description: "Expand our core team with key talent in engineering, marketing, and operations to support rapid scaling.", icon: "🧑‍💻" },
                        ].map((item, index) => (
                            <RaiseDetailItem key={index} {...item} />
                        ))}
                    </ul>
                    <p className="text-neutral-300 leading-relaxed text-lg mt-8 text-center">
                        We have already <strong className="text-yellow-300">secured $20,000 in non-dilutive funding</strong>, demonstrating early investor confidence and reducing the overall risk.
                    </p>
                </section>

                {/* 7. Pitch Deck / Prototype - "Insert This Way" card */}
                <section className="bg-neutral-900 p-8 sm:p-10 rounded-xl shadow-lg border border-neutral-700">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-8 uppercase tracking-wide text-indigo-400 text-center">
                        Pitch Deck / Prototype <span className="text-white">📄</span>
                    </h2>
                    <div className="bg-indigo-700 text-white p-8 rounded-xl shadow-lg text-center max-w-lg mx-auto
                                    transform hover:scale-[1.01] transition-transform duration-300 ease-out"> {/* Removed initial rotation, added subtle scale */}
                        <p className="text-2xl font-bold mb-4 uppercase opacity-90">Explore Our Vision</p>
                        <p className="text-lg mb-6 opacity-80">See our progress firsthand.</p>
                        <div className="flex flex-col gap-4">
                            <Link href="https://saint.mn/deck" className="bg-white text-indigo-800 font-bold py-3 px-8 rounded-full shadow-lg
                                                                           hover:bg-neutral-100 transition-all duration-300 ease-in-out transform hover:scale-105 uppercase tracking-wider" target="_blank" rel="noopener noreferrer">
                                View Pitch Deck
                            </Link>
                            <span className="text-neutral-300 text-lg opacity-80">
                                Watch Our Early Demo/Product Teaser: <span className="text-neutral-400 italic">(Coming Soon)</span>
                            </span>
                        </div>
                    </div>
                </section>

                {/* 8. CTA: How to Invest or Contact - The "MetroCard" CTA */}
                <section className="bg-yellow-400 text-black p-8 sm:p-10 rounded-xl shadow-2xl border border-yellow-500 text-center my-12">
                    <h2 className="text-4xl sm:text-5xl font-extrabold mb-8 uppercase leading-tight tracking-tight">
                        Get Involved <span className="text-black">📩</span>
                    </h2>
                    <p className="text-xl sm:text-2xl mb-10 font-semibold max-w-2xl mx-auto opacity-90">
                        Invest in Mongolia&aposs Digital Revolution
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-6">
                        <a href="mailto:invest@saint.mn" className="bg-black text-white font-bold py-4 px-10 rounded-full shadow-lg
                                                                           hover:bg-neutral-800 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg uppercase tracking-wide">
                            💬 Email Us
                        </a>
                        <Link href="https://saint.mn/deck" className="bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-lg
                                                                           hover:bg-blue-800 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg uppercase tracking-wide" target="_blank" rel="noopener noreferrer">
                            📄 View Pitch Deck
                        </Link>
                        <a href="#" className="bg-purple-700 text-white font-bold py-4 px-10 rounded-full shadow-lg
                                                                           hover:bg-purple-800 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg uppercase tracking-wide">
                            🤝 Schedule a Call
                        </a>
                        <a href="#" className="bg-neutral-700 text-white font-bold py-4 px-10 rounded-full shadow-lg
                                                                           hover:bg-neutral-600 transition-all duration-300 ease-in-out transform hover:scale-105 text-lg uppercase tracking-wide">
                            💵 Pre-register Interest
                        </a>
                    </div>
                </section>

            </div>
            {/* Using Next.js font optimization would be ideal in a real project, but keeping your style for demonstration */}
            <style  >{`
                body {
                    background-color: black;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }
                /* For production, consider using @next/font for optimal loading */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@700&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }
                .font-mono {
                    font-family: 'Roboto Mono', monospace;
                }
            `}</style>
        </div>
    );
};

export default memo(InvestmentPage);