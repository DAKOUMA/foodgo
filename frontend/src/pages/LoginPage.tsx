import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { loginRequest } from "../api/auth";

const loginSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
})

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state as { from?: string } | null)?.from ?? "/user";

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const mutation = useMutation({
        mutationFn: (values: LoginForm) => loginRequest(values.email, values.password),
        onSuccess: ({ token, user }) => {
            login(token, user);
            navigate(redirectTo, { replace: true });
        }
    })

    const serverError = isAxiosError(mutation.error) ? (mutation.error.response?.data.message) : null;

    return (
        <main className="min-h-screen grid place-items-center bg-neutral-50 px-4">
            <form
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
                className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-lg"
                noValidate
            >
                <header className="space-y-1">
                    <h1 className="text-2xl font-semibold">Bon retour 👋</h1>
                    <p className="text-sm text-neutral-500">Connecte-toi pour commander.</p>
                </header>

                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register("email")}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        {...register("password")}
                        className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                </div>

                {serverError && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                        {serverError}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                    {mutation.isPending ? "Connexion…" : "Se connecter"}
                </button>
            </form>
        </main>
    )
}