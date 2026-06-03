import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import obs from '../assets/obs.jpg';
import startalk from '../assets/startalk.jpg';
import symposium from '../assets/symposium.png';
import Image, { StaticImageData } from 'next/image';
import { HomeEventCard } from '@/utils/storage';

const FALLBACK_IMAGES: Record<string, StaticImageData> = {
    'Symposium':         symposium,
    'Observation Night': obs,
    'StarTalk':          startalk,
};

const EventCard = ({ card }: { card: HomeEventCard }) => {
    const fallback = FALLBACK_IMAGES[card.title];

    return (
        <Card className="w-full relative overflow-hidden h-72 sm:h-48 md:h-72 border-1 border-gray-700">
            {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.title} className="absolute inset-0 w-full h-full object-cover z-0" />
            ) : fallback ? (
                <Image src={fallback} alt={card.title} fill style={{ objectFit: 'cover' }} className="absolute inset-0 z-0" priority />
            ) : (
                <div className="absolute inset-0 bg-gray-800 z-0" />
            )}
            <div className="absolute top-4 left-4 z-10 bg-black/60 rounded-lg p-4 max-w-[70%]">
                <CardTitle className="text-primary mb-2 text-xl md:text-2xl">{card.title}</CardTitle>
                <CardDescription className="text-white text-lg md:text-xl">{card.description}</CardDescription>
            </div>
        </Card>
    );
};

export default function Events({ cards }: { cards: HomeEventCard[] }) {
    return (
        <div className="container flex flex-col gap-5">
            <div className='flex w-full flex-col md:flex-row gap-5 md:gap-15'>
                <div className='flex flex-col gap-5 md:w-1/3'>
                    <h1 className='text-3xl md:text-4xl'>Events</h1>
                    <div className='text-lg md:text-xl'>We organise a variety of events to engage with the community and share our passion for space.</div>
                    <div className='text-lg md:text-xl'>Our regular events are <span className='text-primary'>free</span> and <span className='text-primary'>open to the public</span>.</div>
                </div>
                <div className="flex flex-col w-full gap-5">
                    {cards.map(card => <EventCard key={card.id} card={card} />)}
                </div>
            </div>
        </div>
    );
}
