import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Users } from "lucide-react";
import membership from '../assets/membership.jpg';
import Image from "next/image";
import { GetStaticProps } from "next";
import { readLinks } from "@/utils/storage";

interface MembershipProps { membershipFormUrl: string; }

export const getStaticProps: GetStaticProps<MembershipProps> = async () => {
    const data = await readLinks();
    return { props: { membershipFormUrl: data.membershipFormUrl }, revalidate: 30 };
};

export default function Membership({ membershipFormUrl }: MembershipProps) {
    return (
        <div className='max-w-7xl mx-auto'>
            <Navbar />
            <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
                <div className='w-full flex-grow flex flex-col gap-8 px-4 items-center'>
                    {/* Header Section */}
                    <div className="w-full max-w-4xl">
                            <div className="relative w-full h-56 md:h-72 rounded-xl overflow-hidden">
                                <Image src={membership} alt="McLennan balcony @ observation night" fill className="object-cover" />
                                {/* Extra dim overlay */}
                                <div className="absolute inset-0 bg-black/40" />
                                {/* Gradient to keep top darker while preserving text contrast */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                    <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-md">ASX Membership</h1>
                                    <div className="text-lg md:text-xl text-white/90 mt-2 drop-shadow-sm">
                                        Become a member of the ASX and join our community of space enthusiasts!
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/* <div className='flex flex-col gap-5 w-full items-center pt-8'>
                        <div className='text-3xl md:text-4xl text-center font-bold'>ASX Membership</div>
                        <div className='text-lg md:text-xl text-center max-w-3xl'>
                            Become a member of the ASX and join our community of space enthusiasts!
                        </div>
                    </div> */}

                    <Users className="w-8 h-8 text-gray-500" />

                    {/* Form Section */}
                    <div className='w-full max-w-4xl flex justify-center'>
                        <iframe
                            src={membershipFormUrl}
                            width="640"
                            height="2334"
                            style={{ border: 0, margin: 0 }}
                        >
                            Loading…
                        </iframe>
                    </div>

                    {/* Benefits Section */}
                    <div className='w-full max-w-4xl flex flex-col gap-8 md:gap-12'>
                        <div className='text-2xl md:text-3xl text-center text-primary'>Membership Benefits</div>

                        <div className='grid gap-6 md:grid-cols-3'>
                            <div className='flex flex-col gap-3 items-center text-center p-6 border rounded-lg border-gray-700 dark:border-gray-700'>
                                <div className='text-xl md:text-2xl text-primary'>Priority Access</div>
                                <div className='text-lg'>
                                    Get priority registration to our Annual Symposium.
                                </div>
                            </div>

                            <div className='flex flex-col gap-3 items-center text-center p-6 border rounded-lg border-gray-700 dark:border-gray-700'>
                                <div className='text-xl md:text-2xl text-primary'>Community</div>
                                <div className='text-lg'>
                                    Connect with like-minded individuals who share your passion for astronomy and space exploration.
                                </div>
                            </div>

                            <div className='flex flex-col gap-3 items-center text-center p-6 border rounded-lg border-gray-700 dark:border-gray-700'>
                                <div className='text-xl md:text-2xl text-primary'>Stay Updated</div>
                                <div className='text-lg'>
                                    Receive the latest news on upcoming events and opportunities through our monthly newsletter.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='text-lg md:text-xl text-center max-w-3xl pb-8'>
                        Thank you for your interest in becoming a member of ASX! We look forward to welcoming you to our community.
                    </div>
                </div>
                <Footer />
            </div>
        </div>
    );
}
