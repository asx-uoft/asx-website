import asxlogo from '../assets/asx_logo.png';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { LinksData, LINKS_DEFAULTS } from '@/utils/storage';
import { SOCIAL_SVG_MAP } from '@/utils/socialIcons';

interface FooterProps {
    data?: LinksData;
}

export default function Footer({ data: initialData }: FooterProps) {
    const [data, setData] = useState<LinksData>(initialData ?? LINKS_DEFAULTS);

    useEffect(() => {
        if (!initialData) {
            fetch('/api/links')
                .then(r => r.json())
                .then(setData)
                .catch(() => {});
        }
    }, [initialData]);

    const { email, socials } = data;

    return (
        <div className="flex flex-col items-center sm:flex-row mt-5 p-4 text-center justify-center gap-10 md:gap-20">
            {/* Logo + copyright */}
            <div className="flex sm:flex-col gap-5 items-center justify-center w-full sm:w-48 md:w-56 order-3 sm:order-1">
                <div className='w-24 sm:w-32 md:w-48 flex justify-center'>
                    <Image src={asxlogo.src} alt="ASX Logo" width={128} height={128} />
                </div>
                <div className="flex items-center justify-center">
                    <p>&copy; {new Date().getFullYear()} UTASX. All rights reserved.</p>
                </div>
            </div>

            {/* Socials */}
            <div className='flex flex-col gap-3 items-center justify-center order-1 sm:order-2'>
                <div className='text-md md:text-lg'>Stay Updated</div>
                <Separator orientation='horizontal' className='hidden sm:block' />
                <div className='flex flex-wrap justify-center sm:flex-col gap-3 items-center'>
                    {socials.map(social => (
                        <div key={social.id} className='flex items-center gap-2'>
                            {SOCIAL_SVG_MAP[social.icon] && (
                                <Image
                                    src={SOCIAL_SVG_MAP[social.icon]!}
                                    alt={social.name}
                                    className="object-cover w-5 h-5 icon-theme"
                                    width={20}
                                    height={20}
                                />
                            )}
                            <a
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-md md:text-lg text-secondary"
                            >
                                {social.name}
                            </a>
                            {social.isNew && (
                                <Badge variant="default" className='text-sm bg-foreground text-background'>New!</Badge>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Membership + contact */}
            <div className="flex-col justify-between order-2 gap-10 flex sm:order-3">
                <div className='flex flex-col gap-3 items-center'>
                    <div className='text-md md:text-lg'>Become a member and access our newsletter!</div>
                    <a href="/membership" className="text-lg bg-secondary w-fit p-1 text-background">
                        Membership Registration
                    </a>
                </div>
                <div>
                    <div className='text-md md:text-lg'>21 Sussex Ave, Toronto, Ontario M5S 1J6, CA</div>
                    <div className='text-md md:text-lg'>{email}</div>
                </div>
            </div>
        </div>
    );
}
