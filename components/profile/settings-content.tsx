"use client";

import { useState, useTransition } from "react";
import {
    X,
    User,
    Lock,
    Eye,
    EyeOff,
    Check,
    Loader2,
    Camera,
    Shield,
    Activity,
    BarChart3,
    Smartphone,
    Trash2,
    AlertTriangle,
    History,
    Sparkles,
    CheckCircle2,
    Heart,
    Monitor,
    Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { updateProfile, updatePrivacySettings, deleteAccount, suspendAccount, checkUsernameAvailability, updateUserPreferences } from "@/lib/profile-actions";
import Image from "next/image";
import { handleSignOut } from "@/lib/auth-actions";

type UserData = {
    id: string;
    name: string | null;
    username: string;
    email: string | null;
    image: string | null;
    bio: string | null;
    isPrivate: boolean;
    showActivities: boolean;
    showStats: boolean;
    favoriteGenres: string[];
    platforms: string[];
    allGenres: { id: number; name: string }[];
};

type SettingsContentProps = {
    user: UserData;
    activeTab: "general" | "privacy" | "preferences" | "account";
};

export function SettingsContent({ user, activeTab }: SettingsContentProps) {
    const [isPending, startTransition] = useTransition();

    // Form States
    const [name, setName] = useState(user.name || "");
    const [username, setUsername] = useState(user.username || "");
    const [bio, setBio] = useState(user.bio || "");
    const [image, setImage] = useState(user.image || "");

    const [favoriteGenres, setFavoriteGenres] = useState<string[]>(user.favoriteGenres || []);
    // Handle legacy platform strings ("netflix", "disney", etc) to TMDB IDs
    const legacyMap: Record<string, string> = {
        "netflix": "8",
        "disney": "337",
        "prime": "119",
        "blutv": "301",
        "mubi": "11",
        "apple": "2"
    };

    const initialPlatforms = (user.platforms || []).map(p => legacyMap[p] || p);
    const [platforms, setPlatforms] = useState<string[]>(initialPlatforms);

    // Search filters
    const [genreSearch, setGenreSearch] = useState("");
    const [platformSearch, setPlatformSearch] = useState("");

    // Username feedback
    const [usernameError, setUsernameError] = useState("");
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);

    const [isPrivate, setIsPrivate] = useState(user.isPrivate);
    const [showActivities, setShowActivities] = useState(user.showActivities);
    const [showStats, setShowStats] = useState(user.showStats);

    // Delete/Suspend States
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
    const [showAllGenres, setShowAllGenres] = useState(false);

    const handleUsernameChange = async (val: string) => {
        setUsername(val);
        if (val.length >= 3 && val !== user.username) {
            setIsCheckingUsername(true);
            const res = await checkUsernameAvailability(val);
            if (!res.available) {
                setUsernameError(res.message || "Bu kullanıcı adı kullanılamaz");
            } else {
                setUsernameError("");
            }
            setIsCheckingUsername(false);
        } else {
            setUsernameError("");
        }
    };

    const handleSaveGeneral = () => {
        if (usernameError) return;
        startTransition(async () => {
            const result = await updateProfile({ name, username, bio, image });
            if (result.success) {
                alert("Kaydedildi");
            } else if (result.error) {
                alert(result.error);
            }
        });
    };

    const handleSavePrivacy = () => {
        startTransition(async () => {
            const result = await updatePrivacySettings({ isPrivate, showActivities, showStats });
            if (result.success) {
                alert("Kaydedildi");
            } else if (result.error) {
                alert(result.error);
            }
        });
    };

    const handleDeleteAccount = () => {
        startTransition(async () => {
            const result = await deleteAccount();
            if (result.success) {
                await handleSignOut();
                window.location.href = "/login";
            } else {
                alert(result.error);
            }
        });
    };

    const handleSuspendAccount = () => {
        startTransition(async () => {
            const result = await suspendAccount();
            if (result.success) {
                await handleSignOut();
                window.location.href = "/login";
            } else {
                alert(result.error);
            }
        });
    };

    const handleSavePreferences = () => {
        startTransition(async () => {
            const result = await updateUserPreferences({ favoriteGenres, platforms });
            if (result.success) {
                alert("Kaydedildi");
            } else if (result.error) {
                alert(result.error);
            }
        });
    };

    const platformItems = user.allPlatforms || [
        { id: "netflix", name: "Netflix", icon: "https://www.google.com/s2/favicons?domain=netflix.com&sz=64" },
        { id: "disney", name: "Disney+", icon: "https://www.google.com/s2/favicons?domain=disneyplus.com&sz=64" },
        { id: "prime", name: "Prime Video", icon: "https://www.google.com/s2/favicons?domain=primevideo.com&sz=64" },
        { id: "blutv", name: "BluTV", icon: "https://www.google.com/s2/favicons?domain=blutv.com&sz=64" },
        { id: "mubi", name: "MUBI", icon: "https://www.google.com/s2/favicons?domain=mubi.com&sz=64" },
        { id: "apple", name: "Apple TV+", icon: "https://www.google.com/s2/favicons?domain=tv.apple.com&sz=64" },
    ];

    const tabs = [
        { id: "general", label: "Genel", icon: User },
        { id: "privacy", label: "Gizlilik", icon: Shield },
        { id: "preferences", label: "Tercihler", icon: Sparkles },
        { id: "account", label: "Hesap", icon: Smartphone },
    ];

    return (
        <div className="w-full">
            <div className="flex flex-col relative">
                <div className="flex-1 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "general" && (
                                <motion.div
                                    key="general"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-white mb-1">Profil Bilgileri</h3>
                                        <p className="text-xs text-neutral-500 font-medium font-bold uppercase tracking-wider">Kişisel bilgilerinizi buradan güncelleyebilirsiniz.</p>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-neutral-800 border-2 border-white/5 group-hover:border-primary/50 transition-colors relative">
                                                {image ? (
                                                    <Image src={image} alt="Profile" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                    <Camera className="text-white w-6 h-6" />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-center mt-2 text-neutral-500 font-bold uppercase">Değiştir</p>
                                        </div>

                                        <div className="flex-1 space-y-6 w-full">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Görünen İsim</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08]"
                                                    placeholder="Adınız Soyadınız"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Kullanıcı Adı</label>
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">@</span>
                                                    <input
                                                        type="text"
                                                        value={username}
                                                        onChange={(e) => handleUsernameChange(e.target.value)}
                                                        className={cn(
                                                            "w-full bg-white/5 border rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold text-white focus:outline-none focus:ring-2 transition-all hover:bg-white/[0.08]",
                                                            usernameError ? "border-rose-500 focus:ring-rose-500/50" : "border-white/5 focus:ring-primary/50"
                                                        )}
                                                        placeholder="kullaniciadi"
                                                    />
                                                    {isCheckingUsername && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <Loader2 size={16} className="animate-spin text-neutral-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                {usernameError && (
                                                    <p className="text-[10px] font-bold text-rose-500 px-2 uppercase tracking-wider">{usernameError}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">Biyografi</label>
                                                <textarea
                                                    value={bio}
                                                    onChange={(e) => setBio(e.target.value)}
                                                    rows={3}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all hover:bg-white/[0.08] resize-none"
                                                    placeholder="Kendinden bahset..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleSaveGeneral}
                                            disabled={isPending}
                                            className="px-8 py-3.5 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            Değişiklikleri Kaydet
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "privacy" && (
                                <motion.div
                                    key="privacy"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-white mb-1">Gizlilik ve Görünürlük</h3>
                                        <p className="text-xs text-neutral-500 font-medium font-bold uppercase tracking-wider">Profilinizin ve aktivitelerinizin kimler tarafından görülebileceğini seçin.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Toggles... */}
                                        <div
                                            onClick={() => setIsPrivate(!isPrivate)}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all group",
                                                isPrivate ? "bg-primary/5 border-primary/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl transition-colors",
                                                    isPrivate ? "bg-primary text-background" : "bg-white/5 text-neutral-400"
                                                )}>
                                                    {isPrivate ? <Lock size={20} /> : <Eye size={20} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">Gizli Profil</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">Sadece takipçilerin profilini görebilir.</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-12 h-6 rounded-full relative transition-colors",
                                                isPrivate ? "bg-primary" : "bg-neutral-800"
                                            )}>
                                                <div className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                                    isPrivate ? "right-1" : "left-1"
                                                )} />
                                            </div>
                                        </div>
                                        {/* Diğer togglelar... */}
                                        <div
                                            onClick={() => setShowActivities(!showActivities)}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all group",
                                                showActivities ? "bg-emerald-500/5 border-emerald-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl transition-colors",
                                                    showActivities ? "bg-emerald-500 text-white" : "bg-white/5 text-neutral-400"
                                                )}>
                                                    <Activity size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">Aktiviteleri Göster</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">İzleme ve puanlama aktivitelerin akışta görünür.</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-12 h-6 rounded-full relative transition-colors",
                                                showActivities ? "bg-emerald-500" : "bg-neutral-800"
                                            )}>
                                                <div className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                                    showActivities ? "right-1" : "left-1"
                                                )} />
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setShowStats(!showStats)}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all group",
                                                showStats ? "bg-amber-500/5 border-amber-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl transition-colors",
                                                    showStats ? "bg-amber-500 text-white" : "bg-white/5 text-neutral-400"
                                                )}>
                                                    <BarChart3 size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">İstatistikleri Göster</p>
                                                    <p className="text-[10px] text-neutral-500 font-bold uppercase">Profilindeki toplam izleme sayıları başkalarına görünür.</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-12 h-6 rounded-full relative transition-colors",
                                                showStats ? "bg-amber-500" : "bg-neutral-800"
                                            )}>
                                                <div className={cn(
                                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                                    showStats ? "right-1" : "left-1"
                                                )} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleSavePrivacy}
                                            disabled={isPending}
                                            className="px-8 py-3.5 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            Gizlilik Ayarlarını Kaydet
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "preferences" && (
                                <motion.div
                                    key="preferences"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8 pb-10"
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-white mb-1">İzleme Tercihleri</h3>
                                        <p className="text-xs text-neutral-500 font-medium font-bold uppercase tracking-wider">Size özel önerilerimizi bu tercihlerine göre şekillendiriyoruz.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <h4 className="text-sm font-black text-white px-1 flex items-center gap-2">
                                                    <Heart size={16} className="text-primary fill-current" />
                                                    Favori Türler
                                                </h4>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Tür ara..."
                                                        value={genreSearch}
                                                        onChange={(e) => setGenreSearch(e.target.value)}
                                                        className="w-full sm:w-48 pl-8 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-primary/50 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {user.allGenres
                                                    .filter(g => g.name.toLowerCase().includes(genreSearch.toLowerCase()))
                                                    .slice(0, showAllGenres || genreSearch ? undefined : 9)
                                                    .map((genre) => {
                                                        const isSelected = favoriteGenres.includes(genre.id.toString());
                                                        return (
                                                            <button
                                                                key={genre.id}
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setFavoriteGenres(favoriteGenres.filter(g => g !== genre.id.toString()));
                                                                    } else {
                                                                        setFavoriteGenres([...favoriteGenres, genre.id.toString()]);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "px-4 py-3 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between group",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-white"
                                                                        : "bg-white/5 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white"
                                                                )}
                                                            >
                                                                {genre.name}
                                                                {isSelected && <CheckCircle2 size={14} className="text-primary" />}
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                            {!genreSearch && user.allGenres && user.allGenres.length > 9 && (
                                                <button 
                                                    onClick={() => setShowAllGenres(!showAllGenres)}
                                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                                                >
                                                    {showAllGenres ? "Daha Az Göster" : "Daha Fazla Göster"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <h4 className="text-sm font-black text-white px-1 flex items-center gap-2">
                                                    <Monitor size={16} className="text-amber-500" />
                                                    Kullandığınız Platformlar
                                                </h4>
                                                <div className="relative">
                                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                                    <input
                                                        type="text"
                                                        placeholder="Platform ara..."
                                                        value={platformSearch}
                                                        onChange={(e) => setPlatformSearch(e.target.value)}
                                                        className="w-full sm:w-48 pl-8 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                {platformItems
                                                    .filter(p => p.name.toLowerCase().includes(platformSearch.toLowerCase()))
                                                    .map((platform) => {
                                                    const isSelected = platforms.includes(platform.id);
                                                    return (
                                                        <button
                                                            key={platform.id}
                                                            onClick={() => {
                                                                if (isSelected) {
                                                                    setPlatforms(platforms.filter(p => p !== platform.id));
                                                                } else {
                                                                    setPlatforms([...platforms, platform.id]);
                                                                }
                                                            }}
                                                            title={platform.name}
                                                            className="relative group transition-transform hover:scale-110 active:scale-95"
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl overflow-hidden shadow-lg transition-all border-2",
                                                                isSelected
                                                                    ? "border-amber-400 opacity-100 ring-4 ring-amber-400/20"
                                                                    : "border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                                            )}>
                                                                <img src={platform.icon} alt={platform.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            {isSelected && (
                                                                <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1 shadow-lg border-2 border-[#0B0F19]">
                                                                    <Check size={10} className="text-black font-black" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button
                                            onClick={handleSavePreferences}
                                            disabled={isPending}
                                            className="px-8 py-3.5 bg-white text-black font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                            Tercihlerimi Kaydet
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === "account" && (
                                <motion.div
                                    key="account"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h3 className="text-lg font-black text-white mb-1">Hesap Yönetimi</h3>
                                        <p className="text-xs text-neutral-500 font-medium font-bold uppercase tracking-wider">Hesabınızı askıya alabilir veya kalıcı olarak silebilirsiniz.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div
                                            onClick={() => setShowSuspendConfirm(true)}
                                            className="p-6 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-amber-500/5 hover:border-amber-500/20 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="p-3 bg-amber-500/10 rounded-2xl group-hover:bg-amber-500 group-hover:text-black transition-colors text-amber-500">
                                                    <History size={20} />
                                                </div>
                                                <p className="text-sm font-black text-white">Hesabı Askıya Al</p>
                                            </div>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase leading-relaxed">
                                                Hesabınız dondurulur ve başkaları tarafından görülemez. 3 ay içerisinde giriş yapmazsanız hesabınız otomatik olarak <span className="text-amber-500">kalıcı olarak silinecektir.</span>
                                            </p>
                                        </div>

                                        <div
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-6 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-rose-500/5 hover:border-rose-500/20 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors text-rose-500">
                                                    <Trash2 size={20} />
                                                </div>
                                                <p className="text-sm font-black text-white">Hesabı Kalıcı Olarak Sil</p>
                                            </div>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase leading-relaxed">
                                                Bu işlem geri alınamaz. Hesabınıza ait tüm veriler (aktiviteler, yorumlar, mesajlar) <span className="text-rose-500">tamamen ve kalıcı olarak</span> veritabanından temizlenecektir.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                </div>
            </div>
            {/* Sub-modals for Confirmation */}
            <AnimatePresence>
                {(showDeleteConfirm || showSuspendConfirm) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[2100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-8 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-sm space-y-6"
                        >
                            <div className={cn(
                                "w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center mb-6",
                                showDeleteConfirm ? "bg-rose-500/20 text-rose-500" : "bg-amber-500/20 text-amber-500"
                            )}>
                                <AlertTriangle size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-white tracking-tight">Emin misiniz?</h4>
                            <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                                {showDeleteConfirm
                                    ? "Bu işlem geri alınamaz. Hesabınızdaki her şey tamamen silinecek."
                                    : "Hesabınız askıya alınacak. 3 ay boyunca giriş yapmazsanız kalıcı olarak silinecek."}
                            </p>
                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={showDeleteConfirm ? handleDeleteAccount : handleSuspendAccount}
                                    disabled={isPending}
                                    className={cn(
                                        "w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                                        showDeleteConfirm ? "bg-rose-500 text-white hover:bg-rose-600" : "bg-amber-500 text-black hover:bg-amber-600"
                                    )}
                                >
                                    {isPending ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    {showDeleteConfirm ? "Evet, Hesabımı Sil" : "Evet, Hesabımı Askıya Al"}
                                </button>
                                <button
                                    onClick={() => { setShowDeleteConfirm(false); setShowSuspendConfirm(false); }}
                                    className="w-full py-4 rounded-2xl bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all font-bold text-sm"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
