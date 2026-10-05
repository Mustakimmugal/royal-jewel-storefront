import { useRef } from "react";
import { Link } from "react-router-dom";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FiArrowRight, FiArrowUpRight, FiChevronLeft, FiChevronRight, FiGift, FiHeart, FiShield, FiStar } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { categories, galleryImages, products, testimonials } from "../data/products";
import { usePageMeta } from "../hooks/usePageMeta";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";
import SectionTitle from "../components/SectionTitle";
import Newsletter from "../components/Newsletter";
import { formatINR } from "../utils/currency";
import { freeShippingThreshold } from "../data/storeSettings";

const heroSlides = [
  {
    eyebrow: "THE GOLDEN EDITION",
    title: <>Made for the<br /><em>moments</em> that matter.</>,
    copy: "Jewellery that feels like you. Considered details, a little everyday magic, and a glow that stays with you.",
    image: "https://images.pexels.com/photos/19647000/pexels-photo-19647000/free-photo-of-model-posing-in-necklace.jpeg?auto=compress&dpr=1&h=1500&w=2300",
  },
  {
    eyebrow: "A MODERN HEIRLOOM",
    title: <>Keep a little<br /><em>light</em> close.</>,
    copy: "Discover the pieces you will reach for today and treasure for every chapter still to come.",
    image: "https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=2000",
  },
  {
    eyebrow: "THE WEDDING EDIT",
    title: <>Say yes to<br /><em>your</em> forever.</>,
    copy: "Meaningful finishing touches, made for your once-in-a-lifetime and everything in between.",
    image: "https://images.pexels.com/photos/12217206/pexels-photo-12217206.jpeg?auto=compress&cs=tinysrgb&w=2000",
  },
];

const benefits = [
  { icon: <FiStar />, title: "Thoughtfully made", copy: "Considered details, made to be worn often." },
  { icon: <FiShield />, title: "Quality you can feel", copy: "Materials chosen with care and intention." },
  { icon: <FiGift />, title: "Ready to gift", copy: "Every order arrives in our keepsake box." },
];

export default function Home() {
  const featureSwiperRef = useRef(null);
  const heroSwiperRef = useRef(null);
  const testimonialSwiperRef = useRef(null);
  usePageMeta("Fine Jewellery for Every Chapter", "Meet Royal Jewel: thoughtful gold jewellery for all of life's little moments.");
  const featured = products.filter((product) => product.featured);
  const arrivals = products.filter((product) => product.isNew);
  const bestsellers = products.filter((product) => product.badge === "Bestseller");

  return (
    <>
      <section className="hero">
        <Swiper
          className="hero-swiper"
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          autoplay={{ delay: 6200, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          loop
          onSwiper={(swiper) => { heroSwiperRef.current = swiper; }}
        >
          {heroSlides.map((slide) => (
            <SwiperSlide key={slide.eyebrow}>
              <div className="hero-slide">
                <img className="hero-photo" src={slide.image} alt="" fetchPriority="high" />
                <div className="hero-overlay" />
                <div className="hero-inner">
                  <div className="hero-copy-block">
                    <p className="eyebrow">{slide.eyebrow}</p>
                    <h1>{slide.title}</h1>
                    <p className="hero-description">{slide.copy}</p>
                    <div className="hero-actions">
                      <Link className="button button-gold" to="/shop">Explore the collection <FiArrowUpRight /></Link>
                      <Link className="button button-outline-light" to="/about">Our story</Link>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button className="hero-arrow hero-arrow-prev" type="button" aria-label="Previous banner" onClick={() => heroSwiperRef.current?.slidePrev()}><FiChevronLeft /></button>
        <button className="hero-arrow hero-arrow-next" type="button" aria-label="Next banner" onClick={() => heroSwiperRef.current?.slideNext()}><FiChevronRight /></button>
        <span className="hero-note">Thoughtfully made, forever treasured</span>
      </section>

      <div className="trust-strip page-wrap">
        <div className="trust-item"><span>✧</span><div><strong>Complimentary delivery</strong><small>{"On orders over " + formatINR(freeShippingThreshold)}</small></div></div>
        <div className="trust-item"><span>◇</span><div><strong>Made with care</strong><small>Quality in every detail</small></div></div>
        <div className="trust-item"><span>↺</span><div><strong>Easy returns</strong><small>30 days to decide</small></div></div>
        <div className="trust-item"><span>♡</span><div><strong>Gift-ready packaging</strong><small>A lovely arrival, every time</small></div></div>
      </div>

      <section className="section page-wrap">
        <Reveal><SectionTitle eyebrow="FIND YOUR EVERYDAY FAVORITE" title="A piece for every you." copy="Little details. A lasting impression. Find the things you will keep close." centered /></Reveal>
        <div className="category-grid">
          {categories.map((category, index) => (
            <Reveal key={category.name} delay={index * 0.05}>
              <Link className="category-tile" to={"/shop?category=" + encodeURIComponent(category.name)}>
                <img src={category.image} alt={category.name} loading="lazy" />
                <div className="category-tile-copy"><div><small>Collection {category.count}</small><h3>{category.name}</h3></div><FiArrowUpRight /></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section featured-band">
        <div className="page-wrap">
          <Reveal>
            <div className="split-heading">
              <SectionTitle eyebrow="CURATED FOR YOU" title="The pieces you'll treasure." copy="Loved for their thoughtful details and made for wherever life takes you." />
              <div className="swiper-control-row">
                <button className="swiper-arrow" type="button" onClick={() => featureSwiperRef.current?.slidePrev()} aria-label="Previous pieces"><FiArrowRight style={{ transform: "rotate(180deg)" }} /></button>
                <button className="swiper-arrow" type="button" onClick={() => featureSwiperRef.current?.slideNext()} aria-label="Next pieces"><FiArrowRight /></button>
              </div>
            </div>
          </Reveal>
          <Swiper
            className="product-swiper"
            onSwiper={(swiper) => { featureSwiperRef.current = swiper; }}
            slidesPerView={1.25}
            spaceBetween={12}
            breakpoints={{ 580: { slidesPerView: 2.2, spaceBetween: 15 }, 900: { slidesPerView: 3.2, spaceBetween: 18 }, 1200: { slidesPerView: 4, spaceBetween: 20 } }}
          >
            {featured.map((product, index) => <SwiperSlide key={product.id}><ProductCard product={product} index={index} /></SwiperSlide>)}
          </Swiper>
          <div className="mt-8 text-center"><Link className="button button-dark" to="/shop">Discover all pieces <FiArrowRight /></Link></div>
        </div>
      </section>

      <section className="section page-wrap">
        <Reveal>
          <div className="split-heading">
            <SectionTitle eyebrow="JUST ARRIVED" title="New, with meaning." copy="Meet the latest little things to make a lasting impression." />
            <Link className="text-link" to="/shop?sort=new">Shop new arrivals <FiArrowUpRight /></Link>
          </div>
        </Reveal>
        <div className="shop-grid">
          {arrivals.slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      </section>

      <section className="collection-feature">
        <Reveal className="collection-image"><img src="https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=1300" alt="Carefully curated gold jewellery" loading="lazy" /></Reveal>
        <Reveal className="collection-copy">
          <p className="eyebrow">A LITTLE MORE MEANING</p>
          <h2>Jewellery that feels like <em>you.</em></h2>
          <p>We believe the pieces you wear should tell your story. Find thoughtful design, luminous details, and a little everyday magic.</p>
          <Link className="button button-gold" to="/about">A note from us <FiArrowUpRight /></Link>
        </Reveal>
      </section>

      <section className="section page-wrap">
        <Reveal>
          <div className="split-heading">
            <SectionTitle eyebrow="MOST LOVED" title="The ones you come back to." copy="A few much-loved pieces, chosen by you." />
            <Link className="text-link" to="/shop?sort=popular">Shop best sellers <FiArrowUpRight /></Link>
          </div>
        </Reveal>
        <div className="shop-grid">
          {bestsellers.concat(products.filter((item) => item.featured && item.badge !== "Bestseller")).slice(0, 4).map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
        </div>
      </section>

      <section className="section-tight page-wrap">
        <Reveal><SectionTitle eyebrow="THE ROYAL JEWEL PROMISE" title="Little reasons to love it here." copy="The thoughtful details matter, from the first click to the last clasp." centered /></Reveal>
        <div className="benefit-grid">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 0.08}>
              <div className="benefit-card"><span>{benefit.icon}</span><h3>{benefit.title}</h3><p>{benefit.copy}</p></div>
            </Reveal>
          ))}
          <Reveal delay={0.24}><div className="benefit-card"><span><FiHeart /></span><h3>Made to be kept</h3><p>Every design balances a little wonder with easy everyday wear.</p></div></Reveal>
        </div>
      </section>

      <section className="section testimonial-section">
        <div className="page-wrap">
          <div className="testimonial-heading">
            <Reveal><SectionTitle eyebrow="KIND WORDS, KEPT CLOSE" title="A little love from you." light centered /></Reveal>
            <div className="testimonial-controls">
              <button className="swiper-arrow" type="button" aria-label="Previous testimonial" onClick={() => testimonialSwiperRef.current?.slidePrev()}><FiChevronLeft /></button>
              <button className="swiper-arrow" type="button" aria-label="Next testimonial" onClick={() => testimonialSwiperRef.current?.slideNext()}><FiChevronRight /></button>
            </div>
          </div>
          <Swiper onSwiper={(swiper) => { testimonialSwiperRef.current = swiper; }} modules={[Autoplay, Pagination]} autoplay={{ delay: 7000, disableOnInteraction: false }} pagination={{ clickable: true }} loop>
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.name}>
                <div className="testimonial-card">
                  <div className="testimonial-stars">★★★★★</div>
                  <blockquote className="testimonial-quote">“{testimonial.quote}”</blockquote>
                  <p className="testimonial-name">{testimonial.name} <span>· {testimonial.rating} stars</span></p>
                  <span className="testimonial-location">{testimonial.location}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      <section className="section page-wrap">
        <Reveal>
          <div className="split-heading">
            <SectionTitle eyebrow="A LITTLE INSPIRATION" title="Life, lately." copy="See how our community wears the little things they love." />
            <a className="text-link" href="https://www.instagram.com/" target="_blank" rel="noreferrer"><FaInstagram /> @royaljewel <FiArrowUpRight /></a>
          </div>
        </Reveal>
        <div className="instagram-grid">
          {galleryImages.map((image, index) => (
            <Link className="instagram-tile" to="/gallery" key={image} aria-label={"View image " + (index + 1) + " in the gallery"}>
              <img src={image} alt="Royal Jewel editorial jewellery" loading="lazy" /><span><FaInstagram /></span>
            </Link>
          ))}
        </div>
      </section>
      <Newsletter />
    </>
  );
}
