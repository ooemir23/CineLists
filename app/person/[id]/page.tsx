import { auth } from "@/auth";
import { tmdb } from "@/lib/tmdb";
import { getIsFavoritePerson } from "@/lib/person-actions";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Instagram, Twitter, Globe, Facebook, Star, Film, Tv } from "lucide-react";
import { FavoritePersonButton } from "@/components/media/favorite-person-button";
import { MediaRow } from "@/components/media/media-row";
import { Biography } from "@/components/person/biography";
import { PersonCredits } from "@/components/person/person-credits";
import { PersonComments } from "@/components/person/person-comments";
import { getPersonComments } from "@/lib/comment-actions";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function PersonPage(props: Props) {
    const { id } = await props.params;

    const [person, isFavorite, comments] = await Promise.all([
        tmdb.getPersonDetails(id).catch(() => null),
        getIsFavoritePerson(parseInt(id)),
        getPersonComments(parseInt(id)),
    ]);

    if (!person) notFound();

    const socialLinks = person.external_ids || {};
    const actingCredits = person.combined_credits?.cast
        ?.sort((a: any, b: any) => {
            const dateA = a.release_date || a.first_air_date || "0000";
            const dateB = b.release_date || b.first_air_date || "0000";
            return dateB.localeCompare(dateA);
        })
        ?.slice(0, 20) || [];

    return (
        <div className=" bg-background pb-20">
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
                <div className="flex flex-col md:flex-row gap-12 items-start">
                    {/* Left Column: Image and Social */}
                    <div className="w-full md:w-80 shrink-0 space-y-8 mx-auto md:mx-0">
                        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            {person.profile_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
                                    alt={person.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-4xl">👤</div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                {socialLinks.instagram_id && (
                                    <a href={`https://instagram.com/${socialLinks.instagram_id}`} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-pink-600/20 hover:text-pink-500 transition-all border border-white/5">
                                        <Instagram className="w-6 h-6" />
                                    </a>
                                )}
                                {socialLinks.twitter_id && (
                                    <a href={`https://twitter.com/${socialLinks.twitter_id}`} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-blue-400/20 hover:text-blue-400 transition-all border border-white/5">
                                        <Twitter className="w-6 h-6" />
                                    </a>
                                )}
                                {socialLinks.facebook_id && (
                                    <a href={`https://facebook.com/${socialLinks.facebook_id}`} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-blue-600/20 hover:text-blue-600 transition-all border border-white/5">
                                        <Facebook className="w-6 h-6" />
                                    </a>
                                )}
                                {person.homepage && (
                                    <a href={person.homepage} target="_blank" className="p-3 bg-white/5 rounded-xl hover:bg-primary/20 hover:text-primary transition-all border border-white/5">
                                        <Globe className="w-6 h-6" />
                                    </a>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5 text-sm">
                                <div>
                                    <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Bilinen Adı</p>
                                    <p className="text-white font-medium">{person.name}</p>
                                </div>
                                {person.birthday && (
                                    <div>
                                        <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Doğum Tarihi</p>
                                        <p className="text-white font-medium">{person.birthday}</p>
                                    </div>
                                )}
                                {person.place_of_birth && (
                                    <div>
                                        <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Doğum Yeri</p>
                                        <p className="text-white font-medium">{person.place_of_birth}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px]">Bölüm</p>
                                    <p className="text-white font-medium">{person.known_for_department}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bio and Filmography */}
                    <div className="flex-1 space-y-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">{person.name}</h1>
                            <FavoritePersonButton
                                personId={person.id}
                                name={person.name}
                                profilePath={person.profile_path}
                                initialIsFavorite={isFavorite}
                            />
                        </div>

                        {person.biography && (
                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Star className="w-6 h-6 text-primary fill-current" />
                                    Hakkında
                                </h2>
                                <Biography text={person.biography} />
                            </section>
                        )}

                        <PersonCredits credits={actingCredits} />

                        <PersonComments personId={person.id} initialComments={comments} />
                    </div>
                </div>
            </div>
        </div>
    );
}
