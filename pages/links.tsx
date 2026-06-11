import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Image from "next/image";
import albireo from '../assets/albireo.jpg';
import emailSvg from '../assets/email.svg';
import { Badge } from "@/components/ui/badge";
import { GetStaticProps } from "next";
import { readLinks, LinksData } from "@/utils/storage";
import { SOCIAL_SVG_MAP } from "@/utils/socialIcons";

interface LinksProps { data: LinksData; }

export const getStaticProps: GetStaticProps<LinksProps> = async () => {
    const data = await readLinks();
    return { props: { data }, revalidate: 30 };
};

export default function Links({ data }: LinksProps) {
    const { email, socials, resourceSections } = data;

    return (
        <div className='max-w-7xl mx-auto'>
            <Navbar />
            <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
                <div className="relative w-full h-36 md:h-54 sm:rounded-xl overflow-hidden max-w-4xl">
                    <Image src={albireo} alt="Albireo" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">ASX Links</h1>
                    </div>
                </div>

                <div className='w-full max-w-4xl flex-col sm:flex-row flex-grow flex gap-5 px-4 sm:gap-10 md:gap-15 justify-center'>
                    {/* Left column */}
                    <div className='flex flex-col h-full w-full items-center self-start justify-start'>
                        <a href="/membership" className='bg-primary p-3 rounded-lg text-lg text-background text-center md:text-xl'>
                            Become a Member / Subscribe to our Newsletter!
                        </a>

                        {/* Email */}
                        <div className='flex flex-col gap-5 w-full items-center pt-10'>
                            <div className='absolute -translate-y-1/2 z-10 px-4 bg-background'>
                                <div className='text-xl md:text-2xl'>Contact Us</div>
                            </div>
                            <div className='flex gap-3 border rounded-lg border-gray-700 text-lg md:text-xl p-6 sm:p-8 pt-10 items-center w-full'>
                                <Image src={emailSvg} alt="Email" className="object-cover w-8 h-8 icon-theme" width={30} height={30} />
                                <a href={`mailto:${email}`} className="text-secondary block w-full break-words break-all whitespace-normal">
                                    {email}
                                </a>
                            </div>
                        </div>

                        {/* Socials */}
                        <div className='flex flex-col gap-5 w-full items-center pt-10'>
                            <div className='absolute -translate-y-1/2 z-10 px-4 bg-background'>
                                <div className='text-xl md:text-2xl'>Socials</div>
                            </div>
                            <div className='flex flex-col gap-5 border rounded-lg border-gray-700 text-base md:text-lg p-6 sm:p-8 pt-10 items-center w-full'>
                                {socials.map(social => (
                                    <div key={social.id} className='flex gap-3 w-full items-center'>
                                        {SOCIAL_SVG_MAP[social.icon] && (
                                            <Image
                                                src={SOCIAL_SVG_MAP[social.icon]!}
                                                alt={social.name}
                                                className="object-cover w-8 h-8 icon-theme"
                                                width={30}
                                                height={30}
                                            />
                                        )}
                                        <a href={social.url} target="_blank" rel="noopener noreferrer" className='text-secondary'>
                                            {social.name}
                                        </a>
                                        {social.isNew && (
                                            <Badge variant="default" className='text-sm bg-foreground text-background'>New!</Badge>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column — Organizations / Resources */}
                    <div className='flex flex-col h-full w-full items-center self-start justify-start'>
                        <div className='flex flex-col gap-5 w-full items-center pt-10'>
                            <div className='absolute -translate-y-1/2 z-10 px-4 bg-background'>
                                <div className='text-xl md:text-2xl'>Organizations / Resources</div>
                            </div>
                            <div className='flex flex-col gap-5 border rounded-lg border-gray-700 text-base md:text-lg p-6 sm:p-8 pt-10 items-left w-full'>
                                {resourceSections.map(section => (
                                    <div key={section.id}>
                                        <div className='text-lg font-semibold md:text-xl mb-2'>{section.header}</div>
                                        {section.links.map(link => (
                                            <div key={link.id} className="mb-2">
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className='text-secondary w-fit block'>
                                                    {link.label}
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer data={data} />
            </div>
        </div>
    );
}
