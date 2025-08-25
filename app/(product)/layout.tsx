// app/product/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prent AI – Producto",
  description: "Asistente médico con IA y herramientas para operaciones hospitalarias",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar/Topbar if you have them */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
