import { motion } from "framer-motion";

export default function PageIntro({ eyebrow, title, copy, image }) {
  return (
    <section className="page-intro" style={image ? { backgroundImage: "linear-gradient(90deg,rgba(17,15,12,.82),rgba(17,15,12,.34)),url(" + image + ")" } : undefined}>
      <div className="page-intro-inner page-wrap">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {copy && <p>{copy}</p>}
        </motion.div>
      </div>
    </section>
  );
}
