import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';

export default function PublicLayout() {
  return (
    <AnimatedBackground className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 w-full relative z-10">
        <Outlet />
      </main>
      <Footer />
    </AnimatedBackground>
  );
}
