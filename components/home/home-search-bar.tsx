"use client";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SEARCH_SUGGESTIONS } from "./search-suggestions";

export function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPlaceholder(SEARCH_SUGGESTIONS[Math.floor(Math.random() * SEARCH_SUGGESTIONS.length)]);
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        setSuggestions(await res.json());
        setShowSuggestions(true);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  function handleSuggestionClick(s: any) {
    setShowSuggestions(false);
    if (s.type === "person") {
      router.push(`/person/${s.id}`);
    } else if (s.type === "movie" || s.type === "tv") {
      router.push(`/${s.type}/${s.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(s.name)}`);
    }
  }

  return (
    <div className="relative w-full max-w-md ml-0 md:ml-8">
      <form
        onSubmit={handleSubmit}
        autoComplete="off"
        className="flex items-center bg-white/10 border border-white/10 rounded-2xl px-4 py-2 shadow-lg focus-within:ring-2 focus-within:ring-primary/40 transition-all w-full"
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || "Film, dizi veya kişi ara..."}
          className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-400 text-base md:text-lg font-medium"
          autoComplete="off"
        />
        <button type="submit" className="ml-2 p-2 rounded-full bg-primary hover:bg-primary/90 transition-colors">
          <Search className="w-5 h-5 text-background" />
        </button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 mt-1 bg-card border border-white/10 rounded-xl shadow-lg z-50 max-h-72 overflow-y-auto">
          {suggestions.map((s: any) => (
            <li
              key={s.type + s.id}
              className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-primary/10 text-white"
              onMouseDown={() => handleSuggestionClick(s)}
            >
              {s.image && <img src={s.image} alt={s.name} className="w-8 h-8 rounded object-cover bg-neutral-800" />}
              <span className="font-medium">{s.name}</span>
              <span className="ml-auto text-xs text-primary/80">{s.type === "movie" ? "Film" : s.type === "tv" ? "Dizi" : "Kişi"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
