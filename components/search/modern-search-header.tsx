import { useState } from "react";
import { ModernMediaFilter } from "./modern-media-filter";

export function ModernSearchHeader({ initialType, initialYear, initialRating, initialProvider, initialGenre, initialCountry, onChange, onClear }) {
  const [type, setType] = useState(initialType || "movie");
  const [year, setYear] = useState(initialYear || "");
  const [minRating, setMinRating] = useState(initialRating || "");
  const [provider, setProvider] = useState(initialProvider || "");
  const [genre, setGenre] = useState(initialGenre || "");
  const [country, setCountry] = useState(initialCountry || "TR");

  function handleChange() {
    onChange({ type, year, minRating, provider, genre, country });
  }

  return (
    <div className="flex flex-col gap-6 items-center justify-center mb-10">
      <h1 className="text-4xl md:text-6xl font-black text-white text-center mb-2">Keşfet & Ara</h1>
      <p className="text-lg text-neutral-400 text-center mb-4">Filmleri, dizileri ve oyuncuları filtrele, keşfet ve ara.</p>
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
