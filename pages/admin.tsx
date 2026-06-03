import { GetServerSideProps } from 'next';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { verifyToken } from '@/utils/auth';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InfoIcon, Link, Newspaper, HelpCircle, Info, HandCoins, Pencil, Trash2, GripVertical, Plus, X, Home } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Article, editArticle, fetchNews, getArticle } from './api/news';
import { createPost, uploadImage } from '@/utils/postnews';
import { Exec, Social, ResourceSection, ResourceLink, SOCIAL_ICONS, SponsorItem, SponsorsTableTier, SponsorsTableRow, HomeEventCard } from '@/utils/storage';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SOCIAL_SVG_MAP, SOCIAL_ICON_LABELS } from '@/utils/socialIcons';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminProps {
  isAuthenticated: boolean;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req } = context;
    const token = req.cookies['admin-token'] || '';
    const isAuthenticated = verifyToken(token);
    return { props: { isAuthenticated } };
}

const uid = () => Math.random().toString(36).slice(2, 9);

function SortableSocialRow({
    social, index, disabled,
    onChange, onRemove,
}: {
    social: Social; index: number; disabled: boolean;
    onChange: (i: number, patch: Partial<Social>) => void;
    onRemove: (i: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: social.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
        >
            <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4" />
            </button>
            <Select value={social.icon} onValueChange={v => onChange(index, { icon: v as Social['icon'] })} disabled={disabled}>
                <SelectTrigger className="w-32 shrink-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {SOCIAL_ICONS.map(icon => (
                        <SelectItem key={icon} value={icon}>
                            <span className="flex items-center gap-2">
                                {SOCIAL_SVG_MAP[icon] && <Image src={SOCIAL_SVG_MAP[icon]!} alt={icon} width={16} height={16} className="icon-theme" />}
                                {SOCIAL_ICON_LABELS[icon]}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input placeholder="Name" value={social.name} onChange={e => onChange(index, { name: e.target.value })} disabled={disabled} className="w-28 shrink-0" />
            <Input placeholder="URL" value={social.url} onChange={e => onChange(index, { url: e.target.value })} disabled={disabled} className="flex-1 min-w-0" />
            <div className="flex items-center gap-1.5 shrink-0">
                <Switch checked={social.isNew} onCheckedChange={v => onChange(index, { isNew: v })} disabled={disabled} id={`new-${social.id}`} />
                <Label htmlFor={`new-${social.id}`} className="text-xs text-gray-400 font-normal cursor-pointer">New</Label>
            </div>
            <button type="button" onClick={() => onRemove(index)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

function SortableResourceLinkRow({
    link, sectionId, linkIndex, disabled,
    onChange, onRemove,
}: {
    link: ResourceLink; sectionId: string; linkIndex: number; disabled: boolean;
    onChange: (patch: Partial<ResourceLink>) => void;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
        >
            <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none ml-4" {...attributes} {...listeners}>
                <GripVertical className="h-3.5 w-3.5" />
            </button>
            <Input placeholder="Label" value={link.label} onChange={e => onChange({ label: e.target.value })} disabled={disabled} className="flex-1 min-w-0 h-8 text-sm" />
            <Input placeholder="URL" value={link.url} onChange={e => onChange({ url: e.target.value })} disabled={disabled} className="flex-1 min-w-0 h-8 text-sm" />
            <button type="button" onClick={onRemove} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function SortableResourceSectionBlock({
    section, sectionIndex, disabled,
    onChangeHeader, onRemoveSection,
    onChangeLink, onRemoveLink, onAddLink, onLinkDragEnd,
}: {
    section: ResourceSection; sectionIndex: number; disabled: boolean;
    onChangeHeader: (i: number, val: string) => void;
    onRemoveSection: (i: number) => void;
    onChangeLink: (si: number, li: number, patch: Partial<ResourceLink>) => void;
    onRemoveLink: (si: number, li: number) => void;
    onAddLink: (si: number) => void;
    onLinkDragEnd: (si: number, event: DragEndEvent) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`border border-gray-700 rounded-lg p-3 space-y-2 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex items-center gap-2">
                <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>
                <Input
                    placeholder="Section header"
                    value={section.header}
                    onChange={e => onChangeHeader(sectionIndex, e.target.value)}
                    disabled={disabled}
                    className="flex-1 font-medium"
                />
                <button type="button" onClick={() => onRemoveSection(sectionIndex)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <DndContext sensors={undefined} collisionDetection={closestCenter} onDragEnd={e => onLinkDragEnd(sectionIndex, e)}>
                <SortableContext items={section.links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                        {section.links.map((link, li) => (
                            <SortableResourceLinkRow
                                key={link.id}
                                link={link}
                                sectionId={section.id}
                                linkIndex={li}
                                disabled={disabled}
                                onChange={patch => onChangeLink(sectionIndex, li, patch)}
                                onRemove={() => onRemoveLink(sectionIndex, li)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <button
                type="button"
                onClick={() => onAddLink(sectionIndex)}
                disabled={disabled}
                className="ml-4 text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
                <Plus className="h-3 w-3" /> Add link
            </button>
        </div>
    );
}

function SortableSponsorCard({
    sponsor, index, disabled,
    onChange, onRemove,
}: {
    sponsor: SponsorItem & { imageMode: 'url' | 'upload'; imageFile: File | null };
    index: number; disabled: boolean;
    onChange: (i: number, patch: Partial<SponsorItem & { imageMode: 'url' | 'upload'; imageFile: File | null }>) => void;
    onRemove: (i: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sponsor.id });
    const preview = sponsor.imageMode === 'url' ? sponsor.imageUrl : sponsor.imageFile ? URL.createObjectURL(sponsor.imageFile) : sponsor.imageUrl;
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`border border-gray-700 rounded-lg p-3 space-y-3 ${isDragging ? 'opacity-50' : ''}`}
        >
            <div className="flex items-center gap-2">
                <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>
                <span className="flex-1 font-medium text-sm truncate">{sponsor.name || 'New sponsor'}</span>
                <button type="button" onClick={() => onRemove(index)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40">
                    <X className="h-4 w-4" />
                </button>
            </div>
            {/* Image */}
            <div className="space-y-2 pl-6">
                <RadioGroup value={sponsor.imageMode} onValueChange={v => onChange(index, { imageMode: v as 'url' | 'upload', imageFile: null })} className="flex gap-4" disabled={disabled}>
                    <div className="flex items-center gap-2"><RadioGroupItem value="url" id={`sp-url-${sponsor.id}`} /><Label htmlFor={`sp-url-${sponsor.id}`} className="font-normal text-sm cursor-pointer">Image URL</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="upload" id={`sp-upload-${sponsor.id}`} /><Label htmlFor={`sp-upload-${sponsor.id}`} className="font-normal text-sm cursor-pointer">Upload</Label></div>
                </RadioGroup>
                {sponsor.imageMode === 'url'
                    ? <Input placeholder="https://..." value={sponsor.imageUrl} onChange={e => onChange(index, { imageUrl: e.target.value })} disabled={disabled} className="text-sm" />
                    : <Input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onChange(index, { imageFile: e.target.files[0] }); }} disabled={disabled} className="text-sm" />
                }
                {preview && <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded-full" />}
            </div>
            <div className="pl-6 space-y-2">
                <Input placeholder="Name" value={sponsor.name} onChange={e => onChange(index, { name: e.target.value })} disabled={disabled} className="text-sm" />
                <Input placeholder="Badge (e.g. Neutron Star Sponsor)" value={sponsor.badge} onChange={e => onChange(index, { badge: e.target.value })} disabled={disabled} className="text-sm" />
                <Textarea placeholder="Description" value={sponsor.description} onChange={e => onChange(index, { description: e.target.value })} disabled={disabled} rows={3} className="text-sm" />
            </div>
        </div>
    );
}

function SortableTierRow({
    tier, index, disabled, onChange, onRemove,
}: {
    tier: SponsorsTableTier; index: number; disabled: boolean;
    onChange: (i: number, patch: Partial<SponsorsTableTier>) => void;
    onRemove: (i: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tier.id });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}>
            <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none" {...attributes} {...listeners}><GripVertical className="h-4 w-4" /></button>
            <Input placeholder="Name" value={tier.name} onChange={e => onChange(index, { name: e.target.value })} disabled={disabled} className="flex-1" />
            <Input placeholder="Price" value={tier.price} onChange={e => onChange(index, { price: e.target.value })} disabled={disabled} className="w-24 shrink-0" />
            <button type="button" onClick={() => onRemove(index)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>
    );
}

function SortableBenefitRow({
    row, tiers, index, disabled, onChange, onRemove,
}: {
    row: SponsorsTableRow; tiers: SponsorsTableTier[]; index: number; disabled: boolean;
    onChange: (i: number, patch: Partial<SponsorsTableRow>) => void;
    onRemove: (i: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-start gap-2 ${isDragging ? 'opacity-50' : ''}`}>
            <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none mt-2" {...attributes} {...listeners}><GripVertical className="h-4 w-4" /></button>
            <Textarea
                value={row.benefit}
                onChange={e => onChange(index, { benefit: e.target.value })}
                disabled={disabled}
                rows={2}
                className="flex-1 text-sm resize-none"
                placeholder="Benefit description"
            />
            <div className="flex gap-3 shrink-0 flex-wrap mt-2">
                {tiers.map(tier => (
                    <div key={tier.id} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500 text-center leading-tight max-w-12 truncate">{tier.name}</span>
                        <Switch
                            checked={!!row.checks[tier.id]}
                            onCheckedChange={v => onChange(index, { checks: { ...row.checks, [tier.id]: v } })}
                            disabled={disabled}
                        />
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => onRemove(index)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40 mt-2"><X className="h-4 w-4" /></button>
        </div>
    );
}

function SortableEventCardRow({
    card, index, disabled, onChange, onRemove,
}: {
    card: HomeEventCard & { imageMode: 'url' | 'upload'; imageFile: File | null };
    index: number; disabled: boolean;
    onChange: (i: number, patch: Partial<HomeEventCard & { imageMode: 'url' | 'upload'; imageFile: File | null }>) => void;
    onRemove: (i: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
    const preview = card.imageMode === 'url' ? card.imageUrl : card.imageFile ? URL.createObjectURL(card.imageFile) : '';
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`border border-gray-700 rounded-lg p-3 space-y-3 ${isDragging ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
                <button type="button" className="cursor-grab text-gray-500 hover:text-gray-300 touch-none" {...attributes} {...listeners}>
                    <GripVertical className="h-4 w-4" />
                </button>
                <span className="flex-1 font-medium text-sm truncate">{card.title || 'New card'}</span>
                <button type="button" onClick={() => onRemove(index)} disabled={disabled} className="text-gray-500 hover:text-red-400 disabled:opacity-40">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="pl-6 space-y-2">
                <RadioGroup value={card.imageMode} onValueChange={v => onChange(index, { imageMode: v as 'url' | 'upload', imageFile: null })} className="flex gap-4" disabled={disabled}>
                    <div className="flex items-center gap-2"><RadioGroupItem value="url" id={`ec-url-${card.id}`} /><Label htmlFor={`ec-url-${card.id}`} className="font-normal text-sm cursor-pointer">Image URL</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="upload" id={`ec-up-${card.id}`} /><Label htmlFor={`ec-up-${card.id}`} className="font-normal text-sm cursor-pointer">Upload</Label></div>
                </RadioGroup>
                {card.imageMode === 'url'
                    ? <Input placeholder="https://..." value={card.imageUrl} onChange={e => onChange(index, { imageUrl: e.target.value })} disabled={disabled} className="text-sm" />
                    : <Input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) onChange(index, { imageFile: e.target.files[0] }); }} disabled={disabled} className="text-sm" />
                }
                {preview && <img src={preview} alt="preview" className="h-20 w-full object-cover rounded-lg" />}
                <Input placeholder="Title" value={card.title} onChange={e => onChange(index, { title: e.target.value })} disabled={disabled} className="text-sm" />
                <Textarea placeholder="Description" value={card.description} onChange={e => onChange(index, { description: e.target.value })} disabled={disabled} rows={2} className="text-sm" />
            </div>
        </div>
    );
}

function SortableExecRow({
    id, exec, index, disabled,
    onChange, onRemove,
}: {
    id: string;
    exec: Exec;
    index: number;
    disabled: boolean;
    onChange: (index: number, field: keyof Exec, value: string) => void;
    onRemove: (index: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 ${isDragging ? 'opacity-50' : ''}`}
        >
            <button
                type="button"
                className="cursor-grab text-gray-500 hover:text-gray-300 touch-none"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <Input
                placeholder="Title"
                value={exec.title}
                onChange={e => onChange(index, 'title', e.target.value)}
                disabled={disabled}
                className="flex-1"
            />
            <Input
                placeholder="Name"
                value={exec.name}
                onChange={e => onChange(index, 'name', e.target.value)}
                disabled={disabled}
                className="flex-1"
            />
            <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="text-gray-500 hover:text-red-400 disabled:opacity-40"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export default function Admin({ isAuthenticated }: AdminProps) {
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const [postKey, setPostKey] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerMode, setBannerMode] = useState<'upload' | 'url'>('upload');
    const [bannerUrlInput, setBannerUrlInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [articles, setArticles] = useState<Article[]>([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [nextKey, setNextKey] = useState<string | undefined>();

    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

    const [activeTab, setActiveTab] = useState<'home' | 'news' | 'about' | 'links' | 'sponsors' | 'help'>('news');

    // Home tab state
    const [homeLoaded, setHomeLoaded] = useState(false);
    const [homeSaving, setHomeSaving] = useState(false);
    const [homeBannerMode, setHomeBannerMode] = useState<'url' | 'upload'>('url');
    const [homeBannerFile, setHomeBannerFile] = useState<File | null>(null);
    const [homeBannerUrl, setHomeBannerUrl] = useState('');
    const [homeCaption, setHomeCaption] = useState('');
    const [homeImageCreditTitle, setHomeImageCreditTitle] = useState('');
    const [homeImageCreditLine, setHomeImageCreditLine] = useState('');
    const [homeQuote, setHomeQuote] = useState('');
    const [homeEventCards, setHomeEventCards] = useState<(HomeEventCard & { imageMode: 'url' | 'upload'; imageFile: File | null })[]>([]);

    const homeBannerPreview = homeBannerMode === 'url' ? homeBannerUrl : homeBannerFile ? URL.createObjectURL(homeBannerFile) : homeBannerUrl;

    // About tab state
    const [aboutLoaded, setAboutLoaded] = useState(false);
    const [aboutSaving, setAboutSaving] = useState(false);
    const [aboutImageMode, setAboutImageMode] = useState<'upload' | 'url'>('url');
    const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
    const [aboutImageUrl, setAboutImageUrl] = useState('');
    const [aboutMission, setAboutMission] = useState('');
    const [aboutDescription, setAboutDescription] = useState('');
    const [aboutExecs, setAboutExecs] = useState<Exec[]>([]);

    const aboutImagePreview = aboutImageMode === 'url'
        ? aboutImageUrl
        : aboutImageFile ? URL.createObjectURL(aboutImageFile) : aboutImageUrl;

    const dndSensors = useSensors(useSensor(PointerSensor));

    // Sponsors tab state
    type SponsorDraft = SponsorItem & { imageMode: 'url' | 'upload'; imageFile: File | null };
    const [sponsorsLoaded, setSponsorsLoaded] = useState(false);
    const [sponsorsSaving, setSponsorsSaving] = useState(false);
    const [sponsorsPackagePdfUrl, setSponsorsPackagePdfUrl] = useState('');
    const [sponsorsList, setSponsorsList] = useState<SponsorDraft[]>([]);
    const [sponsorsTiers, setSponsorsTiers] = useState<SponsorsTableTier[]>([]);
    const [sponsorsTableRows, setSponsorsTableRows] = useState<SponsorsTableRow[]>([]);

    // Links tab state
    const [linksLoaded, setLinksLoaded] = useState(false);
    const [linksSaving, setLinksSaving] = useState(false);
    const [linksEmail, setLinksEmail] = useState('');
    const [linksMembershipFormUrl, setLinksMembershipFormUrl] = useState('');
    const [linksSocials, setLinksSocials] = useState<Social[]>([]);
    const [linksResourceSections, setLinksResourceSections] = useState<ResourceSection[]>([]);

    // Object URL for previewing an uploaded file — revoked when file changes
    const filePreviewUrl = useMemo(() => {
        if (bannerFile) return URL.createObjectURL(bannerFile);
        return null;
    }, [bannerFile]);

    const previewBannerUrl = bannerMode === 'url'
        ? bannerUrlInput
        : filePreviewUrl ?? editingArticle?.bannerUrl ?? '';

    useEffect(() => {
        if (isAuthenticated) loadArticles();
    }, [isAuthenticated]);

    const loadArticles = async () => {
        try {
            setLoadingArticles(true);
            const data = await fetchNews(50);
            setArticles(data.items);
            setNextKey(data.nextKey);
        } catch (error) {
            toast.error('Failed to load articles');
            console.error('Error loading articles:', error);
        } finally {
            setLoadingArticles(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (response.ok) {
                toast.success('Login successful!');
                window.location.reload();
            } else {
                toast.error('Invalid password');
            }
        } catch {
            toast.error('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setBannerFile(e.target.files[0]);
    };

    useEffect(() => {
        if (activeTab === 'about' && !aboutLoaded) {
            fetch('/api/about')
                .then(r => r.json())
                .then(d => {
                    setAboutImageUrl(d.imageUrl ?? '');
                    setAboutImageMode(d.imageUrl ? 'url' : 'upload');
                    setAboutMission(d.missionStatement ?? '');
                    setAboutDescription(d.description ?? '');
                    setAboutExecs(d.execs ?? []);
                    setAboutLoaded(true);
                })
                .catch(() => toast.error('Failed to load about data'));
        }
    }, [activeTab, aboutLoaded]);

    useEffect(() => {
        if (activeTab === 'home' && !homeLoaded) {
            fetch('/api/home')
                .then(r => r.json())
                .then(d => {
                    setHomeBannerUrl(d.bannerImageUrl ?? '');
                    setHomeBannerMode('url');
                    setHomeCaption(d.bannerCaption ?? '');
                    setHomeImageCreditTitle(d.imageCreditTitle ?? '');
                    setHomeImageCreditLine(d.imageCreditLine ?? '');
                    setHomeQuote(d.quote ?? '');
                    setHomeEventCards((d.eventCards ?? []).map((c: HomeEventCard) => ({ ...c, imageMode: 'url' as const, imageFile: null })));
                    setHomeLoaded(true);
                })
                .catch(() => toast.error('Failed to load home data'));
        }
    }, [activeTab, homeLoaded]);

    const handleSaveHome = async (e: React.FormEvent) => {
        e.preventDefault();
        setHomeSaving(true);
        try {
            let bannerImageUrl = homeBannerUrl;
            if (homeBannerMode === 'upload' && homeBannerFile) {
                toast.info('Uploading banner…');
                bannerImageUrl = await uploadImage(homeBannerFile);
                setHomeBannerUrl(bannerImageUrl);
            }
            const resolvedCards = await Promise.all(homeEventCards.map(async c => {
                if (c.imageMode === 'upload' && c.imageFile) {
                    toast.info(`Uploading image for ${c.title}…`);
                    const url = await uploadImage(c.imageFile);
                    return { id: c.id, title: c.title, description: c.description, imageUrl: url };
                }
                return { id: c.id, title: c.title, description: c.description, imageUrl: c.imageUrl };
            }));
            const res = await fetch('/api/home', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerImageUrl, bannerCaption: homeCaption, imageCreditTitle: homeImageCreditTitle, imageCreditLine: homeImageCreditLine, quote: homeQuote, eventCards: resolvedCards }),
            });
            if (!res.ok) throw new Error('Failed to save');
            setHomeEventCards(resolvedCards.map(c => ({ ...c, imageMode: 'url' as const, imageFile: null })));
            toast.success('Home page saved');
        } catch {
            toast.error('Failed to save home page');
        } finally {
            setHomeSaving(false);
        }
    };

    const handleEventCardDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setHomeEventCards(prev => {
                const oi = prev.findIndex(c => c.id === active.id);
                const ni = prev.findIndex(c => c.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
    };

    const handleSaveAbout = async (e: React.FormEvent) => {
        e.preventDefault();
        setAboutSaving(true);
        let imageUrl = aboutImageUrl;
        if (aboutImageMode === 'upload' && aboutImageFile) {
            try {
                toast.info('Uploading image...');
                imageUrl = await uploadImage(aboutImageFile);
                setAboutImageUrl(imageUrl);
            } catch (error) {
                toast.error('Image upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                setAboutSaving(false);
                return;
            }
        }
        try {
            const res = await fetch('/api/about', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl, missionStatement: aboutMission, description: aboutDescription, execs: aboutExecs }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('About page saved');
        } catch {
            toast.error('Failed to save about page');
        } finally {
            setAboutSaving(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'links' && !linksLoaded) {
            fetch('/api/links')
                .then(r => r.json())
                .then(d => {
                    setLinksEmail(d.email ?? '');
                    setLinksMembershipFormUrl(d.membershipFormUrl ?? '');
                    setLinksSocials(d.socials ?? []);
                    setLinksResourceSections(d.resourceSections ?? []);
                    setLinksLoaded(true);
                })
                .catch(() => toast.error('Failed to load links data'));
        }
    }, [activeTab, linksLoaded]);

    const handleSaveLinks = async (e: React.FormEvent) => {
        e.preventDefault();
        setLinksSaving(true);
        try {
            const res = await fetch('/api/links', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: linksEmail,
                    membershipFormUrl: linksMembershipFormUrl,
                    socials: linksSocials,
                    resourceSections: linksResourceSections,
                }),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Links saved');
        } catch {
            toast.error('Failed to save links');
        } finally {
            setLinksSaving(false);
        }
    };

    const handleSocialDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLinksSocials(prev => {
                const oldIndex = prev.findIndex(s => s.id === active.id);
                const newIndex = prev.findIndex(s => s.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const handleSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLinksResourceSections(prev => {
                const oldIndex = prev.findIndex(s => s.id === active.id);
                const newIndex = prev.findIndex(s => s.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const handleLinkDragEnd = (sectionIndex: number, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setLinksResourceSections(prev => prev.map((sec, i) => {
                if (i !== sectionIndex) return sec;
                const oldIndex = sec.links.findIndex(l => l.id === active.id);
                const newIndex = sec.links.findIndex(l => l.id === over.id);
                return { ...sec, links: arrayMove(sec.links, oldIndex, newIndex) };
            }));
        }
    };

    useEffect(() => {
        if (activeTab === 'sponsors' && !sponsorsLoaded) {
            fetch('/api/sponsors')
                .then(r => r.json())
                .then(d => {
                    setSponsorsPackagePdfUrl(d.packagePdfUrl ?? '');
                    setSponsorsList((d.sponsors ?? []).map((s: SponsorItem) => ({ ...s, imageMode: 'url' as const, imageFile: null })));
                    setSponsorsTiers(d.tiers ?? []);
                    setSponsorsTableRows(d.tableRows ?? []);
                    setSponsorsLoaded(true);
                })
                .catch(() => toast.error('Failed to load sponsors data'));
        }
    }, [activeTab, sponsorsLoaded]);

    const handleSaveSponsors = async (e: React.FormEvent) => {
        e.preventDefault();
        setSponsorsSaving(true);
        try {
            // Upload any file-mode sponsor images
            const resolvedSponsors = await Promise.all(sponsorsList.map(async s => {
                if (s.imageMode === 'upload' && s.imageFile) {
                    toast.info(`Uploading image for ${s.name || 'sponsor'}…`);
                    const url = await uploadImage(s.imageFile);
                    return { id: s.id, name: s.name, badge: s.badge, imageUrl: url, description: s.description };
                }
                return { id: s.id, name: s.name, badge: s.badge, imageUrl: s.imageUrl, description: s.description };
            }));
            const res = await fetch('/api/sponsors', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packagePdfUrl: sponsorsPackagePdfUrl, sponsors: resolvedSponsors, tiers: sponsorsTiers, tableRows: sponsorsTableRows }),
            });
            if (!res.ok) throw new Error('Failed to save');
            // Update local state with resolved URLs so file previews reflect uploads
            setSponsorsList(resolvedSponsors.map(s => ({ ...s, imageMode: 'url' as const, imageFile: null })));
            toast.success('Sponsors saved');
        } catch {
            toast.error('Failed to save sponsors');
        } finally {
            setSponsorsSaving(false);
        }
    };

    const handleSponsorDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSponsorsList(prev => {
                const oi = prev.findIndex(s => s.id === active.id);
                const ni = prev.findIndex(s => s.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
    };

    const handleTierDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSponsorsTiers(prev => {
                const oi = prev.findIndex(t => t.id === active.id);
                const ni = prev.findIndex(t => t.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
    };

    const handleBenefitDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSponsorsTableRows(prev => {
                const oi = prev.findIndex(r => r.id === active.id);
                const ni = prev.findIndex(r => r.id === over.id);
                return arrayMove(prev, oi, ni);
            });
        }
    };

    const addSponsorTier = () => {
        const id = uid();
        setSponsorsTiers(prev => [...prev, { id, name: '', price: '' }]);
        setSponsorsTableRows(prev => prev.map(r => ({ ...r, checks: { ...r.checks, [id]: false } })));
    };

    const removeSponsorTier = (index: number) => {
        const tierId = sponsorsTiers[index].id;
        setSponsorsTiers(prev => prev.filter((_, i) => i !== index));
        setSponsorsTableRows(prev => prev.map(r => {
            const { [tierId]: _removed, ...rest } = r.checks;
            return { ...r, checks: rest };
        }));
    };

    const handleExecDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setAboutExecs(execs => {
                const oldIndex = execs.findIndex((_, i) => String(i) === active.id);
                const newIndex = execs.findIndex((_, i) => String(i) === over.id);
                return arrayMove(execs, oldIndex, newIndex);
            });
        }
    };

    const resetBannerState = () => {
        setBannerFile(null);
        setBannerMode('upload');
        setBannerUrlInput('');
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let bannerUrl = '';

        if (bannerMode === 'url') {
            bannerUrl = bannerUrlInput;
        } else if (bannerFile) {
            try {
                toast.info('Uploading image...');
                bannerUrl = await uploadImage(bannerFile);
            } catch (error) {
                toast.error('Image upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                setIsSubmitting(false);
                return;
            }
        }

        try {
            toast.info('Creating post...');
            await createPost({ key: postKey, title, content, bannerUrl });
            toast.success('Post created successfully!');
            setPostKey('');
            setTitle('');
            setContent('');
            resetBannerState();
            setIsDialogOpen(false);
            loadArticles();
        } catch (error) {
            toast.error('Failed to create post: ' + (error instanceof Error ? error.message : 'Unknown error'));
            console.error('Error creating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (article: Article) => setArticleToDelete(article);

    const handleConfirmDelete = async () => {
        if (!articleToDelete) return;
        try {
            const res = await fetch(`/api/posts/${encodeURIComponent(articleToDelete.key)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            const { warning } = await res.json();
            if (warning) toast.warning(warning);
            else toast.success('Post deleted');
            setArticles(prev => prev.filter(a => a.key !== articleToDelete.key));
        } catch {
            toast.error('Failed to delete post');
        } finally {
            setArticleToDelete(null);
        }
    };

    const handleEditClick = async (article: Article) => {
        const fullArticle = await getArticle(article.key);
        if (!fullArticle) {
            toast.error('Failed to load article for editing');
            return;
        }
        setEditingArticle(article);
        setTitle(article.title);
        setContent(fullArticle.content);
        setBannerFile(null);
        setBannerMode('url');
        setBannerUrlInput(article.bannerUrl);
        setIsEditDialogOpen(true);
    };

    const handleEditPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingArticle) return;
        setIsSubmitting(true);

        let bannerUrl = editingArticle.bannerUrl;

        if (bannerMode === 'url') {
            bannerUrl = bannerUrlInput;
        } else if (bannerFile) {
            try {
                toast.info('Uploading image...');
                bannerUrl = await uploadImage(bannerFile);
            } catch (error) {
                toast.error('Image upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                setIsSubmitting(false);
                return;
            }
        }

        try {
            toast.info('Updating post...');
            await editArticle(editingArticle.key, { title, content, bannerUrl });
            toast.success('Post updated successfully!');
            setEditingArticle(null);
            setTitle('');
            setContent('');
            resetBannerState();
            setIsEditDialogOpen(false);
            loadArticles();
        } catch (error) {
            toast.error('Failed to update post: ' + (error instanceof Error ? error.message : 'Unknown error'));
            console.error('Error updating post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const BannerField = ({ disabled }: { disabled: boolean }) => (
        <div className="space-y-3">
            <Label>Banner Image</Label>
            <RadioGroup
                value={bannerMode}
                onValueChange={(v) => setBannerMode(v as 'upload' | 'url')}
                className="flex gap-4"
                disabled={disabled}
            >
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="upload" id="mode-upload" />
                    <Label htmlFor="mode-upload" className="cursor-pointer font-normal">Upload file</Label>
                </div>
                <div className="flex items-center gap-2">
                    <RadioGroupItem value="url" id="mode-url" />
                    <Label htmlFor="mode-url" className="cursor-pointer font-normal">Image URL</Label>
                </div>
            </RadioGroup>
            {bannerMode === 'upload' ? (
                <Input type="file" accept="image/*" onChange={handleFileChange} disabled={disabled} />
            ) : (
                <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={bannerUrlInput}
                    onChange={(e) => setBannerUrlInput(e.target.value)}
                    disabled={disabled}
                />
            )}
        </div>
    );

    const PreviewPanel = () => (
        <div className="space-y-4">
            {previewBannerUrl ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewBannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="w-full h-48 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-sm">
                    No banner image
                </div>
            )}
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {content ? (
                <div className="prose prose-invert max-w-none text-sm">
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            ) : (
                <p className="text-gray-500 text-sm">No content yet.</p>
            )}
        </div>
    );

    if (!isAuthenticated) {
        return (
            <div className='max-w-7xl mx-auto'>
                <Navbar />
                <div className="container flex flex-col items-center justify-center min-h-screen px-4 py-8">
                    <div className="w-full max-w-md space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold">Admin Login</h1>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className="w-full"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const sidebarItems = [
        { id: 'home',     label: 'Home',     icon: Home      },
        { id: 'news',     label: 'News',     icon: Newspaper },
        { id: 'about',    label: 'About',    icon: Info      },
        { id: 'links',    label: 'Links',    icon: Link      },
        { id: 'sponsors', label: 'Sponsors', icon: HandCoins },
    ] as const;

    return (
        <div className='flex flex-col min-h-screen'>
            <Navbar />
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="w-52 border-r border-gray-800 flex flex-col p-3 gap-1 shrink-0">
                    <div className="text-md font-semibold self-center">Admin Dashboard</div>
                    {sidebarItems.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                                activeTab === id
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                        </button>
                    ))}
                    <Separator className="my-1 bg-gray-800" />
                    <button
                        onClick={() => setActiveTab('help')}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                            activeTab === 'help'
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <HelpCircle className="h-4 w-4 shrink-0" />
                        Help
                    </button>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {activeTab === 'home' && (
                        <form onSubmit={handleSaveHome} className="max-w-3xl mx-auto flex flex-col gap-6">
                            {/* Banner image */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Banner Image</Label>
                                <RadioGroup value={homeBannerMode} onValueChange={v => setHomeBannerMode(v as 'url' | 'upload')} className="flex gap-4" disabled={homeSaving}>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="url" id="hb-url" /><Label htmlFor="hb-url" className="font-normal cursor-pointer">Image URL</Label></div>
                                    <div className="flex items-center gap-2"><RadioGroupItem value="upload" id="hb-upload" /><Label htmlFor="hb-upload" className="font-normal cursor-pointer">Upload file</Label></div>
                                </RadioGroup>
                                {homeBannerMode === 'url'
                                    ? <Input placeholder="/banner-nov.jpg or https://..." value={homeBannerUrl} onChange={e => setHomeBannerUrl(e.target.value)} disabled={homeSaving} />
                                    : <Input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) setHomeBannerFile(e.target.files[0]); }} disabled={homeSaving} />
                                }
                                {homeBannerPreview && <img src={homeBannerPreview} alt="Banner preview" className="w-full max-h-40 object-cover rounded-lg" />}
                            </div>

                            {/* Caption */}
                            <div className="space-y-2">
                                <Label htmlFor="home-caption" className="text-base font-semibold">Banner Caption</Label>
                                <p className="text-xs text-gray-500">The subtitle line shown below the title on the banner image.</p>
                                <Input id="home-caption" value={homeCaption} onChange={e => setHomeCaption(e.target.value)} disabled={homeSaving} placeholder="UofT's astronomy outreach club" />
                            </div>

                            {/* Image credits */}
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Image Credits</Label>
                                <p className="text-xs text-gray-500">Shown in the bottom-right of the banner. Leave both blank to hide.</p>
                                <Input value={homeImageCreditTitle} onChange={e => setHomeImageCreditTitle(e.target.value)} disabled={homeSaving} placeholder="NGC2244 - Rosette Nebula" />
                                <Input value={homeImageCreditLine} onChange={e => setHomeImageCreditLine(e.target.value)} disabled={homeSaving} placeholder="Credit: Gavin Farley @gaviniwnl" />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Quote */}
                            <div className="space-y-2">
                                <Label htmlFor="home-quote" className="text-base font-semibold">Quote Box</Label>
                                <Textarea id="home-quote" rows={4} value={homeQuote} onChange={e => setHomeQuote(e.target.value)} disabled={homeSaving} />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Event cards */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Event Cards</Label>
                                    <Button type="button" variant="outline" size="sm" disabled={homeSaving}
                                        onClick={() => setHomeEventCards(prev => [...prev, { id: uid(), title: '', description: '', imageUrl: '', imageMode: 'url', imageFile: null }])}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                    </Button>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleEventCardDragEnd}>
                                    <SortableContext items={homeEventCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-3">
                                            {homeEventCards.map((card, i) => (
                                                <SortableEventCardRow
                                                    key={card.id}
                                                    card={card}
                                                    index={i}
                                                    disabled={homeSaving}
                                                    onChange={(idx, patch) => setHomeEventCards(prev => prev.map((c, j) => j === idx ? { ...c, ...patch } : c))}
                                                    onRemove={idx => setHomeEventCards(prev => prev.filter((_, j) => j !== idx))}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={homeSaving}>{homeSaving ? 'Saving…' : 'Save Changes'}</Button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'news' && (
                        <div className="max-w-3xl mx-auto flex flex-col gap-5">
                            <Alert className='bg-transparent border border-gray-700'>
                                <InfoIcon className="h-5 w-5 text-white" />
                                <AlertTitle className="text-white">Use the button below to create a new post for the news section.</AlertTitle>
                                <AlertDescription>
                                    Markdown is supported - i.e. *use this for italics*, **this for bold**, and [links](https://example.com).
                                </AlertDescription>
                            </Alert>
                            <div>
                                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                                    if (!open) { setPostKey(''); setTitle(''); setContent(''); resetBannerState(); }
                                    setIsDialogOpen(open);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button><span className="mr-2">+</span> Create Post</Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Create New Post</DialogTitle>
                                            <DialogDescription>Fill in the details to create a new post</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleCreatePost} className="space-y-4">
                                            <Tabs defaultValue="edit">
                                                <TabsList className="w-full">
                                                    <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                                                    <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                                                </TabsList>
                                                <TabsContent forceMount value="edit" className="space-y-4 mt-4 data-[state=inactive]:hidden">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="postKey">Post Key <span className="text-sm text-gray-400">(will show up in the URL)</span></Label>
                                                        <Input
                                                            id="postKey"
                                                            placeholder="unique-post-key"
                                                            value={postKey}
                                                            onChange={(e) => setPostKey(e.target.value)}
                                                            required
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="title">Title</Label>
                                                        <Input
                                                            id="title"
                                                            placeholder="Post title"
                                                            value={title}
                                                            onChange={(e) => setTitle(e.target.value)}
                                                            required
                                                            disabled={isSubmitting}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="content">Content</Label>
                                                        <Textarea
                                                            id="content"
                                                            placeholder="Post content..."
                                                            value={content}
                                                            onChange={(e) => setContent(e.target.value)}
                                                            required
                                                            disabled={isSubmitting}
                                                            rows={8}
                                                        />
                                                    </div>
                                                    <BannerField disabled={isSubmitting} />
                                                </TabsContent>
                                                <TabsContent forceMount value="preview" className="mt-4 data-[state=inactive]:hidden">
                                                    <PreviewPanel />
                                                </TabsContent>
                                            </Tabs>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={isSubmitting}>
                                                    {isSubmitting ? 'Creating...' : 'Create Post'}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="space-y-4">
                                <div className="text-2xl font-semibold">All Articles</div>
                                {loadingArticles ? (
                                    <div className="text-center py-8">Loading articles...</div>
                                ) : (
                                    <div className="space-y-2">
                                        {articles.map((article) => (
                                            <div
                                                key={article.key}
                                                className="flex items-center gap-4 p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                                            >
                                                <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                                                    <Image src={article.bannerUrl} alt={article.title} fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold truncate">{article.title}</h3>
                                                    <p className="text-sm text-gray-400 truncate">{article.content}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleEditClick(article)} className="flex-shrink-0">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(article)}
                                                    className="flex-shrink-0 text-primary hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'about' && (
                        <form onSubmit={handleSaveAbout} className="max-w-3xl mx-auto flex flex-col gap-6">
                            {/* Image */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Team Photo</Label>
                                <RadioGroup
                                    value={aboutImageMode}
                                    onValueChange={v => setAboutImageMode(v as 'upload' | 'url')}
                                    className="flex gap-4"
                                    disabled={aboutSaving}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="url" id="about-mode-url" />
                                        <Label htmlFor="about-mode-url" className="cursor-pointer font-normal">Image URL</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="upload" id="about-mode-upload" />
                                        <Label htmlFor="about-mode-upload" className="cursor-pointer font-normal">Upload file</Label>
                                    </div>
                                </RadioGroup>
                                {aboutImageMode === 'url' ? (
                                    <Input
                                        type="url"
                                        placeholder="https://example.com/team.jpg"
                                        value={aboutImageUrl}
                                        onChange={e => setAboutImageUrl(e.target.value)}
                                        disabled={aboutSaving}
                                    />
                                ) : (
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => { if (e.target.files?.[0]) setAboutImageFile(e.target.files[0]); }}
                                        disabled={aboutSaving}
                                    />
                                )}
                                {aboutImagePreview && (
                                    <img src={aboutImagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                                )}
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Mission statement */}
                            <div className="space-y-2">
                                <Label htmlFor="about-mission" className="text-base font-semibold">Mission Statement</Label>
                                <Textarea
                                    id="about-mission"
                                    rows={3}
                                    value={aboutMission}
                                    onChange={e => setAboutMission(e.target.value)}
                                    disabled={aboutSaving}
                                />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="about-description" className="text-base font-semibold">Description</Label>
                                <p className="text-xs text-gray-500">Separate paragraphs with a blank line.</p>
                                <Textarea
                                    id="about-description"
                                    rows={6}
                                    value={aboutDescription}
                                    onChange={e => setAboutDescription(e.target.value)}
                                    disabled={aboutSaving}
                                />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Exec list */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Executive Team</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAboutExecs(prev => [...prev, { title: '', name: '' }])}
                                        disabled={aboutSaving}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="flex text-xs text-gray-500 px-6 gap-2">
                                    <span className="flex-1">Title</span>
                                    <span className="flex-1">Name</span>
                                    <span className="w-4" />
                                </div>
                                <DndContext
                                    sensors={dndSensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleExecDragEnd}
                                >
                                    <SortableContext
                                        items={aboutExecs.map((_, i) => String(i))}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="flex flex-col gap-2">
                                            {aboutExecs.map((exec, i) => (
                                                <SortableExecRow
                                                    key={i}
                                                    id={String(i)}
                                                    exec={exec}
                                                    index={i}
                                                    disabled={aboutSaving}
                                                    onChange={(idx, field, val) =>
                                                        setAboutExecs(prev => prev.map((e, j) => j === idx ? { ...e, [field]: val } : e))
                                                    }
                                                    onRemove={idx =>
                                                        setAboutExecs(prev => prev.filter((_, j) => j !== idx))
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={aboutSaving}>
                                    {aboutSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'links' && (
                        <form onSubmit={handleSaveLinks} className="max-w-3xl mx-auto flex flex-col gap-6">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="links-email" className="text-base font-semibold">Email</Label>
                                <Input id="links-email" type="email" value={linksEmail} onChange={e => setLinksEmail(e.target.value)} disabled={linksSaving} />
                            </div>

                            {/* Membership URL */}
                            <div className="space-y-2">
                                <Label htmlFor="links-membership" className="text-base font-semibold">Membership Form</Label>
                                <p className="text-xs text-gray-500">Paste the Google Forms embed URL (the src of the iframe).</p>
                                <Input id="links-membership" placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true" value={linksMembershipFormUrl} onChange={e => setLinksMembershipFormUrl(e.target.value)} disabled={linksSaving} />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Socials */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Socials</Label>
                                    <Button
                                        type="button" variant="outline" size="sm" disabled={linksSaving}
                                        onClick={() => setLinksSocials(prev => [...prev, { id: uid(), name: '', icon: 'discord', url: '', isNew: false }])}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="flex text-xs text-gray-500 gap-2 pl-6">
                                    <span className="w-32 shrink-0">Icon</span>
                                    <span className="w-28 shrink-0">Name</span>
                                    <span className="flex-1">URL</span>
                                    <span className="w-12">New?</span>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSocialDragEnd}>
                                    <SortableContext items={linksSocials.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-2">
                                            {linksSocials.map((social, i) => (
                                                <SortableSocialRow
                                                    key={social.id}
                                                    social={social}
                                                    index={i}
                                                    disabled={linksSaving}
                                                    onChange={(idx, patch) => setLinksSocials(prev => prev.map((s, j) => j === idx ? { ...s, ...patch } : s))}
                                                    onRemove={idx => setLinksSocials(prev => prev.filter((_, j) => j !== idx))}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Organizations / Resources */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Organizations / Resources</Label>
                                    <Button
                                        type="button" variant="outline" size="sm" disabled={linksSaving}
                                        onClick={() => setLinksResourceSections(prev => [...prev, { id: uid(), header: '', links: [] }])}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add section
                                    </Button>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
                                    <SortableContext items={linksResourceSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-3">
                                            {linksResourceSections.map((section, si) => (
                                                <SortableResourceSectionBlock
                                                    key={section.id}
                                                    section={section}
                                                    sectionIndex={si}
                                                    disabled={linksSaving}
                                                    onChangeHeader={(i, val) => setLinksResourceSections(prev => prev.map((s, j) => j === i ? { ...s, header: val } : s))}
                                                    onRemoveSection={i => setLinksResourceSections(prev => prev.filter((_, j) => j !== i))}
                                                    onChangeLink={(si, li, patch) => setLinksResourceSections(prev => prev.map((s, j) => j !== si ? s : { ...s, links: s.links.map((l, k) => k === li ? { ...l, ...patch } : l) }))}
                                                    onRemoveLink={(si, li) => setLinksResourceSections(prev => prev.map((s, j) => j !== si ? s : { ...s, links: s.links.filter((_, k) => k !== li) }))}
                                                    onAddLink={si => setLinksResourceSections(prev => prev.map((s, j) => j !== si ? s : { ...s, links: [...s.links, { id: uid(), label: '', url: '' }] }))}
                                                    onLinkDragEnd={handleLinkDragEnd}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={linksSaving}>
                                    {linksSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'sponsors' && (
                        <form onSubmit={handleSaveSponsors} className="max-w-3xl mx-auto flex flex-col gap-6">

                            {/* Package PDF URL */}
                            <div className="space-y-2">
                                <Label htmlFor="sp-pdf" className="text-base font-semibold">Sponsorship Package PDF URL</Label>
                                <Input id="sp-pdf" placeholder="/sponsorship.pdf" value={sponsorsPackagePdfUrl} onChange={e => setSponsorsPackagePdfUrl(e.target.value)} disabled={sponsorsSaving} />
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Sponsors list */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Current Sponsors</Label>
                                    <Button type="button" variant="outline" size="sm" disabled={sponsorsSaving}
                                        onClick={() => setSponsorsList(prev => [...prev, { id: uid(), name: '', badge: '', imageUrl: '', description: '', imageMode: 'url', imageFile: null }])}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                    </Button>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSponsorDragEnd}>
                                    <SortableContext items={sponsorsList.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-3">
                                            {sponsorsList.map((sponsor, i) => (
                                                <SortableSponsorCard
                                                    key={sponsor.id}
                                                    sponsor={sponsor}
                                                    index={i}
                                                    disabled={sponsorsSaving}
                                                    onChange={(idx, patch) => setSponsorsList(prev => prev.map((s, j) => j === idx ? { ...s, ...patch } : s))}
                                                    onRemove={idx => setSponsorsList(prev => prev.filter((_, j) => j !== idx))}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Sponsorship tiers (table columns) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Sponsorship Tiers</Label>
                                    <Button type="button" variant="outline" size="sm" disabled={sponsorsSaving} onClick={addSponsorTier}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add tier
                                    </Button>
                                </div>
                                <div className="flex text-xs text-gray-500 gap-2 pl-6">
                                    <span className="flex-1">Name</span><span className="w-24">Price</span>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleTierDragEnd}>
                                    <SortableContext items={sponsorsTiers.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-2">
                                            {sponsorsTiers.map((tier, i) => (
                                                <SortableTierRow
                                                    key={tier.id} tier={tier} index={i} disabled={sponsorsSaving}
                                                    onChange={(idx, patch) => setSponsorsTiers(prev => prev.map((t, j) => j === idx ? { ...t, ...patch } : t))}
                                                    onRemove={removeSponsorTier}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <Separator className="bg-gray-800" />

                            {/* Benefit rows */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-semibold">Benefits Table</Label>
                                    <Button type="button" variant="outline" size="sm" disabled={sponsorsSaving}
                                        onClick={() => setSponsorsTableRows(prev => [...prev, {
                                            id: uid(), benefit: '',
                                            checks: Object.fromEntries(sponsorsTiers.map(t => [t.id, false])),
                                        }])}>
                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add row
                                    </Button>
                                </div>
                                <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleBenefitDragEnd}>
                                    <SortableContext items={sponsorsTableRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                        <div className="flex flex-col gap-2">
                                            {sponsorsTableRows.map((row, i) => (
                                                <SortableBenefitRow
                                                    key={row.id} row={row} tiers={sponsorsTiers} index={i} disabled={sponsorsSaving}
                                                    onChange={(idx, patch) => setSponsorsTableRows(prev => prev.map((r, j) => j === idx ? { ...r, ...patch } : r))}
                                                    onRemove={idx => setSponsorsTableRows(prev => prev.filter((_, j) => j !== idx))}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={sponsorsSaving}>
                                    {sponsorsSaving ? 'Saving…' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                    {activeTab === 'help' &&
                        <div className="max-w-3xl mx-auto flex flex-col gap-2">
                            <div className="text-lg font-semibold mb-2">About the admin dashboard</div>
                            <span className="text-gray-400">Everything that is customizeable is managed through this page. Once editing is complete, remember to save your changes (this is not needed for the news page). Note that the changes may take several minutes to be reflected.</span>
                            <span className="text-gray-400">The website was initially created by me (York). If you'd like to make any changes outside of what's already customizeable, or if there are any issues, please feel free to contact me <a href="https://yorkng.com/asx" className="text-primary hover:underline">here</a>.</span>
                        </div>
                    }
                </main>
            </div>

            {/* Edit dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open) { setEditingArticle(null); setTitle(''); setContent(''); resetBannerState(); }
                setIsEditDialogOpen(open);
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                        <DialogDescription>Update the post details</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditPost} className="space-y-4">
                        <Tabs defaultValue="edit">
                            <TabsList className="w-full">
                                <TabsTrigger value="edit" className="flex-1">Edit</TabsTrigger>
                                <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                            </TabsList>
                            <TabsContent value="edit" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">Title</Label>
                                    <Input
                                        id="edit-title"
                                        placeholder="Post title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-content">Content</Label>
                                    <Textarea
                                        id="edit-content"
                                        placeholder="Post content..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        rows={8}
                                    />
                                </div>
                                <BannerField disabled={isSubmitting} />
                            </TabsContent>
                            <TabsContent value="preview" className="mt-4">
                                <PreviewPanel />
                            </TabsContent>
                        </Tabs>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Post'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!articleToDelete} onOpenChange={(open) => { if (!open) setArticleToDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{articleToDelete?.title}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Footer />
        </div>
    );
}
