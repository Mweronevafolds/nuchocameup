import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { SearchFilters } from "@/hooks/useSearch";

interface SortMenuProps {
    onSortChange: (sort: SearchFilters["sort"]) => void;
    currentSort?: SearchFilters["sort"];
}

export function SortMenu({ onSortChange, currentSort }: SortMenuProps) {
    return (
        <Select value={currentSort || "newest"} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="bestselling">Best Selling</SelectItem>
            </SelectContent>
        </Select>
    );
}
