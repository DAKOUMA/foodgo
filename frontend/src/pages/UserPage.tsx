import { useAuthStore } from "../stores/authStore";

export default function UserPage() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <main className="p-8 space-y-4">
            <h1 className="text-xl font-semibold">Salut {user?.name} ({user?.role})</h1>
            <button onClick={logout} className="rounded-lg border px-4 py-2">
                Se déconnecter
            </button>
        </main>
    );
}