export type Locale = "tr" | "en";

export const DEFAULT_LOCALE: Locale = "tr";

export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export interface Dictionary {
  common: {
    appName: string;
    loading: string;
    save: string;
    saved: string;
    cancel: string;
    delete: string;
    search: string;
    searchPlaceholder: string;
    filter: string;
    all: string;
    close: string;
    back: string;
    more: string;
    less: string;
    actions: string;
    errorOccurred: string;
    tryAgain: string;
    success: string;
    saveChanges: string;
  };
  nav: {
    home: string;
    explore: string;
    movies: string;
    tvShows: string;
    watchlist: string;
    watched: string;
    watching: string;
    stats: string;
    community: string;
    feed: string;
    messages: string;
    notifications: string;
    profile: string;
    tasteMatch: string;
    settings: string;
    admin: string;
    login: string;
    register: string;
    logout: string;
    account: string;
    guest: string;
    notLoggedIn: string;
  };
  home: {
    heroWatchlist: string;
    heroWatched: string;
    heroWatching: string;
    heroDetails: string;
    popularMovies: string;
    popularTv: string;
    trending: string;
    topRated: string;
    upcoming: string;
    friendsActivity: string;
    personalizedForYou: string;
    quickStats: string;
    searchMoviesAndShows: string;
  };
  media: {
    typeMovie: string;
    typeTv: string;
    releaseDate: string;
    runtime: string;
    genres: string;
    overview: string;
    cast: string;
    crew: string;
    seasons: string;
    episodes: string;
    whereToWatch: string;
    similar: string;
    recommendations: string;
    rating: string;
    userReviews: string;
    trailers: string;
    addToWatchlist: string;
    removeFromWatchlist: string;
    markAsWatched: string;
    markAsWatching: string;
  };
  settings: {
    title: string;
    subtitle: string;
    general: string;
    privacy: string;
    preferences: string;
    account: string;
    language: string;
    languageDescription: string;
    turkish: string;
    english: string;
    name: string;
    username: string;
    bio: string;
    privateProfile: string;
    privateProfileDesc: string;
    showActivities: string;
    showActivitiesDesc: string;
    showStats: string;
    showStatsDesc: string;
    favoriteGenres: string;
    platforms: string;
    searchGenre: string;
    searchPlatform: string;
  };
  auth: {
    welcomeBack: string;
    signInToContinue: string;
    email: string;
    password: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
  };
}
