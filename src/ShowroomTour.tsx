import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const base = '/bethager-furniture/';
const scenes = [
  { image: 'living.jpg', alt: 'Illustrative sunlit living room with a cream sofa and warm wood furniture', eyebrow: '01 / Living Room', heading: 'Designed for living.', description: 'A place to gather, unwind and feel at home.', to: '/shop?category=Living+Room' },
  { image: 'dining.jpg', alt: 'Illustrative dining room with a wood table and upholstered chairs', eyebrow: '02 / Dining', heading: 'Gather beautifully.', description: 'Make every shared moment feel special.', to: '/shop?category=Dining' },
  { image: 'bedroom.jpg', alt: 'Illustrative bedroom with a cream bed and warm wood details', eyebrow: '03 / Bedroom', heading: 'Rest in comfort.', description: 'Thoughtful pieces for peaceful spaces.', to: '/shop?category=Bedroom' },
];

function CollectionLink({ to }: { to: string }) {
  return <Link to={to} className="btn btn-dark">Explore this collection <ArrowUpRight className="ml-3" size={15} /></Link>;
}

function MobileTour() {
  return <section aria-label="BETHAGER showroom tour" className="bg-cream pb-12 md:hidden">
    <div className="container pt-12 pb-9">
      <p className="eyebrow text-walnut mb-4">The BETHAGER showroom experience</p>
      <h1 className="text-5xl leading-tight mb-4">A room for every story.</h1>
      <p className="dim text-sm leading-6">Scroll through the spaces. Concept showroom · Demonstration imagery.</p>
    </div>
    <div className="space-y-14">
      <figure className="container">
        <img src={`${base}showroom/overview.jpg`} alt="Illustrative showroom entrance framed by warm wood and greenery" className="block w-full aspect-[4/3] object-cover object-center" width="1672" height="941" />
        <figcaption className="mt-3 text-[10px] uppercase tracking-[.18em] text-walnut">An invitation to explore</figcaption>
      </figure>
      {scenes.map((scene) => <article key={scene.image} className="container">
        <img src={`${base}showroom/${scene.image}`} alt={scene.alt} loading="lazy" decoding="async" className="block w-full aspect-[4/3] object-cover object-center" width="1672" height="941" />
        <div className="pt-6">
          <p className="eyebrow text-walnut mb-3">{scene.eyebrow}</p>
          <h2 className="text-4xl leading-tight mb-3">{scene.heading}</h2>
          <p className="dim text-sm leading-6 mb-5">{scene.description}</p>
          <CollectionLink to={scene.to} />
        </div>
      </article>)}
    </div>
  </section>;
}

function DesktopTour({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement | null>(null);
  const previewVideo = useRef<HTMLVideoElement | null>(null);
  const hdVideo = useRef<HTMLVideoElement | null>(null);
  const target = useRef(0);
  const [progress, setProgress] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [hdSrc, setHdSrc] = useState<string>();
  const [showHd, setShowHd] = useState(false);

  useEffect(() => {
    if (reduced || (!previewReady && !previewFailed)) return;
    const controller = new AbortController();
    let url = '';
    fetch(`${base}videos/showroom-desktop-hd.mp4`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Showroom video: ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setHdSrc(url);
      })
      .catch(() => { /* The preview remains available if the larger file cannot load. */ });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [previewReady, previewFailed, reduced]);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const update = () => {
      const el = section.current;
      if (!el) return;
      const total = Math.max(1, el.offsetHeight - window.innerHeight);
      target.current = Math.max(0, Math.min(1, -el.getBoundingClientRect().top / total));
      setProgress(target.current);
    };
    const seek = (video: HTMLVideoElement | null) => {
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;
      const time = target.current * Math.max(0, video.duration - .04);
      if (Math.abs(video.currentTime - time) > .055) video.currentTime = time;
    };
    const tick = () => {
      seek(previewVideo.current);
      seek(hdVideo.current);
      const hd = hdVideo.current;
      if (hdSrc && hd && !hd.seeking && hd.readyState >= 2 &&
        Math.abs(hd.currentTime - target.current * Math.max(0, hd.duration - .04)) < .12) {
        setShowHd(true);
      }
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(frame);
    };
  }, [hdSrc, reduced]);

  const stage = progress < .34 ? 0 : progress < .68 ? 1 : 2;
  const scene = scenes[stage];

  return <section ref={section} className={reduced ? 'relative h-[85vh] hidden md:block' : 'relative h-[360vh] hidden md:block'} aria-label="BETHAGER showroom tour">
    <div className="sticky top-0 h-screen min-h-[560px] overflow-hidden bg-[#332b23] text-white">
      {reduced ? <img src={`${base}showroom/overview.jpg`} alt="Illustrative showroom with warm wood and greenery" className="absolute inset-0 h-full w-full object-cover" /> : <>
        <video ref={previewVideo} src={`${base}videos/showroom-desktop.mp4`} className="absolute inset-0 h-full w-full object-cover" muted playsInline preload="auto" aria-hidden="true" onLoadedData={() => setPreviewReady(true)} onError={() => setPreviewFailed(true)} />
        {hdSrc && <video ref={hdVideo} src={hdSrc} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${showHd ? 'opacity-100' : 'opacity-0'}`} muted playsInline preload="auto" aria-hidden="true" onError={() => setShowHd(false)} />}
        {previewFailed && !hdSrc && <img src={`${base}showroom/overview.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      </>}
      <div className="absolute inset-0 bg-gradient-to-r from-[#10221c]/80 via-[#10221c]/25 to-transparent" />
      <div className="container relative h-full flex items-center"><div className="max-w-xl">
        <p className="eyebrow text-[#e5c9a3] mb-5">The BETHAGER showroom experience</p>
        <div key={stage} className="animate-[fadeIn_.45s_ease-out]">
          <p className="text-xs tracking-[.22em] uppercase mb-4 text-white/80">{scene.eyebrow}</p>
          <h1 className="text-5xl md:text-[84px] leading-[1.06] mb-6">{scene.heading}</h1>
          <p className="text-base md:text-lg text-white/85 mb-8">{scene.description}</p>
          <CollectionLink to={scene.to} />
        </div>
      </div></div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-[10px] tracking-[.2em] uppercase text-white/85">{reduced ? 'Explore our collections' : 'Scroll to explore'}</span>
        <div className="w-36 h-[2px] bg-white/40"><div className="h-full bg-[#d8b58b]" style={{ width: `${Math.round((reduced ? 1 : progress) * 100)}%` }} /></div>
      </div>
      <div className="absolute right-5 bottom-7 text-[10px] text-white/65">Concept showroom · Demonstration imagery</div>
    </div>
  </section>;
}

export default function ShowroomTour() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const screen = window.matchMedia('(max-width: 767px)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateScreen = () => setMobile(screen.matches);
    const updateMotion = () => setReduced(motion.matches);
    screen.addEventListener('change', updateScreen);
    motion.addEventListener('change', updateMotion);
    return () => {
      screen.removeEventListener('change', updateScreen);
      motion.removeEventListener('change', updateMotion);
    };
  }, []);
  return mobile ? <MobileTour /> : <DesktopTour reduced={reduced} />;
}
