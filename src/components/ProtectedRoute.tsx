import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: "admin" | "user";
}

export function ProtectedRoute({
    children,
    requiredRole = "admin",
}: ProtectedRouteProps) {
    const { user, isLoading, isAdmin } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Skeleton className="w-32 h-32" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (requiredRole === "admin" && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                    <p className="text-muted-foreground">You don't have permission to access this page</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
