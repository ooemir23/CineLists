
export const GENRE_MAP: Record<number, string> = {
    28: "Aksiyon",
    12: "Macera",
    10759: "Aksiyon & Macera",
    16: "Animasyon",
    35: "Komedi",
    80: "Suç",
    99: "Belgesel",
    18: "Dram",
    10751: "Aile",
    14: "Fantastik",
    10765: "Bilim Kurgu & Fantastik",
    36: "Tarih",
    27: "Korku",
    10402: "Müzik",
    9648: "Gizem",
    10749: "Romantik",
    878: "Bilim Kurgu",
    53: "Gerilim",
    10752: "Savaş",
    37: "Vahşi Batı",
    10762: "Çocuk",
    10764: "Reality",
    10763: "Haber",
    10767: "Talk Show",
    10766: "Pembe Dizi",
    10768: "Savaş & Politika",
    10770: "TV Film"
};

export const COMMON_GENRE_IDS = [
    28, 12, 10759, 16, 35, 80, 99, 18, 10751, 14, 10765, 36, 27, 9648, 10749, 878, 53, 10752, 10762
];

export function getPreferredGenreName(id: number, fallback: string): string {
    return GENRE_MAP[id] || fallback;
}
