import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/utils/auth';
import { readAbout, writeAbout, AboutData } from '@/utils/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === 'GET') {
            const data = await readAbout(true);
            return res.status(200).json(data);
        }

        if (req.method === 'PUT') {
            const token = req.cookies['admin-token'] || '';
            if (!verifyToken(token)) return res.status(401).json({ message: 'Unauthorized' });

            const { imageUrl, missionStatement, description, execs } = req.body as AboutData;
            if (!missionStatement || !Array.isArray(execs)) {
                return res.status(400).json({ message: 'missionStatement and execs are required' });
            }

            await writeAbout({ imageUrl: imageUrl ?? '', missionStatement, description: description ?? '', execs });
            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error('[/api/about]', error);
        return res.status(500).json({ message: (error as Error).message ?? 'Internal server error' });
    }
}
