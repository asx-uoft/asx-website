import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/utils/auth';
import { readSponsors, writeSponsors, SponsorsData } from '@/utils/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            return res.status(200).json(await readSponsors(true));
        }

        if (req.method === 'PUT') {
            const token = req.cookies['admin-token'] || '';
            if (!verifyToken(token)) return res.status(401).json({ message: 'Unauthorized' });
            const data = req.body as SponsorsData;
            if (!Array.isArray(data.sponsors) || !Array.isArray(data.tiers) || !Array.isArray(data.tableRows)) {
                return res.status(400).json({ message: 'Invalid payload' });
            }
            await writeSponsors(data);
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/sponsors]', error);
        return res.status(500).json({ message: (error as Error).message ?? 'Internal server error' });
    }
}
