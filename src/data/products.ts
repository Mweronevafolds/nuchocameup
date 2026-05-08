import croppedHoodie from "@/assets/products/cropped-hoodie.jpg";
import croppedTee from "@/assets/products/cropped-tee.jpg";
import croptopPink from "@/assets/products/croptop-pink.jpg";
import croptopBlack from "@/assets/products/croptop-black.jpg";
import croptopBlue from "@/assets/products/croptop-blue.jpg";
import hoodieBlue from "@/assets/products/hoodie-blue.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  soldOut: boolean;
  sizes: string[];
  description: string;
}

export const products: Product[] = [
  {
    id: "cropped-hoodie",
    name: "Cropped hoodie",
    price: 5000,
    originalPrice: 7000,
    image: croppedHoodie,
    soldOut: true,
    sizes: ["S", "M", "L", "XL"],
    description: "A cozy cropped hoodie in soft pink. Perfect for layering.",
  },
  {
    id: "cropped-tee",
    name: "Cropped Unisex tee",
    price: 1500,
    originalPrice: 2000,
    image: croppedTee,
    soldOut: false,
    sizes: ["S", "M", "L", "XL"],
    description: "A lightweight cropped unisex tee in blush pink.",
  },
  {
    id: "croptop-pink",
    name: "Croptops",
    price: 1500,
    originalPrice: 2000,
    image: croptopPink,
    soldOut: false,
    sizes: ["S", "M", "L"],
    description: "Vibrant pink crop top for a bold look.",
  },
  {
    id: "croptop-black",
    name: "Croptops",
    price: 1000,
    originalPrice: 1500,
    image: croptopBlack,
    soldOut: false,
    sizes: ["S", "M", "L"],
    description: "Classic black crop top. Versatile and stylish.",
  },
  {
    id: "croptop-blue",
    name: "Croptops",
    price: 1500,
    originalPrice: 2000,
    image: croptopBlue,
    soldOut: false,
    sizes: ["S", "M", "L"],
    description: "Baby blue crop top for a fresh summer vibe.",
  },
  {
    id: "hoodie-blue",
    name: "Cropped hoodie",
    price: 5000,
    originalPrice: 7000,
    image: hoodieBlue,
    soldOut: false,
    sizes: ["S", "M", "L", "XL"],
    description: "Light blue cropped hoodie. Soft and comfortable.",
  },
];

export function formatPrice(price: number): string {
  return `KSh${price.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;
}
