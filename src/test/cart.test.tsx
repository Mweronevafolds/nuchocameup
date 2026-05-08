import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import type { Product } from "@/data/products";

const mockProduct: Product = {
    id: "test-1",
    name: "Test Product",
    price: 1000,
    originalPrice: 1500,
    image: "test.jpg",
    soldOut: false,
    sizes: ["S", "M", "L"],
    description: "Test description",
};

describe("CartContext", () => {
    it("should initialize with empty cart", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.items).toEqual([]);
        expect(result.current.totalPrice).toBe(0);
        expect(result.current.totalItems).toBe(0);
    });

    it("should add item to cart", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].product.id).toBe("test-1");
        expect(result.current.items[0].size).toBe("M");
        expect(result.current.items[0].quantity).toBe(1);
        expect(result.current.totalPrice).toBe(1000);
    });

    it("should increment quantity for existing item", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
            result.current.addItem(mockProduct, "M");
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].quantity).toBe(2);
        expect(result.current.totalPrice).toBe(2000);
    });

    it("should handle different sizes as separate items", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
            result.current.addItem(mockProduct, "L");
        });

        expect(result.current.items).toHaveLength(2);
        expect(result.current.totalItems).toBe(2);
    });

    it("should remove item from cart", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
        });

        expect(result.current.items).toHaveLength(1);

        act(() => {
            result.current.removeItem("test-1", "M");
        });

        expect(result.current.items).toHaveLength(0);
        expect(result.current.totalPrice).toBe(0);
    });

    it("should update quantity", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
        });

        act(() => {
            result.current.updateQuantity("test-1", "M", 3);
        });

        expect(result.current.items[0].quantity).toBe(3);
        expect(result.current.totalPrice).toBe(3000);
    });

    it("should remove item when quantity is set to 0", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
        });

        act(() => {
            result.current.updateQuantity("test-1", "M", 0);
        });

        expect(result.current.items).toHaveLength(0);
    });

    it("should toggle cart open/close", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        expect(result.current.isOpen).toBe(false);

        act(() => {
            result.current.openCart();
        });

        expect(result.current.isOpen).toBe(true);

        act(() => {
            result.current.closeCart();
        });

        expect(result.current.isOpen).toBe(false);
    });

    it("should calculate correct total items", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <CartProvider>{ children } </CartProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        act(() => {
            result.current.addItem(mockProduct, "M");
            result.current.addItem(mockProduct, "L");
            result.current.updateQuantity("test-1", "M", 3);
        });

        expect(result.current.totalItems).toBe(4); // 3 + 1
    });
});
