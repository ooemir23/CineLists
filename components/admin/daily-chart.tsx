"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Eye,
  Globe,
  Monitor,
  Clock,
  Film,
  X,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export type DailyChartRow = {
  date: string; // "YYYY-MM-DD"
  label: string; // "21 Eyl"
  value: number;
};

type DayDetails = {
  date: string;
  formattedDate: string;
  totalViews: number;
  memberViews: number;
  guestViews: number;
  paths: { path: string; views: number }[];
  devices: { device: string; views: number }[];
  countries: { country: string; label: string; views: number }[];
  users: {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    image: string | null;
    country: string | null;
    countryLabel: string;
    totalMinutes: number;
    lastSeenAt: string | null;
    isSuspended: boolean;
    watchedCount: number;
    episodeCount: number;
    viewsOnDate: number | null;
  }[];
};

export function DailyChart({ rows }: { rows: DailyChartRow[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [details, setDetails] = useState<DayDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!rows.some((row) => row.value > 0)) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
        Seçili dönemde ölçüm bulunmuyor.
      </p>
    );
  }

  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(1, ...rows.map((row) => row.value));

  const handleBarClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsLoading(true);
    setError(null);
    setDetails(null);

    fetch(`/api/admin/daily-visitors?date=${dateStr}`)
      .then((res) => {
        if (!res.ok) throw new Error("Veri alınamadı");
        return res.json();
      })
      .then((data) => {
        setDetails(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Görüntüleyenler alınamadı:", err);
        setError("Ziyaretçi detayları yüklenirken bir hata oluştu.");
        setIsLoading(false);
      });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDate(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      {/* Scale & Peak Indicators */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-xs">
        <span className="text-slate-400">
          Zirve: <strong className="text-amber-400">{max.toLocaleString("tr-TR")}</strong> görüntüleme/gün
        </span>
        <span className="text-slate-400">
          Toplam: <strong className="text-white">{total.toLocaleString("tr-TR")}</strong>
        </span>
      </div>

      <div className="relative">
        {/* Subtle Horizontal Guidelines */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-b border-dashed border-white/10 text-[10px] text-slate-600">
          <span className="absolute -top-3 right-0">{max.toLocaleString("tr-TR")}</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-white/5 text-[10px] text-slate-600">
          <span className="absolute -top-3 right-0">{Math.round(max / 2).toLocaleString("tr-TR")}</span>
        </div>

        {/* Bars Container */}
        <div
          className="flex h-40 items-end gap-1 pt-2"
          role="img"
          aria-label={`Günlük sayfa görüntülemeleri. Toplam ${total.toLocaleString("tr-TR")}.`}
        >
          {rows.map((row) => {
            const isSelected = selectedDate === row.date;
            return (
              <button
                key={row.date}
                type="button"
                onClick={() => handleBarClick(row.date)}
                className="group relative flex h-full min-w-0 flex-1 items-end focus:outline-none"
                title={`${row.label}: ${row.value.toLocaleString("tr-TR")} görüntüleme (Detayları görmek için tıklayın)`}
              >
                {/* Interactive hover tooltip card */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 z-30 whitespace-nowrap rounded-lg border border-white/15 bg-slate-950/95 px-2.5 py-1.5 text-center text-xs shadow-2xl backdrop-blur-sm group-hover:block">
                  <span className="font-bold text-amber-400">{row.value.toLocaleString("tr-TR")}</span>
                  <span className="ml-1 text-[11px] text-slate-300">görüntüleme</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{row.label}</div>
                  <div className="mt-1 text-[9px] text-amber-300/80 font-semibold border-t border-white/10 pt-0.5">
                    Görüntüleyenleri gör ↗
                  </div>
                </div>

                <div
                  className={`w-full rounded-t transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 bg-amber-300 scale-105 z-10"
                      : row.value > 0
                        ? "bg-gradient-to-t from-amber-600/70 to-amber-300 group-hover:from-amber-500 group-hover:to-amber-200 group-hover:scale-105"
                        : "bg-white/10 hover:bg-white/20"
                  }`}
                  style={{
                    height: row.value
                      ? `${Math.max(4, (row.value / max) * 100)}%`
                      : "2px",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>{rows[0]?.label}</span>
        <span className="flex items-center gap-1 text-[11px] text-amber-400/80">
          👆 Bir güne tıklayarak görüntüleyenleri inceleyin
        </span>
        <span>{rows.at(-1)?.label}</span>
      </div>

      <details className="mt-4 text-xs text-slate-400">
        <summary className="cursor-pointer hover:text-white transition-colors">
          Günlük değerleri göster
        </summary>
        <div className="mt-3 grid max-h-48 grid-cols-2 gap-2 overflow-auto">
          {rows.map((row) => (
            <button
              key={row.date}
              type="button"
              onClick={() => handleBarClick(row.date)}
              className={`text-left p-1 rounded hover:bg-white/5 transition-colors flex justify-between ${
                row.value > 0 ? "text-amber-300" : "text-slate-500"
              }`}
            >
              <span>{row.label}</span>
              <span className={row.value > 0 ? "text-white font-bold" : "text-slate-500"}>
                {row.value.toLocaleString("tr-TR")}
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* Detail Inspection Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setSelectedDate(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="font-bricolage text-lg font-bold text-white">
                    {details?.formattedDate || selectedDate} Ziyaret Detayları
                  </h3>
                  <p className="text-xs text-slate-400">
                    Görüntüleme yapan kullanıcılar ve trafik dökümü
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="mt-3 text-sm">Ziyaretçiler taranıyor...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-rose-400 text-sm">
                {error}
              </div>
            ) : details ? (
              <div className="mt-5 space-y-6">
                {/* Stats Summary Pills */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-center">
                    <p className="text-[11px] text-slate-400">Toplam Görüntüleme</p>
                    <p className="mt-1 font-bricolage text-xl font-bold text-white">
                      {details.totalViews.toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-center">
                    <p className="text-[11px] text-emerald-400">Üye Görüntülemesi</p>
                    <p className="mt-1 font-bricolage text-xl font-bold text-emerald-300">
                      {details.memberViews.toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-center">
                    <p className="text-[11px] text-slate-400">Misafir Görüntülemesi</p>
                    <p className="mt-1 font-bricolage text-xl font-bold text-slate-300">
                      {details.guestViews.toLocaleString("tr-TR")}
                    </p>
                  </div>
                </div>

                {/* Section: Registered Users */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                      <Users size={16} className="text-amber-400" />
                      Görüntüleme Yapan Üyeler ({details.users.length})
                    </h4>
                    {details.users.length > 0 && (
                      <span className="text-[11px] text-slate-400">
                        O gün aktif olan veya görüntüleme yapan kayıtlı hesaplar
                      </span>
                    )}
                  </div>

                  {details.users.length > 0 ? (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {details.users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 hover:border-amber-400/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white overflow-hidden border border-white/10">
                              {user.image ? (
                                <Image
                                  src={user.image}
                                  alt={user.name || user.username}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                (user.name || user.username).slice(0, 2).toUpperCase()
                              )}
                            </div>

                            {/* User details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/users/${user.id}`}
                                  className="truncate font-bold text-sm text-white hover:text-amber-400 transition-colors"
                                >
                                  {user.name || user.username}
                                </Link>
                                {user.isSuspended && (
                                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                                    Askıda
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-xs text-slate-400">
                                @{user.username} {user.email && `· ${user.email}`}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Globe size={11} className="text-amber-400" />
                                  {user.countryLabel}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock size={11} className="text-slate-500" />
                                  {user.totalMinutes > 0 ? `${user.totalMinutes} dk aktif` : "< 1 dk"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Film size={11} className="text-slate-500" />
                                  {user.watchedCount} izleme
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors"
                            >
                              İncele <ArrowUpRight size={13} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                      Bu tarihte kayıtlı üye oturumu tespit edilmedi. Tüm görüntülemeler misafir (anonim) ziyaretçiler tarafından yapılmış olabilir.
                    </div>
                  )}
                </div>

                {/* Section: Paths & Pages Visited */}
                {details.paths.length > 0 && (
                  <div>
                    <h4 className="mb-2.5 flex items-center gap-2 text-sm font-bold text-white">
                      <Eye size={16} className="text-amber-400" />
                      Gezilen Sayfalar
                    </h4>
                    <div className="space-y-1.5">
                      {details.paths.map((p) => (
                        <div
                          key={p.path}
                          className="flex items-center justify-between rounded-lg bg-slate-950/50 px-3 py-2 text-xs"
                        >
                          <span className="font-mono text-slate-300">{p.path}</span>
                          <span className="font-bold text-amber-400">
                            {p.views.toLocaleString("tr-TR")} görüntüleme
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Devices & Countries */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {details.devices.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                        <Monitor size={14} className="text-amber-400" /> Cihazlar
                      </p>
                      <div className="space-y-1">
                        {details.devices.map((d) => (
                          <div key={d.device} className="flex justify-between text-xs">
                            <span className="text-slate-400 capitalize">
                              {d.device === "desktop" ? "Masaüstü" : d.device === "mobile" ? "Mobil" : d.device}
                            </span>
                            <span className="text-white font-medium">{d.views}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.countries.length > 0 && (
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                        <Globe size={14} className="text-amber-400" /> Ülkeler
                      </p>
                      <div className="space-y-1">
                        {details.countries.map((c) => (
                          <div key={c.country} className="flex justify-between text-xs">
                            <span className="text-slate-400">{c.label}</span>
                            <span className="text-white font-medium">{c.views}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
