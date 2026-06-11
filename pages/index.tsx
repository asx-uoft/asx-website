import { GetStaticProps } from "next";
import HeroBanner from "@/components/herobanner";
import Mission from "@/components/mission";
import Latest from "@/components/latest";
import Events from "@/components/events";
import AboutUs from "@/components/aboutus";
import Speakers from "@/components/speakers";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { getIndex, readHome, type Article, type HomeData } from "@/utils/storage";
import Link from "next/link";

interface HomeProps {
    news: Article[];
    homeData: HomeData;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
    const [newsData, homeData] = await Promise.all([
        getIndex(3).catch(() => ({ items: [] as Article[] })),
        readHome(),
    ]);
    return { props: { news: newsData.items, homeData }, revalidate: 30 };
};

export default function Home({ news, homeData }: HomeProps) {
    return (
        <div className='max-w-7xl mx-auto'>
            <Navbar />
            <div className='container flex flex-col items-center justify-center min-h-screen px-4 pb-8 mx-auto gap-5 sm:gap-10 md:gap-15'>
                <HeroBanner imageUrl={homeData.bannerImageUrl} caption={homeData.bannerCaption} imageCreditTitle={homeData.imageCreditTitle} imageCreditLine={homeData.imageCreditLine} />
                <Mission quote={homeData.quote} />
                <Latest news={news} />
                <Events cards={homeData.eventCards} />
                <AboutUs />
                <div className="flex justify-center">
                    <Link
                        href="/membership"
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/80 text-background text-lg md:text-xl rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                    >
                        <span>Become a Member</span>
                        <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
                <Speakers />
            </div>
            <Footer />
        </div>
    );
}
