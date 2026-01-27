import React from "react";
import { Search, LayoutGrid, Rows, SlidersHorizontal } from "../Icons";

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
  <div className="flex items-center w-full bg-slate-900/80 rounded-xl px-4 py-2 shadow-lg gap-3">
    {/* Arama kutusu */}
    <div className="flex items-center flex-1 bg-slate-800 rounded-lg px-3 py-2">
      <Search size={20} className="text-slate-400 mr-2" />
      <input
        type="text"
        value={searchValue}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="İzlenenlerde ara..."
        className="bg-transparent outline-none text-white w-full"
      />
    </div>
    {/* Görünüm ve filtre butonları */}
    <button
      className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-emerald-700/60" : "hover:bg-slate-800"} transition`}
      onClick={() => onViewModeChange("grid")}
      aria-label="Grid görünüm"
    >
      <LayoutGrid size={20} />
    </button>
    <button
      className={`p-2 rounded-lg ${viewMode === "list" ? "bg-emerald-700/60" : "hover:bg-slate-800"} transition`}
      onClick={() => onViewModeChange("list")}
      aria-label="Liste görünüm"
    >
      <Rows size={20} />
    </button>
    <button
      className="p-2 rounded-lg hover:bg-slate-800 transition"
      onClick={onFilterClick}
      aria-label="Filtrele"
    >
      <SlidersHorizontal size={20} />
    </button>
  </div>
);

export default WatchedSearchBar;
