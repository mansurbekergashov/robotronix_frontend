import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import Courses from "../components/home/Courses";
import Products from "../components/home/Products";
import Partners from "../components/home/Partners";
import About from "../components/home/About";
import FAQ from "../components/home/FAQ";
import NewsSection from "../components/home/NewsSection";
import Contact from "../components/home/Contact";
import Carousel from "../components/home/Carousel";
import SocialModal from "../components/common/SocialModal";
import Map from "../components/home/Map";

const HomePage = () => {
  return (
    <>
      <SocialModal/>
      <Hero />
      <Features />
      <Courses />
      <Products />
      <Partners />
      <Carousel/>
      <About />
      <FAQ />
      <NewsSection preview />
      <Contact />
      <Map/>
    </>
  );
};

export default HomePage;

