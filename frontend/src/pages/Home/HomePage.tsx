import { Suspense, lazy } from 'react';
import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { Hero } from './Hero';

const Services = lazy(() => import('./Services').then((module) => ({ default: module.Services })));
const AboutUs = lazy(() => import('./AboutUs').then((module) => ({ default: module.AboutUs })));
const Testimonials = lazy(() => import('./Testimonials').then((module) => ({ default: module.Testimonials })));

const HomeSectionSkeleton = ({ minHeightClass }: { minHeightClass: string }) => {
  return <section aria-hidden className={`bg-dark-bg ${minHeightClass}`} />;
};

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<HomeSectionSkeleton minHeightClass="min-h-[380px]" />}>
          <Services />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton minHeightClass="min-h-[420px]" />}>
          <AboutUs />
        </Suspense>
        <Suspense fallback={<HomeSectionSkeleton minHeightClass="min-h-[360px]" />}>
          <Testimonials />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};
