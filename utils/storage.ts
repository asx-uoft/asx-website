import { put, list, del } from '@vercel/blob';

export interface Article {
    title: string;
    key: string;
    timestamp: string;
    bannerUrl: string;
    content: string;
}

export interface NewsPage {
    items: Article[];
    nextKey?: string;
    pageSize?: number;
}

export interface Exec {
    title: string;
    name: string;
}

export interface AboutData {
    imageUrl: string;
    missionStatement: string;
    description: string;
    execs: Exec[];
}

const INDEX_PATH = 'posts/index.json';
const ABOUT_PATH = 'about/data.json';
const LINKS_PATH = 'links/data.json';
const SPONSORS_PATH = 'sponsors/data.json';
const HOME_PATH = 'home/data.json';

export interface HomeEventCard {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

export interface HomeData {
    bannerImageUrl: string;
    bannerCaption: string;
    imageCreditTitle: string;
    imageCreditLine: string;
    quote: string;
    eventCards: HomeEventCard[];
}

const HOME_DEFAULTS: HomeData = {
    bannerImageUrl: '/banner-nov.jpg',
    bannerCaption: "UofT's astronomy outreach club",
    imageCreditTitle: 'NGC2244 - Rosette Nebula',
    imageCreditLine: 'Credit: Gavin Farley @gaviniwnl',
    quote: "Founded in 2003, ASX is a non-profit organization run by the University of Toronto undergraduate space community. Our purpose is to educate, excite, and inspire students, professionals, and the general public about astronomy and space.",
    eventCards: [
        { id: 'e1', title: 'Symposium',       imageUrl: '', description: 'Our signature event — an annual symposium on the latest in space research, featuring distinguished speakers from the field.' },
        { id: 'e2', title: 'Observation Night', imageUrl: '', description: "Exclusive opportunities to visit McLennan's rooftop observatory and observe celestial objects through telescopes." },
        { id: 'e3', title: 'StarTalk',         imageUrl: '', description: 'Accessible, engaging lectures on a variety of topics in astronomy and space, delivered by researchers from UofT and beyond.' },
    ],
};

export async function readHome(): Promise<HomeData> {
    const { blobs } = await list({ prefix: HOME_PATH });
    if (!blobs.length) return HOME_DEFAULTS;
    const res = await fetchBlob(blobs[0].url);
    if (!res.ok) return HOME_DEFAULTS;
    return res.json();
}

export async function writeHome(data: HomeData): Promise<void> {
    const blob = await put(HOME_PATH, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    await deleteStale(HOME_PATH, blob.url);
}

export interface SponsorItem {
    id: string;
    name: string;
    badge: string;
    imageUrl: string;
    description: string;
}

export interface SponsorsTableTier {
    id: string;
    name: string;
    price: string;
}

export interface SponsorsTableRow {
    id: string;
    benefit: string;
    checks: Record<string, boolean>;
}

export interface SponsorsData {
    packagePdfUrl: string;
    sponsors: SponsorItem[];
    tiers: SponsorsTableTier[];
    tableRows: SponsorsTableRow[];
}

export const SPONSORS_DEFAULTS: SponsorsData = {
    packagePdfUrl: '/sponsorship.pdf',
    sponsors: [
        {
            id: 'sp1',
            name: 'Dunlap Institute for Astronomy & Astrophysics',
            badge: 'Neutron Star Sponsor',
            imageUrl: 'https://www.dunlap.utoronto.ca/wp-content/themes/dunlap/images/dunlap-logo.png',
            description: 'The Dunlap Institute for Astronomy & Astrophysics at the University of Toronto is an endowed research institute with over 50 faculty, postdocs, students and staff, dedicated to innovative technology, groundbreaking research, world-class training, and public engagement.',
        },
    ],
    tiers: [
        { id: 't1', name: 'Gas Giant',    price: '$200'  },
        { id: 't2', name: 'White Dwarf',  price: '$500'  },
        { id: 't3', name: 'Red Giant',    price: '$800'  },
        { id: 't4', name: 'Neutron Star', price: '$2500' },
        { id: 't5', name: 'Black Hole',   price: '$5000' },
    ],
    tableRows: [
        { id: 'r1',  benefit: 'Name, logo, and website link featured on our online list of sponsors.',                                                         checks: { t1: true,  t2: true,  t3: true,  t4: true,  t5: true  } },
        { id: 'r2',  benefit: 'Verbal thank you at our Annual Symposium in February.',                                                                          checks: { t1: true,  t2: true,  t3: true,  t4: true,  t5: true  } },
        { id: 'r3',  benefit: 'Name, logo, and verbal thank you at our student recruitment events in September.',                                                checks: { t1: false, t2: true,  t3: true,  t4: true,  t5: true  } },
        { id: 'r4',  benefit: 'Name and logo featured in our printed symposium programme.',                                                                      checks: { t1: false, t2: true,  t3: true,  t4: true,  t5: true  } },
        { id: 'r5',  benefit: 'Custom advertisement distributed once per year via our monthly newsletter and social media.',                                     checks: { t1: false, t2: false, t3: true,  t4: true,  t5: true  } },
        { id: 'r6',  benefit: 'Name and logo included on our printed symposium posters featured around U of T, St. George campus.',                             checks: { t1: false, t2: false, t3: true,  t4: true,  t5: true  } },
        { id: 'r7',  benefit: 'Name and logo included on our official banners hung at all of our events.',                                                       checks: { t1: false, t2: false, t3: false, t4: true,  t5: true  } },
        { id: 'r8',  benefit: 'Host a booth at one of our events.',                                                                                             checks: { t1: false, t2: false, t3: false, t4: true,  t5: true  } },
        { id: 'r9',  benefit: "Custom advertisement played before and in between our symposium's lectures.",                                                     checks: { t1: false, t2: false, t3: false, t4: true,  t5: true  } },
        { id: 'r10', benefit: 'Logo and verbal thank you featured at every single one of our monthly events.',                                                   checks: { t1: false, t2: false, t3: false, t4: false, t5: true  } },
        { id: 'r11', benefit: 'Industry exclusivity — we will only accept your sponsorship from all organisations in your industry.',                            checks: { t1: false, t2: false, t3: false, t4: false, t5: true  } },
    ],
};

export async function readSponsors(): Promise<SponsorsData> {
    const { blobs } = await list({ prefix: SPONSORS_PATH });
    if (!blobs.length) return SPONSORS_DEFAULTS;
    const res = await fetchBlob(blobs[0].url);
    if (!res.ok) return SPONSORS_DEFAULTS;
    return res.json();
}

export async function writeSponsors(data: SponsorsData): Promise<void> {
    const blob = await put(SPONSORS_PATH, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    await deleteStale(SPONSORS_PATH, blob.url);
}

export const SOCIAL_ICONS = ['discord', 'instagram', 'linkedin', 'facebook', 'youtube', 'none'] as const;
export type SocialIcon = typeof SOCIAL_ICONS[number];

export interface Social {
    id: string;
    name: string;
    icon: SocialIcon;
    url: string;
    isNew: boolean;
}

export interface ResourceLink {
    id: string;
    label: string;
    url: string;
}

export interface ResourceSection {
    id: string;
    header: string;
    links: ResourceLink[];
}

export interface LinksData {
    email: string;
    membershipFormUrl: string;
    socials: Social[];
    resourceSections: ResourceSection[];
}

export const LINKS_DEFAULTS: LinksData = {
    email: 'space.association.utasx@gmail.com',
    membershipFormUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSds1kWl9mzx4UYoiUR9OKBf8cBIDVsiEXC9QQ4k2n5h8QxxVQ/viewform?embedded=true',
    socials: [
        { id: 's1', name: 'Discord',   icon: 'discord',   url: 'https://discord.gg/mTZMCKWsjr',                                   isNew: true  },
        { id: 's2', name: 'Instagram', icon: 'instagram', url: 'https://www.instagram.com/asx_uoft/',                              isNew: false },
        { id: 's3', name: 'LinkedIn',  icon: 'linkedin',  url: 'https://www.linkedin.com/company/asx-society/',                    isNew: false },
        { id: 's4', name: 'Facebook',  icon: 'facebook',  url: 'https://www.facebook.com/ASXAssoc',                                isNew: false },
        { id: 's5', name: 'YouTube',   icon: 'youtube',   url: 'https://www.youtube.com/@astronomyandspaceexplorati5753',          isNew: false },
    ],
    resourceSections: [
        {
            id: 'rs1', header: 'UofT related',
            links: [
                { id: 'l1',  label: 'Department of Astronomy & Astrophysics', url: 'https://astro.utoronto.ca/' },
                { id: 'l2',  label: 'Public Tours', url: 'https://www.astro.utoronto.ca/astrotours/singlepage/discover/' },
                { id: 'l3',  label: 'Dunlap Institute for Astronomy & Astrophysics', url: 'https://www.dunlap.utoronto.ca/' },
                { id: 'l4',  label: 'Royal Astronomical Society (RASC) @ UofT Mississauga', url: 'https://mississauga.rasc.ca/' },
                { id: 'l5',  label: 'Institute for Aerospace Studies (UTIAS)', url: 'https://www.utias.utoronto.ca/' },
            ],
        },
        {
            id: 'rs2', header: 'Canadian Astronomy & Space Groups',
            links: [
                { id: 'l6',  label: 'Astronomy Club @ York University', url: 'https://astroatyork.wixsite.com/acyu' },
                { id: 'l7',  label: 'Canadian Aeronautics & Space Institute (CASI)', url: 'https://www.casi.ca/' },
                { id: 'l8',  label: 'Canadian Space Society (CSS)', url: 'https://www.css.ca/' },
                { id: 'l9',  label: 'Mars Society of Canada', url: 'https://www.marssociety.ca/' },
                { id: 'l10', label: 'North York Astronomical Association', url: 'https://www.nyaa.ca/' },
                { id: 'l11', label: 'Royal Astronomical Society of Canada (RASC)', url: 'https://rasc.ca/' },
                { id: 'l12', label: 'RASC Toronto Centre', url: 'https://toronto.rasc.ca/' },
            ],
        },
        {
            id: 'rs3', header: 'Other Resources',
            links: [
                { id: 'l13', label: 'Canadian Space Agency (CSA)', url: 'https://www.asc-csa.gc.ca/eng/default.asp' },
                { id: 'l14', label: 'Astronomers without Borders', url: 'https://www.astronomerswithoutborders.org/' },
                { id: 'l15', label: 'The Planetary Society', url: 'https://www.planetary.org/' },
                { id: 'l16', label: 'International Astronomical Youth Camp', url: 'https://iayc.org' },
                { id: 'l17', label: 'Mars Society - USA', url: 'https://www.marssociety.org' },
                { id: 'l18', label: 'National Space Society - USA', url: 'https://www.nss.org' },
                { id: 'l19', label: 'Sky & Telescope', url: 'https://skyandtelescope.org/' },
                { id: 'l20', label: 'Cloudy Nights', url: 'https://www.cloudynights.com/' },
                { id: 'l21', label: 'Astronomical Calendar', url: 'http://seasky.org/astronomy/astronomy-calendar-current.html' },
                { id: 'l22', label: 'Star Lust', url: 'https://starlust.org' },
                { id: 'l23', label: 'Universe Today', url: 'https://www.universetoday.com/' },
                { id: 'l24', label: 'Telescopic Watch', url: 'https://telescopicwatch.com' },
                { id: 'l25', label: 'Sky Maps', url: 'https://skymaps.com/' },
                { id: 'l26', label: 'Astronomy in Media', url: 'https://octaneseating.com/blog/astronomy-in-media/' },
                { id: 'l27', label: 'Astronomy Resources for Kids', url: 'https://blog.aaastateofplay.com/2022/02/astronomy-resources-for-kids.html' },
            ],
        },
    ],
};

export async function readLinks(): Promise<LinksData> {
    const { blobs } = await list({ prefix: LINKS_PATH });
    if (!blobs.length) return LINKS_DEFAULTS;
    const res = await fetchBlob(blobs[0].url);
    if (!res.ok) return LINKS_DEFAULTS;
    return res.json();
}

export async function writeLinks(data: LinksData): Promise<void> {
    const blob = await put(LINKS_PATH, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    await deleteStale(LINKS_PATH, blob.url);
}

const ABOUT_DEFAULTS: AboutData = {
    imageUrl: '',
    missionStatement: 'To educate, excite, and inspire students, professionals, and the general public about astronomy and space.',
    description: 'ASX is a non-profit organization run by the University of Toronto undergraduate space community.\n\nSince its inception in 2003, ASX has rapidly grown, organising numerous high-profile events with distinguished speakers, including astronauts, astronomers, and space entrepreneurs. ASX has also established partnerships with various organizations, including the Royal Astronomical Society of Canada, the Canadian Space Society, and the Canadian Space Agency.',
    execs: [
        { title: 'President', name: 'Amy Toms' },
        { title: 'Vice President', name: 'York Ng' },
        { title: 'Secretary', name: 'Hannah Semple' },
        { title: 'Events Director', name: 'Thato Sotashe' },
        { title: 'Symposium Director', name: 'Isabella Rivera' },
        { title: 'Symposium Director', name: 'Darrell Rosaceña' },
        { title: 'Graphic Designer', name: 'Amy Miller' },
        { title: 'Outreach Director', name: 'Chris Cheng' },
        { title: 'Webmaster', name: 'Zoya Babicheva' },
        { title: 'Photographer', name: 'Mirza Ahmed' },
    ],
};

// Reading always busts the CDN cache with a timestamp query param so origin
// is always hit, regardless of CDN edge caching. Writing uses allowOverwrite
// so the blob URL never changes — no list() eventual-consistency issues.

async function fetchBlob(url: string): Promise<Response> {
    return fetch(`${url}?_=${Date.now()}`, { cache: 'no-store' });
}

async function deleteStale(prefix: string, canonicalUrl: string): Promise<void> {
    const { blobs } = await list({ prefix });
    const stale = blobs.filter(b => b.url !== canonicalUrl);
    if (stale.length) await del(stale.map(b => b.url));
}

// ── About ─────────────────────────────────────────────────────────────────────

export async function readAbout(): Promise<AboutData> {
    const { blobs } = await list({ prefix: ABOUT_PATH });
    if (!blobs.length) return ABOUT_DEFAULTS;
    const res = await fetchBlob(blobs[0].url);
    if (!res.ok) return ABOUT_DEFAULTS;
    return res.json();
}

export async function writeAbout(data: AboutData): Promise<void> {
    const blob = await put(ABOUT_PATH, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    await deleteStale(ABOUT_PATH, blob.url);
}

// ── News index ────────────────────────────────────────────────────────────────

async function readIndex(): Promise<Article[]> {
    const { blobs } = await list({ prefix: INDEX_PATH });
    if (!blobs.length) return [];
    const res = await fetchBlob(blobs[0].url);
    if (!res.ok) throw new Error(`Failed to fetch index: ${res.status}`);
    return res.json();
}

async function writeIndex(articles: Article[]): Promise<void> {
    const blob = await put(INDEX_PATH, JSON.stringify(articles), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    await deleteStale(INDEX_PATH, blob.url);
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getIndex(pageSize = 10, startKey?: string): Promise<NewsPage> {
    const all = await readIndex();
    let start = 0;
    if (startKey) {
        const idx = all.findIndex(a => a.key === startKey);
        if (idx !== -1) start = idx + 1;
    }
    const items = all.slice(start, start + pageSize);
    const hasMore = start + pageSize < all.length;
    const nextKey = hasMore ? items[items.length - 1]?.key : undefined;
    return { items, nextKey };
}

export async function getArticleBlob(key: string): Promise<Article | null> {
    try {
        const { blobs } = await list({ prefix: `posts/${key}.json` });
        if (!blobs.length) return null;
        const res = await fetchBlob(blobs[0].url);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function createArticleBlob(article: Omit<Article, 'timestamp'>): Promise<Article> {
    const full: Article = { ...article, timestamp: new Date().toISOString() };
    await put(`posts/${full.key}.json`, JSON.stringify(full), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    const index = await readIndex();
    index.unshift({ ...full, content: markdownToPlainText(full.content) });
    await writeIndex(index);
    return full;
}

export async function deleteArticleBlob(key: string): Promise<{ warning?: string }> {
    let warning: string | undefined;
    try {
        const { blobs } = await list({ prefix: `posts/${key}.json` });
        if (blobs.length) await del(blobs.map(b => b.url));
    } catch (err) {
        warning = `Post removed from index but blob file could not be deleted: ${(err as Error).message}`;
    }
    const index = await readIndex();
    const filtered = index.filter(a => a.key !== key);
    if (filtered.length !== index.length) await writeIndex(filtered);
    return warning ? { warning } : {};
}

export async function editArticleBlob(
    key: string,
    updates: Partial<Pick<Article, 'title' | 'content' | 'bannerUrl'>>
): Promise<Article> {
    const existing = await getArticleBlob(key);
    if (!existing) throw new Error(`Article "${key}" not found`);
    const updated: Article = { ...existing, ...updates };
    await put(`posts/${key}.json`, JSON.stringify(updated), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
    });
    const index = await readIndex();
    const i = index.findIndex(a => a.key === key);
    if (i !== -1) {
        index[i] = { ...updated, content: markdownToPlainText(updated.content) };
        await writeIndex(index);
    }
    return updated;
}

export function markdownToPlainText(md: string): string {
    if (!md) return '';
    let s = String(md).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/~~~[\s\S]*?~~~/g, '');
    s = s.replace(/<\/?[^>]+(>|$)/g, '');
    s = s.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (_m, e) => {
        if (e[0] === '#') {
            const isHex = e[1] === 'x' || e[1] === 'X';
            const num = isHex ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
            return isNaN(num) ? '' : String.fromCharCode(num);
        }
        const map: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
        return map[e] ?? '';
    });
    s = s.replace(/!\[([^\]]*)\]\([^\)]*\)/g, '$1');
    s = s.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
    s = s.replace(/`([^`]+)`/g, '$1');
    s = s.replace(/(\*\*|__)(.*?)\1/g, '$2');
    s = s.replace(/(\*|_)(.*?)\1/g, '$2');
    s = s.replace(/~~(.*?)~~/g, '$1');
    s = s.replace(/^\s{0,3}#{1,6}\s*/gm, '');
    s = s.replace(/^\s*([-*+])\s+/gm, '');
    s = s.replace(/^\s*\d+\.\s+/gm, '');
    s = s.replace(/^\s*>\s?/gm, '');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
}
