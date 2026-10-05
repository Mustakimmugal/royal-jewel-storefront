import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { usePageMeta } from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import PageIntro from "../components/PageIntro";
import SectionTitle from "../components/SectionTitle";

const values = [
  { symbol: "✧", title: "Designed with intention", copy: "Thoughtful proportions and quiet details make each piece feel personal, easy, and enduring." },
  { symbol: "◇", title: "Made to mean something", copy: "We believe jewellery can hold a memory, mark a moment, or simply make an ordinary day feel yours." },
  { symbol: "♡", title: "A softer kind of luxury", copy: "A considered experience should feel warm and welcoming, from the first hello to the final keepsake box." },
];

export default function About() {
  usePageMeta("Our Story", "Read the story and values behind Royal Jewel's thoughtful jewellery collection.");
  return (
    <>
      <PageIntro eyebrow="THE HEART OF ROYAL JEWEL" title="Made for the moments that become yours." copy="We believe the things we keep close should feel personal, thoughtful, and made to stay." image="https://images.pexels.com/photos/19647000/pexels-photo-19647000/free-photo-of-model-posing-in-necklace.jpeg?auto=compress&dpr=1&h=1300&w=2000" />
      <section className="story-grid">
        <Reveal><img src="https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=1250" alt="Royal Jewel pieces arranged with care" loading="lazy" /></Reveal>
        <Reveal className="story-text">
          <p className="eyebrow">A NOTE FROM US</p>
          <h2>A little more meaning, in the everyday.</h2>
          <p>Royal Jewel began with a simple thought: jewellery does not need to wait for a special occasion. It can be the small detail that helps you feel like yourself on a regular Tuesday, or the keepsake that takes you back to a day you never want to forget.</p>
          <p>So we bring together expressive shapes, luminous finishes, and thoughtful touches in a collection designed to be lived in. Each piece is an invitation to celebrate your own story, just as it is.</p>
          <Link className="button button-dark" to="/shop">Meet the collection <FiArrowUpRight /></Link>
        </Reveal>
      </section>
      <section className="section page-wrap">
        <Reveal><SectionTitle eyebrow="WHAT WE BELIEVE" title="The little things, thoughtfully considered." copy="A few simple ideas guide every collection we create." centered /></Reveal>
        <div className="about-values">
          {values.map((value, index) => <Reveal key={value.title} delay={index * 0.08}><article className="about-value"><span>{value.symbol}</span><h3>{value.title}</h3><p>{value.copy}</p></article></Reveal>)}
        </div>
      </section>
      <section className="section testimonial-section">
        <div className="page-wrap"><Reveal><SectionTitle eyebrow="OUR PROMISE" title="Wear what feels like you." copy="We hope each piece becomes part of your story, in your own way." light centered /></Reveal></div>
      </section>
    </>
  );
}
