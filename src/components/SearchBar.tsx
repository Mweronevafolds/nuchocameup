import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search products..." }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setQuery(value);
            onSearch(value);
        },
        [onSearch]
    );

    const handleClear = useCallback(() => {
        setQuery("");
        onSearch("");
    }, [onSearch]);

    return (
        <div className="relative flex-1 max-w-sm">
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 pr-8"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-2 p-1 hover:bg-secondary rounded"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                )}
            </div>
        </div>
    );
}
