import { Footer } from '../../components/layout/Footer';
import { Navbar } from '../../components/layout/Navbar';
import { AboutUs } from './AboutUs';
import { Hero } from './Hero';
import { Services } from './Services';
import { Testimonials } from './Testimonials';

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <main>
        <Hero />
        <Services />
        <AboutUs />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};
