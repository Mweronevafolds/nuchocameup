import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("test", 500));

        expect(result.current).toBe("test");
    });

    it("should debounce value changes", () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: "initial", delay: 500 },
            }
        );

        expect(result.current).toBe("initial");

        rerender({ value: "updated", delay: 500 });
        expect(result.current).toBe("initial");

        vi.advanceTimersByTime(499);
        expect(result.current).toBe("initial");

        vi.advanceTimersByTime(1);
        expect(result.current).toBe("updated");
    });

    it("should reset debounce timer on rapid changes", () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: "initial", delay: 500 },
            }
        );

        rerender({ value: "update1", delay: 500 });
        vi.advanceTimersByTime(300);

        rerender({ value: "update2", delay: 500 });
        vi.advanceTimersByTime(300);

        expect(result.current).toBe("initial");

        vi.advanceTimersByTime(200);
        expect(result.current).toBe("update2");
    });

    it("should handle different delay values", () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: "initial", delay: 100 },
            }
        );

        rerender({ value: "updated", delay: 100 });
        vi.advanceTimersByTime(99);
        expect(result.current).toBe("initial");

        vi.advanceTimersByTime(1);
        expect(result.current).toBe("updated");
    });

    it("should handle number values", () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: 0, delay: 500 },
            }
        );

        rerender({ value: 42, delay: 500 });
        expect(result.current).toBe(0);

        vi.advanceTimersByTime(500);
        expect(result.current).toBe(42);
    });

    it("should handle object values", () => {
        const obj1 = { search: "initial" };
        const obj2 = { search: "updated" };

        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            {
                initialProps: { value: obj1, delay: 500 },
            }
        );

        expect(result.current).toBe(obj1);

        rerender({ value: obj2, delay: 500 });
        expect(result.current).toBe(obj1);

        vi.advanceTimersByTime(500);
        expect(result.current).toBe(obj2);
    });
});
