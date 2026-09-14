"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8"
    >
      <h2 className="text-xl font-bold">Yönetim verileri yüklenemedi</h2>
      <p className="mt-3 text-sm text-slate-400">
        Bağlantıyı ve yönetim veritabanı kurulumunu kontrol edin. Verileriniz
        değiştirilmedi.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950"
      >
        Tekrar dene
      </button>
    </div>
  );
}
