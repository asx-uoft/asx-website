interface MissionProps {
    quote: string;
}

export default function Mission({ quote }: MissionProps) {
    return (
        <div className='flex flex-col gap-5 p-5 md:mx-20 lg:mx-40 rounded-lg border-1 border-gray-700'>
            <div className='flex gap-5'>
                <div className="text-5xl text-secondary">&ldquo;</div>
                <div className="sm:text-lg md:text-xl">{quote}</div>
            </div>
        </div>
    );
}
