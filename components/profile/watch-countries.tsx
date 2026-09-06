"use client";

import { Globe } from "lucide-react";

interface WatchCountriesProps {
  watchedItems?: any[];
  maxDisplay?: number;
}

// Ortak ülke isimlerini ISO kodlarına
const countryMap: { [key: string]: { name: string; iso: string; flag: string } } = {
  US: { name: "Amerika", iso: "US", flag: "🇺🇸" },
  GB: { name: "İngiltere", iso: "GB", flag: "🇬🇧" },
  JP: { name: "Japonya", iso: "JP", flag: "🇯🇵" },
  FR: { name: "Fransa", iso: "FR", flag: "🇫🇷" },
  DE: { name: "Almanya", iso: "DE", flag: "🇩🇪" },
  CN: { name: "Çin", iso: "CN", flag: "🇨🇳" },
  IN: { name: "Hindistan", iso: "IN", flag: "🇮🇳" },
  KR: { name: "Güney Kore", iso: "KR", flag: "🇰🇷" },
  BR: { name: "Brezilya", iso: "BR", flag: "🇧🇷" },
  ES: { name: "İspanya", iso: "ES", flag: "🇪🇸" },
  IT: { name: "İtalya", iso: "IT", flag: "🇮🇹" },
  CA: { name: "Kanada", iso: "CA", flag: "🇨🇦" },
  AU: { name: "Avustralya", iso: "AU", flag: "🇦🇺" },
  MX: { name: "Meksika", iso: "MX", flag: "🇲🇽" },
  RU: { name: "Rusya", iso: "RU", flag: "🇷🇺" },
  TR: { name: "Türkiye", iso: "TR", flag: "🇹🇷" },
};

export function WatchCountries({
  watchedItems = [],
  maxDisplay = 8,
}: WatchCountriesProps) {
  // Extract countries from watched items
  const countryStats: { [key: string]: number } = {};

  if (watchedItems && Array.isArray(watchedItems)) {
    watchedItems.forEach((item: any) => {
      if (item.media?.origin_country && Array.isArray(item.media.origin_country)) {
        item.media.origin_country.forEach((country: string) => {
          countryStats[country] = (countryStats[country] || 0) + 1;
        });
      }
    });
  }

  const countries = Object.entries(countryStats)
    .map(([iso, count]) => ({
      iso: iso.toUpperCase(),
      count,
      name: countryMap[iso.toUpperCase()]?.name || iso.toUpperCase(),
      flag: countryMap[iso.toUpperCase()]?.flag || "🌍",
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay);

  if (countries.length === 0) return null;

  const maxCount = Math.max(...countries.map((c) => c.count), 1);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-white tracking-tight uppercase">
          İzleme Haritası ({countries.length} Ülke)
        </h2>
      </div>

      <div className="space-y-2.5">
        {countries.map((country) => {
          const percentage = Math.round((country.count / maxCount) * 100);
          return (
            <div key={country.iso} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-white">{country.name}</p>
                    <p className="text-[10px] text-neutral-500">
                      {country.count} {country.count === 1 ? "içerik" : "içerik"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">{percentage}%</span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      <div className="text-xs text-neutral-500 font-medium text-center pt-2 border-t border-white/5">
        {Object.values(countryStats).reduce((a, b) => a + b, 0)} içerik ({Object.keys(countryStats).length} ülkeden)
      </div>
    </section>
  );
}
