import { Separator } from "./ui/separator";

interface HeroBannerProps {
    imageUrl: string;
    caption: string;
    imageCreditTitle: string;
    imageCreditLine: string;
}

export default function HeroBanner({ imageUrl, caption, imageCreditTitle, imageCreditLine }: HeroBannerProps) {
    return (
        <div
            className="w-full h-48 md:h-96 pt-2 flex relative text-white"
            style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex flex-col gap-2">
                <h1 className="text-3xl md:text-5xl font-bold">
                    <span className="hero-banner__highlight">A</span>stronomy &
                </h1>
                <h1 className="text-3xl md:text-5xl font-bold">
                    <span className="hero-banner__highlight">S</span>pace E
                    <span className="hero-banner__highlight">x</span>ploration
                </h1>
                <h1 className="text-3xl md:text-5xl font-bold">Association</h1>
                <Separator orientation="horizontal" />
                <h4 className="hero-banner__description text-xl md:text-2xl mt-2 text-primary">
                    {caption}
                </h4>
            </div>
            {(imageCreditTitle || imageCreditLine) && (
                <div className="hidden sm:flex absolute bottom-4 right-4 md:bottom-8 md:right-8 flex-col items-end gap-2">
                    <div className='text-center border-1 border-gray-700 rounded-md p-2 w-full bg-black/30'>
                        {imageCreditTitle && <div className='text-lg'>{imageCreditTitle}</div>}
                        {imageCreditLine && <div>{imageCreditLine}</div>}
                    </div>
                </div>
            )}
        </div>
    );
}
