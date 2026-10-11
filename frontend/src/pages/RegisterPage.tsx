import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Link, useNavigate, useNavigation } from "react-router-dom";
import { loginRequest, registerRequest } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { toast } from "../stores/toastStore";
import FormField from "../components/ui/FormField";

const ROLES = [
    { value: "CLIENT", label: "Client", hint: "Je commande" },
    { value: "RESTAURANT", label: "Restaurant", hint: "Je vends" },
    { value: "DRIVER", label: "Livreur", hint: "Je livre" },
]

const registerSchema = z.object({
    name: z.string().min(4, { message: "4 caractere minimum" }),
    email: z.email({ message: "Adresse e-mail invalid" }),
    phone: z.string().optional(),
    address: z.string().min(5, { message: "Indique ton adresse (5 caracteres minimum)" }),
    role: z.enum(["CLIENT", "RESTAURANT", "DRIVER"]),
    password: z.string().min(8, { message: "8 caractere minimum" }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"]
})

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: { role: "CLIENT" }
    });

    const mutation = useMutation({
        mutationFn: async (values: RegisterForm) => {
            await registerRequest({
                name: values.name,
                email: values.email,
                phone: values.phone || undefined,
                address: values.address,
                role: values.role,
                password: values.password
            });
            return loginRequest(values.email, values.password);
        },
        onSuccess: ({ token, user }) => {
            login(token, user);
            toast.success(`Bienvenue ${user.name} !`);
            navigate(user.role === "CLIENT" ? "/user" : "/", { replace: true });
        },
        onError: (error) => {
            if (isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Impossible de joindre le serveur.");
            }
        }
    });

    return (
        <main className="min-h-screen grid place-items-center bg-neutral-50 px-4 py-10">
            <form
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
                className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg"
                noValidate
            >
                <header className="space-y-1">
                    <h1 className="text-2xl font-semibold">Créer un compte</h1>
                    <p className="text-sm text-neutral-500">Ça prend moins d'une minute.</p>
                </header>

                <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Je suis…</legend>
                    <div className="grid grid-cols-3 gap-2">
                        {ROLES.map((r) => (
                            <label key={r.value} className="cursor-pointer">
                                <input type="radio" value={r.value} {...register("role")} className="peer sr-only" />
                                <div className="rounded-xl border border-neutral-300 p-3 text-center text-sm transition peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-300">
                                    <p className="font-medium">{r.label}</p>
                                    <p className="text-xs text-neutral-500">{r.hint}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <FormField label="Nom complet" autoComplete="name" error={errors.name?.message} {...register("name")} />
                <FormField label="E-mail" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
                <FormField label="Téléphone (optionnel)" type="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
                <FormField label="Adresse" autoComplete="street-address" error={errors.address?.message} {...register("address")} />
                <FormField label="Mot de passe" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
                <FormField label="Confirmer le mot de passe" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full rounded-lg bg-orange-500 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:opacity-60"
                >
                    {mutation.isPending ? "Création…" : "Créer mon compte"}
                </button>

                <p className="text-center text-sm text-neutral-500">
                    Déjà inscrit ?{" "}
                    <Link to="/login" className="font-medium text-orange-600 hover:underline">
                        Se connecter
                    </Link>
                </p>
            </form>
        </main>
    )
}