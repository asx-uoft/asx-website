import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Separator } from "@/components/ui/separator";
import { MoonStar, Telescope } from "lucide-react";
import { GetServerSideProps } from "next";
import { readAbout, AboutData } from "@/utils/storage";

interface ExecCardProps {
  title: string;
  name: string;
}

function ExecCard({ title, name }: ExecCardProps) {
  return (
    <div className='border rounded-lg border-gray-700 p-5 m-2 w-70 flex flex-col items-center justify-between'>
      <div className='text-xl md:text-2xl text-primary w-full text-center'>{title}</div>
      <div className='text-lg md:text-xl text-center w-full'>{name}</div>
    </div>
  );
}

interface AboutProps {
  data: AboutData;
}

export const getServerSideProps: GetServerSideProps<AboutProps> = async () => {
  const data = await readAbout();
  console.log('Fetched about data:', data);
  return { props: { data } };
};

export default function About({ data }: AboutProps) {
  const { imageUrl, missionStatement, description, execs } = data;

  return (
    <div className='max-w-7xl mx-auto'>
      <Navbar />
      <div className='container flex flex-col items-center justify-between min-h-screen mx-auto gap-5 sm:gap-10 md:gap-15'>
        <div className='flex-grow flex flex-col gap-10 px-4 md:gap-10 items-center'>
          {imageUrl && (
            <div className="w-full flex justify-center items-center max-h-128 overflow-hidden">
              <div className="w-full max-w-[1280px]">
                <img
                  src={imageUrl}
                  alt="ASX team"
                  className="object-cover w-full h-auto"
                />
              </div>
            </div>
          )}
          <div className='flex flex-col gap-5 w-full items-center'>
            <div className='absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-4 bg-background'>
              <div className='text-3xl md:text-4xl'>Our Mission</div>
            </div>
            <div className='border rounded-lg border-gray-700 p-6 sm:p-8 pt-10'>
              <div className='text-xl md:text-2xl'>{missionStatement}</div>
            </div>
          </div>
          <MoonStar className="w-8 h-8 text-gray-500" />
          <div className='flex flex-col gap-5 w-full'>
            {description.split('\n\n').map((para, i) => (
              <div key={i} className='text-lg md:text-xl'>{para}</div>
            ))}
          </div>
          <div className='w-full flex flex-col gap-15 md:flex-row md:justify-between'>
            <div className='flex flex-col gap-3 items-center pt-10 md:pt-0 md:max-w-1/4'>
              <div className='text-xl md:text-2xl text-primary'>Looking to sponsor us?</div>
              <div className='text-lg md:text-xl text-center'>
                ASX relies heavily on external sponsorships in order to continue informing today&apos;s society about astronomy and space exploration. By sponsoring us, you or your company can be involved with a non-profit organization that strives to share the excitement of space with the public!
              </div>
            </div>
            <div className='flex flex-col gap-3 items-center md:max-w-1/4'>
              <div className='text-xl md:text-2xl text-primary'>Want to stay updated?</div>
              <div className='text-lg md:text-xl text-center'>
                <a href="/membership" className="bg-secondary text-background p-1">Subscribe to our Newsletter</a> to stay updated on our events and announcements. We send out emails once a month, and you can unsubscribe at any time.
              </div>
            </div>
            <div className='flex flex-col gap-3 items-center md:max-w-1/4'>
              <div className='text-xl md:text-2xl text-primary'>Want to get involved?</div>
              <div className='text-lg md:text-xl text-center'>
                If you are a University of Toronto undergraduate student, you can run for any of the positions listed below. We hold elections for upcoming members <span className='text-primary'>near the end of the academic year</span>, so come to our events and get to know us until then!
              </div>
            </div>
          </div>
          <Telescope className="w-8 h-8 text-gray-500" />
          <div className='flex flex-col gap-5 w-full items-center'>
            <div className='text-3xl md:text-4xl'>Meet the Team</div>
            <Separator orientation="horizontal" className="bg-secondary" style={{ width: '25%' }} />
            <div className='flex flex-wrap justify-center'>
              {execs.map((member, i) => (
                <ExecCard key={i} title={member.title} name={member.name} />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
