// Achievement tanımları - "use server" dosyasından ayrıldı
// Çünkü "use server" sadece async function export edebilir

export interface AchievementDefinition {
  type: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  category: "watch" | "rate" | "social" | "list" | "special";
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // İzleme rozetleri
  { type: "FIRST_WATCH", label: "İlk Adım", description: "İlk film veya dizini izle", icon: "🎬", color: "from-green-400 to-emerald-600", category: "watch" },
  { type: "MOVIE_BUFF_10", label: "Sinema Sever", description: "10 film izle", icon: "🎥", color: "from-blue-400 to-blue-600", category: "watch" },
  { type: "MOVIE_BUFF_50", label: "Film Gurusu", description: "50 film izle", icon: "🎞️", color: "from-blue-400 to-indigo-600", category: "watch" },
  { type: "MOVIE_BUFF_100", label: "Film Ustası", description: "100 film izle", icon: "📽️", color: "from-indigo-400 to-purple-600", category: "watch" },
  { type: "MOVIE_BUFF_250", label: "Sinema Efsanesi", description: "250 film izle", icon: "🏆", color: "from-purple-400 to-pink-600", category: "watch" },
  { type: "MOVIE_BUFF_500", label: "Sinema Tanrısı", description: "500 film izle", icon: "👑", color: "from-amber-400 to-yellow-600", category: "watch" },
  { type: "TV_BINGER_5", label: "Dizi Başlangıcı", description: "5 dizi izle", icon: "📺", color: "from-teal-400 to-teal-600", category: "watch" },
  { type: "TV_BINGER_20", label: "Dizi Bağımlısı", description: "20 dizi izle", icon: "📺", color: "from-teal-400 to-cyan-600", category: "watch" },
  { type: "TV_BINGER_50", label: "Maratoncu", description: "50 dizi izle", icon: "📺", color: "from-cyan-400 to-blue-600", category: "watch" },
  { type: "EPISODE_MASTER_50", label: "Bölüm Avcısı", description: "50 bölüm izle", icon: "📋", color: "from-sky-400 to-sky-600", category: "watch" },
  { type: "EPISODE_MASTER_200", label: "Bölüm Ustası", description: "200 bölüm izle", icon: "📋", color: "from-sky-400 to-blue-600", category: "watch" },
  { type: "EPISODE_MASTER_500", label: "Bölüm Efsanesi", description: "500 bölüm izle", icon: "📋", color: "from-blue-400 to-indigo-600", category: "watch" },
  { type: "MARATHON_RUNNER", label: "Maratoncu", description: "Günde 3+ film izle", icon: "🏃", color: "from-red-400 to-orange-600", category: "watch" },

  // Puanlama rozetleri
  { type: "CRITIC_10", label: "Çaylak Eleştirmen", description: "10 içeriği puanla", icon: "⭐", color: "from-yellow-400 to-amber-600", category: "rate" },
  { type: "CRITIC_50", label: "Eleştirmen", description: "50 içeriği puanla", icon: "⭐", color: "from-amber-400 to-orange-600", category: "rate" },
  { type: "CRITIC_100", label: "Süper Eleştirmen", description: "100 içeriği puanla", icon: "⭐", color: "from-orange-400 to-red-600", category: "rate" },
  { type: "REVIEWER_5", label: "İnceleme Yazarı", description: "5 inceleme yaz", icon: "✍️", color: "from-pink-400 to-rose-600", category: "rate" },
  { type: "REVIEWER_25", label: "Profesyonel Yazar", description: "25 inceleme yaz", icon: "📝", color: "from-rose-400 to-red-600", category: "rate" },

  // Tür rozetleri
  { type: "GENRE_EXPLORER", label: "Tür Kaşifi", description: "5 farklı türden izle", icon: "🗺️", color: "from-emerald-400 to-green-600", category: "watch" },
  { type: "GENRE_MASTER", label: "Tür Ustası", description: "Bir türden 20+ izle", icon: "🎯", color: "from-violet-400 to-purple-600", category: "watch" },
  { type: "ALL_ROUNDER", label: "Her Şeye Meraklı", description: "10 farklı türden izle", icon: "🌈", color: "from-fuchsia-400 to-pink-600", category: "watch" },

  // Sosyal rozetler
  { type: "SOCIAL_5", label: "Sosyal Kelebek", description: "5 kişiyi takip et", icon: "🦋", color: "from-cyan-400 to-blue-600", category: "social" },
  { type: "SOCIAL_25", label: "Sosyal Ağ", description: "25 kişiyi takip et", icon: "🌐", color: "from-blue-400 to-indigo-600", category: "social" },
  { type: "INFLUENCER_10", label: "Popüler", description: "10 takipçi kazan", icon: "💎", color: "from-violet-400 to-purple-600", category: "social" },
  { type: "INFLUENCER_50", label: "Etkileyici", description: "50 takipçi kazan", icon: "💎", color: "from-purple-400 to-pink-600", category: "social" },
  { type: "RECOMMENDER", label: "Tavsiyeci", description: "5 öneri gönder", icon: "💡", color: "from-yellow-400 to-amber-600", category: "social" },
  { type: "COMMENTER_10", label: "Sohbetçi", description: "10 yorum yap", icon: "💬", color: "from-teal-400 to-cyan-600", category: "social" },
  { type: "COMMENTER_50", label: "Tartışmacı", description: "50 yorum yap", icon: "💬", color: "from-cyan-400 to-blue-600", category: "social" },



  // Özel rozetler
  { type: "EARLY_BIRD", label: "Erken Kuş", description: "Platformun erken kullanıcısı", icon: "🌅", color: "from-orange-400 to-red-600", category: "special" },
  { type: "NIGHT_OWL", label: "Gece Kuşu", description: "Gece 00:00-05:00 arası izle", icon: "🦉", color: "from-indigo-400 to-purple-600", category: "special" },
  { type: "WEEKEND_WARRIOR", label: "Hafta Sonu Savaşçısı", description: "Hafta sonu 10+ içerik izle", icon: "⚔️", color: "from-red-400 to-rose-600", category: "special" },
];
