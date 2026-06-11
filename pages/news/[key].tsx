import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getArticleBlob, type Article } from '@/utils/storage';
import Markdown from 'react-markdown';

interface ArticlePageProps {
    article?: Article;
    error?: string;
}

function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    });
}

export default function ArticlePage({ article, error }: ArticlePageProps) {
    const router = useRouter();
    const { key } = router.query;

    if (error) {
        return (
            <div className='max-w-7xl mx-auto'>
                <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
                    <Navbar />
                    <div className='w-full flex-grow flex items-center justify-center'>
                        <div className="text-center">
                            <div className="text-xl text-red-500 mb-4">Article Not Found</div>
                            <div className="text-gray-600 mb-4">{error}</div>
                            <Link href="/news">
                                <Button>Back to News</Button>
                            </Link>
                        </div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className='max-w-7xl mx-auto'>
                <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
                    <Navbar />
                    <div className='w-full flex-grow flex items-center justify-center'>
                        <div className="text-xl">Loading article...</div>
                    </div>
                    <Footer />
                </div>
            </div>
        );
    }

    return (
        <div className='max-w-7xl mx-auto'>
            <Navbar />
            <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
                <div className='w-full flex-grow flex flex-col gap-8 px-4 max-w-4xl mx-auto'>
                    {/* Back to News Link */}
                    <Link 
                        href="/news" 
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors duration-200 w-fit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to News
                    </Link>

                    {/* Article Content */}
                    <article className="flex flex-col gap-8">
                        {/* Article Header */}
                        <header className="flex flex-col gap-4">
                            <div className="text-sm text-secondary/80 font-medium tracking-wide">
                                {formatTimestamp(article.timestamp)}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                                {article.title}
                            </h1>
                        </header>

                        {/* Article Image */}
                        <div className="w-full h-64 md:h-96 lg:max-h-[500px] overflow-hidden rounded-xl relative">
                            <Image 
                                src={article.bannerUrl} 
                                alt={article.title} 
                                fill
                                className="object-cover" 
                                priority
                            />
                        </div>

                        {/* Article Body */}
                        <div className="markdown-content max-w-none">
                            <div className="text-lg md:text-xl leading-relaxed">
                                <Markdown
                                    components={{
                                        h1: ({children}) => <h1 className="text-3xl md:text-4xl font-bold mt-8 mb-4 text-foreground">{children}</h1>,
                                        h2: ({children}) => <h2 className="text-2xl md:text-3xl font-bold mt-6 mb-3 text-foreground">{children}</h2>,
                                        h3: ({children}) => <h3 className="text-xl md:text-2xl font-semibold mt-5 mb-3 text-foreground">{children}</h3>,
                                        h4: ({children}) => <h4 className="text-lg md:text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h4>,
                                        h5: ({children}) => <h5 className="text-base md:text-lg font-semibold mt-3 mb-2 text-foreground">{children}</h5>,
                                        h6: ({children}) => <h6 className="text-sm md:text-base font-semibold mt-3 mb-2 text-foreground">{children}</h6>,
                                        p: ({children}) => <p className="mb-4 text-foreground/90 leading-relaxed">{children}</p>,
                                        a: ({href, children}) => (
                                            <a 
                                                href={href} 
                                                className="text-primary hover:text-primary/80 underline decoration-primary/50 hover:decoration-primary transition-colors duration-200"
                                                target={href?.startsWith('http') ? '_blank' : undefined}
                                                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                            >
                                                {children}
                                            </a>
                                        ),
                                        ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                                        li: ({children}) => <li className="text-foreground/90">{children}</li>,
                                        blockquote: ({children}) => (
                                            <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-muted/30 italic text-foreground/90">
                                                {children}
                                            </blockquote>
                                        ),
                                        code: ({children}) => (
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                                                {children}
                                            </code>
                                        ),
                                        pre: ({children}) => (
                                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                                                {children}
                                            </pre>
                                        ),
                                        strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                                        em: ({children}) => <em className="italic text-foreground">{children}</em>,
                                        hr: () => <hr className="my-8 border-border" />,
                                    }}
                                >
                                    {article.content}
                                </Markdown>
                            </div>
                        </div>

                        {/* Article Footer */}
                        <footer className="border-t border-gray-700/50 pt-8 mt-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-foreground/60">
                                    Published on {formatTimestamp(article.timestamp)}
                                </div>
                                <div className="flex gap-3">
                                    {/* <Link href="/news">
                                        <Button variant="outline" className="border-gray-700/50 hover:border-gray-600">
                                            More News
                                        </Button>
                                    </Link> */}
                                    <Button 
                                        onClick={() => router.back()}
                                        className="bg-primary hover:bg-primary/90 text-black"
                                    >
                                        Return
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </article>
                </div>
                <Footer />
            </div>
        </div>
    );
}

import { getIndex } from '@/utils/storage';

export const getStaticPaths: GetStaticPaths = async () => {
    const { items } = await getIndex(100);
    return {
        paths: items.map(a => ({ params: { key: a.key } })),
        fallback: 'blocking',
    };
};

export const getStaticProps: GetStaticProps = async (context) => {
    const { key } = context.params!;
    try {
        const article = await getArticleBlob(key as string);
        if (!article) return { notFound: true };
        return { props: { article }, revalidate: 30 };
    } catch {
        return { props: { error: 'Failed to load article. Please try again later.' }, revalidate: 10 };
    }
};
