import { Atlas } from "@/components/atlas";
import { Closing, Footer } from "@/components/closing";
import { Destinations } from "@/components/destinations";
import { Hero } from "@/components/hero";
import { Immersive } from "@/components/immersive";
import { Journal } from "@/components/journal";
import { Nav } from "@/components/nav";
import { Quiz } from "@/components/quiz";
import { Story } from "@/components/story";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Destinations />
        <Atlas />
        <Immersive />
        <Story />
        <Quiz />
        <Journal />
        <Closing />
      </main>
      <Footer />
    </>
  );
}

