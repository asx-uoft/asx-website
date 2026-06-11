import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/utils/auth';
import { readLinks, writeLinks, LinksData } from '@/utils/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const data = await readLinks(true);
            return res.status(200).json(data);
        }

        if (req.method === 'PUT') {
            const token = req.cookies['admin-token'] || '';
            if (!verifyToken(token)) return res.status(401).json({ message: 'Unauthorized' });
            const data = req.body as LinksData;
            if (!data.email || !Array.isArray(data.socials) || !Array.isArray(data.resourceSections)) {
                return res.status(400).json({ message: 'Invalid payload' });
            }
            await writeLinks(data);
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/links]', error);
        return res.status(500).json({ message: (error as Error).message ?? 'Internal server error' });
    }
}
