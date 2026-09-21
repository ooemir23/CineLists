"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Activity,
  UserPlus,
  Globe2,
  Clock,
  X,
  Loader2,
  ArrowUpRight,
  Calendar,
  Monitor,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

type MetricData = {
  users: number;
  suspended: number;
  onlineCount: number;
  active: number;
  newUsers: number;
  views: number;
  totalMinutes: number;
};

type MetricCardsProps = {
  days: number;
  data: MetricData;
};

type ModalItem = {
  id: string;
  name: string | null;
  username: string;
  email: string | null;
  image: string | null;
  hasCompletedOnboarding: boolean;
  isSuspended: boolean;
  countryLabel: string;
  date: string | null;
  formattedDate: string;
  watchedCount?: number;
  totalMinutes?: number;
};

type ModalResponse = {
  title: string;
  subtitle: string;
  type: "users" | "views-breakdown";
  dateLabel?: string;
  items?: ModalItem[];
  paths?: { path: string; label: string; views: number }[];
  devices?: { device: string; views: number }[];
  audience?: { audience: string; views: number }[];
};

export function MetricCards({ days, data }: MetricCardsProps) {
  const [activeType, setActiveType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCardClick = (type: string) => {
    setActiveType(type);
    setIsLoading(true);
    setError(null);
    setModalData(null);

    fetch(`/api/admin/metric-details?type=${type}&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error("Veriler alınamadı");
        return res.json();
      })
      .then((resData) => {
        setModalData(resData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Metric detail fetch error:", err);
        setError("Detaylar yüklenirken bir hata oluştu.");
        setIsLoading(false);
      });
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveType(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const numberFormat = (v: number) => v.toLocaleString("tr-TR");

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {/* 1. Kayıtlı kullanıcı */}
        <button
          type="button"
          onClick={() => handleCardClick("users")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-amber-400/40 hover:bg-slate-900 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Kayıtlı kullanıcı</span>
            <span className="text-amber-400 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {numberFormat(data.users)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{numberFormat(data.suspended)} hesap askıda</span>
            <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
              Detaylar ↗
            </span>
          </div>
        </button>

        {/* 2. Anlık Çevrimiçi */}
        <button
          type="button"
          onClick={() => handleCardClick("online")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-emerald-500/40 hover:bg-slate-900 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Anlık Çevrimiçi</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
            {numberFormat(data.onlineCount)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Son 5 dakikada aktif</span>
            <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Gör ↗
            </span>
          </div>
        </button>

        {/* 3. Aktif üye */}
        <button
          type="button"
          onClick={() => handleCardClick("active")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-amber-400/40 hover:bg-slate-900 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Aktif üye</span>
            <span className="text-amber-400 group-hover:scale-110 transition-transform">
              <Activity size={18} />
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {numberFormat(data.active)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Son {days} günde ölçülen</span>
            <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
              Detaylar ↗
            </span>
          </div>
        </button>

        {/* 4. Yeni kayıt */}
        <button
          type="button"
          onClick={() => handleCardClick("new-users")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-amber-400/40 hover:bg-slate-900 focus:outline-none ring-1 ring-amber-400/20"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Yeni kayıt</span>
            <span className="text-amber-400 group-hover:scale-110 transition-transform">
              <UserPlus size={18} />
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {numberFormat(data.newUsers)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Son {days} gün</span>
            <span className="text-[10px] text-amber-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Kayıtları gör ↗
            </span>
          </div>
        </button>

        {/* 5. Sayfa görüntüleme */}
        <button
          type="button"
          onClick={() => handleCardClick("views")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-amber-400/40 hover:bg-slate-900 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Sayfa görüntüleme</span>
            <span className="text-amber-400 group-hover:scale-110 transition-transform">
              <Globe2 size={18} />
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {numberFormat(data.views)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Son {days} gün</span>
            <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
              Sayfalar ↗
            </span>
          </div>
        </button>

        {/* 6. Sitede süre */}
        <button
          type="button"
          onClick={() => handleCardClick("duration")}
          className="group relative rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left transition-all hover:scale-[1.02] hover:border-amber-400/40 hover:bg-slate-900 focus:outline-none"
        >
          <div className="flex items-center justify-between gap-2 text-sm text-slate-400">
            <span>Sitede süre</span>
            <span className="text-amber-400 group-hover:scale-110 transition-transform">
              <Clock size={18} />
            </span>
          </div>
          <p className="mt-4 font-bricolage text-3xl font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
            {data.totalMinutes >= 60
              ? `${Math.floor(data.totalMinutes / 60)} sa ${data.totalMinutes % 60} dk`
              : `${data.totalMinutes} dk`}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {data.active > 0
                ? `Ort. ${Math.round(data.totalMinutes / data.active)} dk / üye`
                : "Toplam aktiflik"}
            </span>
            <span className="text-[10px] text-amber-400/80 opacity-0 group-hover:opacity-100 transition-opacity">
              Sıralama ↗
            </span>
          </div>
        </button>
      </div>

      {/* Drill-down Modal */}
      {activeType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveType(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-bricolage text-lg font-bold text-white">
                  {modalData?.title || "Yükleniyor..."}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {modalData?.subtitle || "İlgili veriler getiriliyor..."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveType(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                <p className="mt-3 text-sm">Veriler hazırlanıyor...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-rose-400 text-sm">
                {error}
              </div>
            ) : modalData?.type === "users" && modalData.items ? (
              <div className="mt-5 space-y-3">
                {modalData.items.length > 0 ? (
                  modalData.items.map((user) => (
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
                            (user.name || user.username || "U").slice(0, 2).toUpperCase()
                          )}
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="truncate font-bold font-mono text-sm text-white hover:text-amber-400 transition-colors"
                            >
                              {user.email || user.name || user.username}
                            </Link>
                            {user.isSuspended ? (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                                Askıda
                              </span>
                            ) : !user.hasCompletedOnboarding ? (
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                                Kurulum eksik
                              </span>
                            ) : (
                              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                                Aktif
                              </span>
                            )}
                          </div>

                          <p className="truncate text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-amber-300">@{user.username}</span>
                            {user.name && user.name !== user.email && user.name !== user.username && (
                              <span className="text-slate-300"> · {user.name}</span>
                            )}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
                            {user.formattedDate && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 font-medium text-amber-300">
                                <Calendar size={11} />
                                {modalData.dateLabel ? `${modalData.dateLabel}: ` : ""}
                                {user.formattedDate}
                              </span>
                            )}
                            <span>{user.countryLabel}</span>
                            {typeof user.watchedCount === "number" && (
                              <span>{user.watchedCount} izleme</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-400/20 transition-colors shrink-0"
                      >
                        İncele <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-500 text-xs rounded-xl border border-dashed border-white/10">
                    Seçili dönemde listelenecek kullanıcı kaydı bulunamadı.
                  </div>
                )}

                {activeType === "users" && (
                  <div className="pt-3 text-center">
                    <Link
                      href="/admin?tab=users"
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors"
                    >
                      Kullanıcı Dizininin Tamamını Gör <ExternalLink size={13} />
                    </Link>
                  </div>
                )}
              </div>
            ) : modalData?.type === "views-breakdown" ? (
              <div className="mt-5 space-y-5">
                {/* Paths */}
                {modalData.paths && modalData.paths.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Eye size={14} className="text-amber-400" /> En Çok Görüntülenen Sayfalar
                    </h4>
                    <div className="space-y-1.5">
                      {modalData.paths.map((p) => (
                        <div
                          key={p.path}
                          className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 text-xs"
                        >
                          <span className="font-medium text-slate-200">
                            {p.label}{" "}
                            <span className="font-mono text-slate-500 text-[11px]">({p.path})</span>
                          </span>
                          <span className="font-bold text-amber-400">
                            {numberFormat(p.views)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Devices & Audience */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {modalData.devices && (
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                        <Monitor size={13} className="text-amber-400" /> Cihaz Dağılımı
                      </p>
                      <div className="space-y-1 text-xs">
                        {modalData.devices.map((d) => (
                          <div key={d.device} className="flex justify-between">
                            <span className="text-slate-400 capitalize">
                              {d.device === "desktop" ? "Masaüstü" : d.device === "mobile" ? "Mobil" : d.device}
                            </span>
                            <span className="text-white font-medium">{numberFormat(d.views)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalData.audience && (
                    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-3">
                      <p className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                        <Users size={13} className="text-amber-400" /> Ziyaretçi Türü
                      </p>
                      <div className="space-y-1 text-xs">
                        {modalData.audience.map((a) => (
                          <div key={a.audience} className="flex justify-between">
                            <span className="text-slate-400">
                              {a.audience === "member" ? "Üye Görüntülemeleri" : "Misafir Görüntülemeleri"}
                            </span>
                            <span className="text-white font-medium">{numberFormat(a.views)}</span>
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
    </>
  );
}
