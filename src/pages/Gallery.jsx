import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { galleryImages } from "../data/products";
import { usePageMeta } from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import PageIntro from "../components/PageIntro";

const captions = ["The golden hour", "Little things, kept close", "A detail to remember", "A thoughtful gift", "The everyday edit", "A moment of light"];

export default function Gallery() {
  usePageMeta("The Gallery", "Explore the Royal Jewel visual collection and jewellery inspiration.");
  return (
    <>
      <PageIntro eyebrow="THE ROYAL JEWEL JOURNAL" title="A little inspiration." copy="Luminous details, thoughtful layers, and all the ways to make a piece your own." image="https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=1750" />
      <section className="section page-wrap">
        <div className="gallery-masonry">
          {galleryImages.map((image, index) => (
            <Reveal key={image} delay={(index % 3) * 0.06}>
              <Link className="gallery-item" to="/shop">
                <img src={image} alt={captions[index]} loading="lazy" />
                <span className="gallery-caption">{captions[index]} <FiArrowUpRight /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
