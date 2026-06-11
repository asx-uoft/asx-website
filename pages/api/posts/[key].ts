import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/utils/auth';
import { getArticleBlob, editArticleBlob, deleteArticleBlob } from '@/utils/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const key = req.query.key as string;

    try {
        if (req.method === 'GET') {
            const article = await getArticleBlob(key, true);
            if (!article) return res.status(404).json({ message: 'Not found' });
            return res.status(200).json(article);
        }

        if (req.method === 'PUT') {
            const token = req.cookies['admin-token'] || '';
            if (!verifyToken(token)) return res.status(401).json({ message: 'Unauthorized' });

            const { title, content, bannerUrl } = req.body;
            const article = await editArticleBlob(key, { title, content, bannerUrl });
            return res.status(200).json(article);
        }

        if (req.method === 'DELETE') {
            const token = req.cookies['admin-token'] || '';
            if (!verifyToken(token)) return res.status(401).json({ message: 'Unauthorized' });

            const { warning } = await deleteArticleBlob(key);
            return res.status(200).json({ success: true, warning });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(`[${req.method} /api/posts/${key}]`, error);
        return res.status(500).json({ message: (error as Error).message ?? 'Internal server error' });
    }
}
