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
import { InfoIcon, Link, Newspaper, HelpCircle, Info, HandCoins, Pencil, Trash2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Article, editArticle, fetchNews, getArticle } from './api/news';
import { createPost, uploadImage } from '@/utils/postnews';

interface AdminProps {
  isAuthenticated: boolean;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req } = context;
    const token = req.cookies['admin-token'] || '';
    const isAuthenticated = verifyToken(token);
    return { props: { isAuthenticated } };
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

    const [activeTab, setActiveTab] = useState<'news' | 'about' | 'links' | 'sponsors' | 'help'>('news');

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
                                                <TabsContent value="edit" className="space-y-4 mt-4">
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
                                                <TabsContent value="preview" className="mt-4">
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
                    {activeTab === 'about' && <div className="text-gray-400">About content coming soon.</div>}
                    {activeTab === 'links' && <div className="text-gray-400">Links content coming soon.</div>}
                    {activeTab === 'sponsors' && <div className="text-gray-400">Sponsors content coming soon.</div>}
                    {activeTab === 'help' && <div className="text-gray-400">Help content coming soon.</div>}
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
