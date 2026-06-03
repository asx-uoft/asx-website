import { StaticImageData } from 'next/image';
import { SocialIcon } from './storage';
import discordSvg   from '../assets/discord.svg';
import instagramSvg from '../assets/instagram.svg';
import linkedinSvg  from '../assets/linkedin.svg';
import facebookSvg  from '../assets/facebook.svg';
import youtubeSvg   from '../assets/youtube.svg';

export const SOCIAL_SVG_MAP: Partial<Record<SocialIcon, StaticImageData>> = {
    discord:   discordSvg,
    instagram: instagramSvg,
    linkedin:  linkedinSvg,
    facebook:  facebookSvg,
    youtube:   youtubeSvg,
};

export const SOCIAL_ICON_LABELS: Record<SocialIcon, string> = {
    discord:   'Discord',
    instagram: 'Instagram',
    linkedin:  'LinkedIn',
    facebook:  'Facebook',
    youtube:   'YouTube',
    none:      'No icon',
};
