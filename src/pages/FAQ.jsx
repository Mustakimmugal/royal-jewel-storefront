import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta";
import PageIntro from "../components/PageIntro";
import { formatINR } from "../utils/currency";
import { freeShippingThreshold } from "../data/storeSettings";

const questions = [
  { question: "What materials are used in your jewellery?", answer: "Each product page lists its materials. The collection includes gold vermeil, gold-plated brass, recycled sterling silver, and carefully selected decorative stones. Please check the individual product details for the exact materials." },
  { question: "How should I care for my pieces?", answer: "Keep jewellery dry and away from perfumes, lotions, and household chemicals. Store each piece separately in a soft pouch or its keepsake box, and gently polish with a soft, dry cloth." },
  { question: "Is gift packaging available?", answer: "Yes. Each order is presented in our keepsake packaging, ready to give or to keep. Gift notes can be added once a real checkout experience is connected." },
  { question: "How does shipping work?", answer: `The sample storefront shows complimentary delivery on orders over ${formatINR(freeShippingThreshold)}. Actual delivery regions, timelines, and fees should be added by the store owner before launch.` },
  { question: "Can I return or exchange an order?", answer: "The demo currently mentions a 30-day return window. A real store should publish its final eligibility, timelines, and exchange process before taking customer orders." },
  { question: "Can I buy something on this website?", answer: "This website is a static preview. Product cards, cart, wishlist, newsletter, and forms do not take orders or process payments." },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);
  usePageMeta("Frequently Asked Questions", "Answers to common Royal Jewel questions about materials, care, shipping, and returns.");
  return (
    <>
      <PageIntro eyebrow="HERE TO HELP" title="A few helpful answers." copy="A little clarity goes a long way. Find some useful notes about the collection and the experience." />
      <section className="section page-wrap">
        <div className="faq-list">
          {questions.map((item, index) => {
            const expanded = openIndex === index;
            return (
              <div className="faq-item" key={item.question}>
                <button className="faq-question" type="button" aria-expanded={expanded} onClick={() => setOpenIndex(expanded ? -1 : index)}>
                  <span>{item.question}</span><FiPlus />
                </button>
                <AnimatePresence initial={false}>
                  {expanded && <motion.div className="faq-answer" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}><p>{item.answer}</p></motion.div>}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center"><p className="mb-4 text-[10px] text-stone">Still have a question for us?</p><Link className="button button-dark" to="/contact">Get in touch <span>→</span></Link></div>
      </section>
    </>
  );
}
