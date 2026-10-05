import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import PageIntro from "../components/PageIntro";
import ProductCard from "../components/ProductCard";
import { products } from "../data/products";
import { usePageMeta } from "../hooks/usePageMeta";

const categoryOptions = ["Necklaces", "Earrings", "Rings", "Bracelets", "Wedding"];

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [maxPrice, setMaxPrice] = useState(300);
  const [sort, setSort] = useState(searchParams.get("sort") === "new" ? "new" : "featured");
  usePageMeta("Shop the Collection", "Explore necklaces, earrings, rings, bracelets, and wedding jewellery from Royal Jewel.");

  const visibleProducts = useMemo(() => {
    const result = products.filter((product) =>
      (category === "All" || product.category === category) &&
      product.price <= maxPrice &&
      (product.name + " " + product.category).toLowerCase().includes(search.toLowerCase()) &&
      (sort !== "new" || product.isNew)
    );
    if (sort === "price-low") result.sort((a, b) => a.price - b.price);
    if (sort === "price-high") result.sort((a, b) => b.price - a.price);
    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "new") result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return result;
  }, [category, maxPrice, search, sort]);

  function changeCategory(value) {
    setCategory(value);
    const next = new URLSearchParams(searchParams);
    if (value === "All") next.delete("category");
    else next.set("category", value);
    setSearchParams(next, { replace: true });
  }

  return (
    <>
      <PageIntro eyebrow="THE COMPLETE COLLECTION" title="Find your forever piece." copy="Thoughtful details, quietly luminous. Take your time and find the one that feels like you." image="https://images.pexels.com/photos/20858959/pexels-photo-20858959.jpeg?auto=compress&cs=tinysrgb&w=1800" />
      <div className="page-wrap">
        <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>Shop</span></div>
        <section className="section-tight pb-20">
          <div className="shop-layout">
            <aside className="shop-sidebar">
              <h3>Refine your search</h3>
              <div className="filter-group">
                <h4>Categories</h4>
                <label className="filter-option"><input type="radio" name="category" checked={category === "All"} onChange={() => changeCategory("All")} /> All pieces</label>
                {categoryOptions.map((option) => (
                  <label className="filter-option" key={option}><input type="radio" name="category" checked={category === option} onChange={() => changeCategory(option)} /> {option}</label>
                ))}
              </div>
              <div className="filter-group">
                <h4>Price range</h4>
                <input className="price-range" type="range" min="80" max="300" step="10" value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))} aria-label="Maximum price" />
                <div className="range-values"><span>$80</span><span>{"Up to $" + maxPrice}</span></div>
              </div>
              <div className="filter-group">
                <h4>Good to know</h4>
                <p className="m-0 text-[9px] leading-6 text-stone">Complimentary delivery on orders over $150. Each piece arrives in a keepsake box.</p>
              </div>
            </aside>
            <div className="shop-content">
              <div className="shop-search"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the collection" aria-label="Search the collection" /></div>
              <div className="shop-toolbar">
                <p>{visibleProducts.length} thoughtfully made {visibleProducts.length === 1 ? "piece" : "pieces"}</p>
                <label className="flex items-center gap-2 text-[9px] text-stone">Sort by
                  <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
                    <option value="featured">Featured</option>
                    <option value="new">New arrivals</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                    <option value="name">Name: A to Z</option>
                  </select>
                </label>
              </div>
              <div className="shop-grid">
                {visibleProducts.length ? visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />) : (
                  <div className="no-results"><h3>Nothing found, just yet.</h3><p>Try another search or widen your filters.</p><button className="text-link" type="button" onClick={() => { setSearch(""); setMaxPrice(300); changeCategory("All"); }}>Clear filters</button></div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
