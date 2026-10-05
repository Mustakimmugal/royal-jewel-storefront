import { Link } from "react-router-dom";
import { FiArrowUpRight } from "react-icons/fi";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found", "The page you are looking for could not be found.");
  return <section className="not-found"><div><p className="eyebrow">A LITTLE DETOUR</p><h1>404</h1><p>This page does not seem to be here. Let's find you something lovely.</p><Link className="button button-dark" to="/">Back to the beginning <FiArrowUpRight /></Link></div></section>;
}
