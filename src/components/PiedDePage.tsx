import Image from "next/image";

const SITE = "https://www.websmith.fr";

/** Signature de l'agence : une ligne discrète, au même gabarit dans tous les espaces. */
export function PiedDePage() {
  return (
    <footer className="mt-auto w-full px-4 pb-5 pt-8 md:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-gray-200/70 pt-5 text-xs text-gray-400">
        <span>Conçu et développé par</span>
        <a
          href={SITE}
          target="_blank"
          rel="noopener"
          aria-label="WebSmith, l'agence à l'origine de l'application (ouvre www.websmith.fr dans un nouvel onglet)"
          className="group inline-flex items-center gap-2 rounded-md px-1 py-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#E07C24]/60"
        >
          <Image
            src="/images/logoWebsmith.svg"
            alt=""
            width={72}
            height={18}
            className="h-[18px] w-auto opacity-50 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
          />
          <span aria-hidden className="text-gray-300">
            ·
          </span>
          <span className="transition-colors group-hover:text-gray-700 group-focus-visible:text-gray-700">
            www.websmith.fr
          </span>
        </a>
      </div>
    </footer>
  );
}
