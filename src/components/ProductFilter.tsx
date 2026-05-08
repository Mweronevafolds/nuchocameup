import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { SearchFilters } from "@/hooks/useSearch";

interface ProductFilterProps {
    onFilterChange: (filters: SearchFilters) => void;
    availableSizes: string[];
    priceRange: { min: number; max: number };
    currentFilters: SearchFilters;
    isOpen?: boolean;
    onClose?: () => void;
}

export function ProductFilter({
    onFilterChange,
    availableSizes,
    priceRange,
    currentFilters,
    isOpen = true,
    onClose,
}: ProductFilterProps) {
    const [selectedSizes, setSelectedSizes] = useState<string[]>(
        currentFilters.sizes || []
    );
    const [priceMin, setPriceMin] = useState(currentFilters.minPrice || priceRange.min);
    const [priceMax, setPriceMax] = useState(currentFilters.maxPrice || priceRange.max);
    const [inStock, setInStock] = useState(currentFilters.inStock !== false);

    const handleSizeChange = (size: string, checked: boolean) => {
        const newSizes = checked
            ? [...selectedSizes, size]
            : selectedSizes.filter((s) => s !== size);

        setSelectedSizes(newSizes);
        onFilterChange({
            ...currentFilters,
            sizes: newSizes.length > 0 ? newSizes : undefined,
        });
    };

    const handlePriceChange = (value: number[]) => {
        setPriceMin(value[0]);
        setPriceMax(value[1]);

        onFilterChange({
            ...currentFilters,
            minPrice: value[0],
            maxPrice: value[1],
        });
    };

    const handleStockChange = (checked: boolean) => {
        setInStock(checked);
        onFilterChange({
            ...currentFilters,
            inStock: checked ? true : undefined,
        });
    };

    const handleReset = () => {
        setSelectedSizes([]);
        setPriceMin(priceRange.min);
        setPriceMax(priceRange.max);
        setInStock(true);

        onFilterChange({
            q: currentFilters.q,
            sort: currentFilters.sort,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="space-y-6 py-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                {onClose && (
                    <button onClick={onClose} className="lg:hidden">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Price Range */}
            <div className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Price Range</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                        KES {priceMin.toLocaleString()} - KES {priceMax.toLocaleString()}
                    </p>
                </div>
                <Slider
                    defaultValue={[priceMin, priceMax]}
                    min={priceRange.min}
                    max={priceRange.max}
                    step={100}
                    onValueChange={handlePriceChange}
                    className="w-full"
                />
            </div>

            {/* Sizes */}
            {availableSizes.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-base font-medium">Size</Label>
                    <div className="space-y-2">
                        {availableSizes.map((size) => (
                            <div key={size} className="flex items-center">
                                <Checkbox
                                    id={`size-${size}`}
                                    checked={selectedSizes.includes(size)}
                                    onCheckedChange={(checked) =>
                                        handleSizeChange(size, checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor={`size-${size}`}
                                    className="ml-2 cursor-pointer font-normal"
                                >
                                    {size}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock Status */}
            <div className="space-y-2">
                <Label className="text-base font-medium">Availability</Label>
                <div className="flex items-center">
                    <Checkbox
                        id="in-stock"
                        checked={inStock}
                        onCheckedChange={handleStockChange}
                    />
                    <Label
                        htmlFor="in-stock"
                        className="ml-2 cursor-pointer font-normal"
                    >
                        In Stock Only
                    </Label>
                </div>
            </div>

            {/* Reset Button */}
            <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
            >
                Clear Filters
            </Button>
        </div>
    );
}
