import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useProducts } from "@/hooks/useProducts";
import { useSearch, useAvailablePrices, useAvailableSizes } from "@/hooks/useSearch";
import ProductCard from "@/components/ProductCard";
import { ProductFilter } from "@/components/ProductFilter";
import { SortMenu } from "@/components/SortMenu";
import { HeroSection } from "@/components/HeroSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X, ShoppingBag, Sparkles } from "lucide-react";
import type { SearchFilters } from "@/hooks/useSearch";

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const location = useLocation();

  const filters: SearchFilters = useMemo(
    () => ({
      q: searchParams.get("search") || undefined,
      minPrice: searchParams.get("minPrice")
        ? parseInt(searchParams.get("minPrice")!)
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? parseInt(searchParams.get("maxPrice")!)
        : undefined,
      sizes: searchParams.get("sizes")
        ? searchParams.get("sizes")!.split(",")
        : undefined,
      inStock: searchParams.get("inStock") !== "false",
      sort: (searchParams.get("sort") as any) || "newest",
    }),
    [searchParams]
  );

  const { data: searchResults, isLoading: searchLoading } = useSearch(filters);
  const { data: allProducts, isLoading: productsLoading } = useProducts();

  const isLoading = searchLoading || productsLoading;
  const products  = searchResults || allProducts || [];

  const priceRange     = useAvailablePrices(allProducts);
  const availableSizes = useAvailableSizes(allProducts);

  const handleFilterChange = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (newFilters.q)              params.set("search",   newFilters.q);
    if (newFilters.minPrice !== undefined) params.set("minPrice", newFilters.minPrice.toString());
    if (newFilters.maxPrice !== undefined) params.set("maxPrice", newFilters.maxPrice.toString());
    if (newFilters.sizes?.length)  params.set("sizes",    newFilters.sizes.join(","));
    if (newFilters.inStock === false) params.set("inStock", "false");
    if (newFilters.sort)           params.set("sort",     newFilters.sort);
    setSearchParams(params);
  };

  const handleSortChange = (sort: SearchFilters["sort"]) =>
    handleFilterChange({ ...filters, sort });

  const hasActiveFilters =
    !!(filters.q || filters.minPrice || filters.maxPrice || filters.sizes?.length || filters.inStock === false);

  /* Show hero only when no active search/filter */
  const showHero = !hasActiveFilters;

  useEffect(() => {
    if (location.hash !== "#shop") return;
    const target = document.getElementById("shop-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <main>
      {/* Hero */}
      {showHero && <HeroSection />}

      {/* Shop section */}
      <div id="shop-section" className="px-4 py-6 max-w-screen-2xl mx-auto">

        {/* Section label */}
        {showHero && (
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="font-mono-cyber text-[10px] tracking-[0.3em] text-neutral-400 uppercase">
              The Collection
            </span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>
        )}

        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4 flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            id="mobile-filter-toggle"
            className="flex-1 font-display tracking-wide border-neutral-200 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white transition-all"
          >
            {filterOpen ? (
              <><X size={14} className="mr-2" />Close Filters</>
            ) : (
              <><SlidersHorizontal size={14} className="mr-2" />Filters {hasActiveFilters && <span className="ml-1 text-black">•</span>}</>
            )}
          </Button>

          <div className="flex-1">
            <SortMenu onSortChange={handleSortChange} currentSort={filters.sort} />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Desktop sidebar filter */}
          <aside className="hidden lg:block lg:col-span-1">
            <ProductFilter
              onFilterChange={handleFilterChange}
              availableSizes={availableSizes}
              priceRange={priceRange}
              currentFilters={filters}
              isOpen={true}
            />
          </aside>

          {/* Mobile filter panel */}
          {filterOpen && (
            <div className="lg:hidden col-span-full mb-2 animate-slide-up">
              <div className="border border-neutral-200 rounded-xl p-4">
                <ProductFilter
                  onFilterChange={handleFilterChange}
                  availableSizes={availableSizes}
                  priceRange={priceRange}
                  currentFilters={filters}
                  isOpen={true}
                  onClose={() => setFilterOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Products grid */}
          <section aria-label="Products" className="lg:col-span-3">

            {/* AI Vibe Match UI Scaffolding - INTERACTIVE */}
            {filters.q && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-black/10 to-black/5 border border-black/20 hover:border-black/40 animate-slide-up flex gap-3 cursor-pointer group transition-all hover:bg-gradient-to-r hover:from-black/15 hover:to-black/10">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={14} className="text-white animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-bold tracking-wide text-black flex items-center gap-2 group-hover:text-neutral-900 transition-colors">
                    🔥 AI VIBE MATCH 
                    <span className="px-1.5 py-0.5 rounded text-[8px] bg-gradient-to-r from-electric-blue/30 to-purple/30 uppercase tracking-widest text-neutral-700 font-mono-cyber border border-black/10">ACTIVE</span>
                  </h3>
                  <p className="font-body text-xs text-neutral-600 mt-0.5 group-hover:text-neutral-700 transition-colors">
                    Finding fire fits for <span className="font-bold text-black">"{filters.q}"</span> →
                  </p>
                </div>
              </div>
            )}
            {/* Desktop: count + sort bar */}
            <div className="hidden lg:flex justify-between items-center mb-5">
              <p className="text-sm font-mono-cyber text-neutral-400 tracking-wide">
                {isLoading ? "—" : <><span className="text-neutral-900 font-semibold">{products.length}</span> products</>}
              </p>
              <SortMenu onSortChange={handleSortChange} currentSort={filters.sort} />
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !products.length && (
              <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingBag size={22} className="text-neutral-400" />
                </div>
                <div>
                  <p className="font-display font-semibold text-neutral-800 mb-1">
                    {filters.q ? `No results for "${filters.q}"` : "Nothing here yet"}
                  </p>
                  <p className="text-sm text-neutral-400 font-body">
                    {filters.q ? "Try a different search term or clear your filters." : "Check back soon — new drops weekly."}
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange({ sort: filters.sort })}
                    className="font-display tracking-wide text-xs"
                    id="clear-filters-btn"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}

            {/* Product grid */}
            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
