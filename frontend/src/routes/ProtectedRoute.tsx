import {Navigate, Outlet, useLocation} from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import type { Role } from "../types";

interface ProtectedRouteProps {
    allowedRoles: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const location = useLocation();

    if (!token || !user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace state={{ from: location.pathname }} />
    }

    return <Outlet />;
}
