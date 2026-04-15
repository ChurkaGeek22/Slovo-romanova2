import Header from "../components/Header";
import Hero from "../components/Hero";
import About from "../components/About";
import Stats from "../components/Stats";
import Services from "../components/Services";
import Reviews from "../components/Reviews";
import Events from "../components/Events";
import Stories from "../components/Stories";
import ChatBot from "../components/ChatBot";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Stats />
        <About />
        <Stories />
        <Services />
        <Events />
        <Reviews />
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
}
