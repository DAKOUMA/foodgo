import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: Toast[];
    show: (type: ToastType, message: string, duration?: number) => void;
    dismiss: (id: number) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
    toasts: [],
    show: (type, message, duration = 4000) => {
        const id = ++nextId;
        set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
        setTimeout(() => get().dismiss(id), duration);
    },
    dismiss: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Raccourci utilisable partout : toast.success("Enregistré !")
export const toast = {
    success: (message: string) => useToastStore.getState().show("success", message),
    error: (message: string) => useToastStore.getState().show("error", message),
    info: (message: string) => useToastStore.getState().show("info", message),
};