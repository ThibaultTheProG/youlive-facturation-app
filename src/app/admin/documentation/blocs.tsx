import type { LucideIcon } from "lucide-react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Une section de la documentation : ancre, titre à icône, contenu. */
export function Section({
  id,
  titre,
  icone: Icone,
  children,
}: {
  id: string;
  titre: string;
  icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-24 space-y-5">
      <header className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3e8]">
          <Icone className="h-5 w-5 text-[#E07C24]" />
        </span>
        <h2 id={`${id}-titre`} className="text-lg font-semibold text-gray-900">
          {titre}
        </h2>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export function SousTitre({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-sm font-semibold text-gray-900">{children}</h3>;
}

const TONS = {
  info: { icone: Info, classes: "border-sky-100 bg-sky-50 text-sky-900", titre: "À savoir" },
  astuce: { icone: Lightbulb, classes: "border-emerald-100 bg-emerald-50 text-emerald-900", titre: "Astuce" },
  attention: { icone: TriangleAlert, classes: "border-amber-200 bg-amber-50 text-amber-900", titre: "Attention" },
} as const;

export function Encart({
  ton = "info",
  titre,
  children,
}: {
  ton?: keyof typeof TONS;
  titre?: string;
  children: ReactNode;
}) {
  const { icone: Icone, classes, titre: titreParDefaut } = TONS[ton];
  return (
    <div className={cn("flex gap-3 rounded-xl border px-4 py-3", classes)}>
      <Icone className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{titre ?? titreParDefaut}</p>
        <div className="space-y-1 text-[13px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Liste numérotée où chaque étape a un titre court et une explication. */
export function Etapes({ etapes }: { etapes: { titre: string; texte: ReactNode }[] }) {
  return (
    <ol className="space-y-3">
      {etapes.map(({ titre, texte }, i) => (
        <li key={titre} className="flex gap-3">
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fef3e8] text-xs font-semibold text-[#b35a10]"
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{titre}</p>
            <div className="text-gray-600">{texte}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Tableau de définitions : un terme (ou une situation) et son explication. */
export function Definitions({
  colonnes,
  lignes,
}: {
  colonnes: [string, string];
  lignes: [ReactNode, ReactNode][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="w-1/3 px-4 py-2.5">{colonnes[0]}</th>
            <th className="px-4 py-2.5">{colonnes[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lignes.map(([terme, definition], i) => (
            <tr key={i} className="align-top">
              <td className="px-4 py-3 font-medium text-gray-900">{terme}</td>
              <td className="px-4 py-3 text-gray-600">{definition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Frise horizontale d'étapes courtes (sur mobile, empilées). */
export function Frise({ etapes }: { etapes: { titre: string; detail: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {etapes.map(({ titre, detail }, i) => (
        <li key={titre} className="relative rounded-xl border border-gray-200 bg-gray-50/50 p-4">
          <span className="text-xs font-semibold text-[#b35a10]">Étape {i + 1}</span>
          <p className="mt-1 font-medium text-gray-900">{titre}</p>
          <p className="mt-1 text-[13px] text-gray-600">{detail}</p>
        </li>
      ))}
    </ol>
  );
}

/** Mot de l'interface, mis en évidence : un bouton, un onglet, un libellé. */
export function Ui({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[12.5px] font-medium text-gray-800">
      {children}
    </span>
  );
}
