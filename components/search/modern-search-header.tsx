import { useState } from "react";
import { ModernMediaFilter } from "./modern-media-filter";

export function ModernSearchHeader({
  initialType,
  initialYear,
  initialRating,
  initialProvider,
  initialGenre,
  initialCountry,
  onChange,
  onClear,
  onSearch
}: {
  initialType?: "movie" | "tv";
  initialYear?: string;
  initialRating?: string;
  initialProvider?: string;
  initialGenre?: string;
  initialCountry?: string;
  onChange: (filters: { type: "movie" | "tv"; year: string; minRating: string; provider: string; genre: string; country: string; q?: string }) => void;
  onClear: () => void;
  onSearch?: (query: string) => void;
}) {
  const [type, setType] = useState(initialType || "movie");
  const [year, setYear] = useState(initialYear || "");
  const [minRating, setMinRating] = useState(initialRating || "");
  const [provider, setProvider] = useState(initialProvider || "");
  const [genre, setGenre] = useState(initialGenre || "");
  const [country, setCountry] = useState(initialCountry || "TR");


  const [searchInput, setSearchInput] = useState("");

  function handleChange() {
    onChange({ type, year, minRating, provider, genre, country });
  }

  function handleSearchClick() {
    if (onSearch) {
      onSearch(searchInput);
    } else {
      onChange({ type, year, minRating, provider, genre, country, q: searchInput });
    }
  }

  return (
    <div className="flex flex-col gap-6 items-center justify-center mb-10">
      <h1 className="text-4xl md:text-6xl font-black text-white text-center mb-2">Keşfet & Ara</h1>
      <p className="text-lg text-neutral-400 text-center mb-4">Filmleri, dizileri ve oyuncuları filtrele, keşfet ve ara.</p>
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl items-center justify-center">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Film, dizi veya oyuncu ara..."
          className="w-full md:w-96 px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSearchClick}
          className="px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
        >
          Ara
        </button>
      </div>
      <ModernMediaFilter
        type={type}
        setType={v => { setType(v); handleChange(); }}
        year={year}
        setYear={v => { setYear(v); handleChange(); }}
        minRating={minRating}
        setMinRating={v => { setMinRating(v); handleChange(); }}
        provider={provider}
        setProvider={v => { setProvider(v); handleChange(); }}
        genre={genre}
        setGenre={v => { setGenre(v); handleChange(); }}
        country={country}
        setCountry={v => { setCountry(v); handleChange(); }}
        onClear={() => {
          setType("movie"); setYear(""); setMinRating(""); setProvider(""); setGenre(""); setCountry("TR"); onClear();
        }}
      />
    </div>
  );
}
