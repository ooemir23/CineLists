import React from "react";
import { Search, LayoutGrid, Rows, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchedSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onFilterClick: () => void;
}

const WatchedSearchBar: React.FC<WatchedSearchBarProps> = ({
  searchValue,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onFilterClick,
}) => (
  <div className="flex flex-col md:flex-row items-center w-full bg-[#1b2334]/60 backdrop-blur-xl rounded-[2rem] px-4 py-3 md:py-2 border border-white/5 shadow-2xl gap-3 md:gap-4">
    {/* Arama kutusu */}
    <div className="flex items-center flex-1 bg-white/5 rounded-2xl px-4 py-3 md:py-2.5 border border-white/5 group focus-within:border-amber-400/30 transition-all w-full">
      <Search size={18} className="text-neutral-500 group-focus-within:text-amber-400 transition-colors mr-3" />
      <input
        type="text"
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="İzlenen içeriklerinizde arama yapın..."
        className="bg-transparent outline-none text-white w-full text-sm font-medium placeholder:text-neutral-500"
      />
    </div>

    {/* Görünüm ve filtre butonları */}
    <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button
                className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === "grid" ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                )}
                onClick={() => onViewModeChange("grid")}
                aria-label="Grid görünüm"
            >
                <LayoutGrid size={20} />
            </button>
            <button
                className={cn(
                    "p-2.5 rounded-xl transition-all",
                    viewMode === "list" ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "text-neutral-400 hover:text-white"
                )}
                onClick={() => onViewModeChange("list")}
                aria-label="Liste görünüm"
            >
                <Rows size={20} />
            </button>
        </div>

        <button
            className={cn(
                "flex items-center gap-2 px-6 py-3 md:py-2.5 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-white/5 active:scale-95",
                "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white"
            )}
            onClick={onFilterClick}
        >
            <SlidersHorizontal size={18} className="text-amber-400" />
            <span className="hidden sm:inline">Filtreler</span>
        </button>
    </div>
  </div>
);

export default WatchedSearchBar;
