"use client";
import { useRouter } from "next/navigation";
import { Search, Film, Tv, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { SEARCH_SUGGESTIONS } from "./search-suggestions";
import Image from "next/image";

export function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
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
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const content = await res.text();
          try {
            const data = JSON.parse(content);
            // API artık doğrudan dizi döndürüyor
            setSuggestions(Array.isArray(data) ? data : []);
            setShowSuggestions(true);
          } catch (jsonErr) {
            console.error("Arama önerisi JSON hatası:", jsonErr, "İçerik:", content.substring(0, 100));
          }
        }
      } catch (fetchErr) {
        console.error("Arama önerisi fetch hatası:", fetchErr);
      }
    }, 300);
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
    setQuery("");
    if (s.type === "person") {
      router.push(`/person/${s.id}`);
    } else if (s.type === "movie" || s.type === "tv") {
      router.push(`/${s.type}/${s.id}`);
    } else if (s.type === "user") {
      router.push(`/profile/${s.id}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(s.name)}`);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-5 h-5 text-amber-400" />;
      case "tv":
        return <Tv className="w-5 h-5 text-blue-400" />;
      case "person":
        return <User className="w-5 h-5 text-green-400" />;
      default:
        return <User className="w-5 h-5 text-purple-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "movie":
        return "Film";
      case "tv":
        return "Dizi";
      case "person":
        return "Kişi";
      default:
        return "Kullanıcı";
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ zIndex: 99998 }}
          onClick={() => setShowSuggestions(false)}
        />
      )}

      <div className="relative w-full">
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex items-center bg-white/10 border border-white/10 rounded-2xl px-5 py-3 shadow-lg focus-within:ring-2 focus-within:ring-primary/40 transition-all w-full relative"
          style={{ zIndex: 99999 }}
        >
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.trim() && setShowSuggestions(true)}
            placeholder={placeholder || "Film, dizi veya kişi ara..."}
            className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-400 text-base md:text-lg font-medium"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="mr-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          )}
          <button type="submit" className="p-2.5 rounded-full bg-primary hover:bg-primary/90 transition-colors">
            <Search className="w-5 h-5 text-background" />
          </button>
        </form>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="fixed left-1/2 -translate-x-1/2 top-32 w-full max-w-3xl px-4"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-[#1A202C] border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Arama Sonuçları
                  </h3>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Results */}
              <ul className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {suggestions.map((s: any) => (
                  <li
                    key={s.type + s.id}
                    className="group"
                  >
                    <button
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                    >
                      {/* Image */}
                      <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
                        {s.image ? (
                          <Image
                            src={s.image}
                            alt={s.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {getTypeIcon(s.type)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left">
                        <h4 className="text-base md:text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-1">
                          {s.name}
                        </h4>
                        {s.year && (
                          <p className="text-sm text-neutral-500 font-medium mt-0.5">
                            {s.year}
                          </p>
                        )}
                      </div>

                      {/* Type Badge */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 shrink-0">
                        {getTypeIcon(s.type)}
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {getTypeLabel(s.type)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-white/10 bg-white/5">
                <p className="text-xs text-neutral-500 text-center font-medium">
                  Tüm sonuçları görmek için Enter'a basın
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
