"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["500", "700"] });

const loginSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [afficherMdp, setAfficherMdp] = useState(false);
  const [aide, setAide] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Échec de la connexion.");
      }

      const { role } = await response.json();

      // Rediriger l'utilisateur selon son rôle
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "conseiller") {
        router.push("/conseiller");
      }
    } catch (error: unknown) {
      // Vérifiez si l'erreur est une instance d'Error
      if (error instanceof Error) {
        console.error("Erreur lors de la connexion :", error.message);
        setErrorMessage(error.message || "Une erreur est survenue.");
      } else {
        console.error("Erreur inconnue :", error);
        setErrorMessage("Une erreur inconnue est survenue.");
      }
    }
  };

  const champ =
    "w-full rounded-[14px] border-[1.5px] border-[#e5e2dc] bg-white px-[14px] py-[13px] text-[15px] text-black placeholder:text-[#b8b2aa] outline-none transition focus:border-[#f28c1e] focus:shadow-[0_0_0_4px_rgb(242_140_30/0.13)] aria-[invalid=true]:border-[#c4573f]";
  const libelle = "text-[13.5px] font-bold text-black";
  const erreurChamp = "text-[13px] text-[#c4573f]";

  return (
    <main className={`${quicksand.className} flex min-h-dvh flex-col lg:flex-row`}>
      <aside className="relative hidden overflow-hidden bg-[#ffe6d2] px-[56px] py-[64px] lg:flex lg:w-[46%] lg:flex-col lg:justify-center">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[140px] -bottom-[160px] size-[460px] rounded-full border-[28px] border-[rgba(242,140,30,0.16)]"
        />
        <div className="relative z-10 max-w-[440px]">
          <Image
            src="/images/logo-youlive.svg"
            alt="Youlive Immobilier"
            width={167}
            height={60}
            priority
          />
          <h1 className="mt-[40px] text-[40px] leading-[1.1] font-bold text-black">
            Votre facturation, en toute clarté.
          </h1>
          <p className="mt-[18px] text-[15px] leading-[1.5] text-[#6b6560]">
            Un réseau où l&apos;humain compte autant que l&apos;immobilier.
            <br />
            Youlive Immobilier — Les Sables-d&apos;Olonne.
          </p>
        </div>
      </aside>

      <section className="flex flex-1 items-center justify-center px-[26px] py-[40px]">
        <div className="w-full max-w-[376px]">
          <div className="flex flex-col items-center lg:hidden">
            <Image
              src="/images/logo-youlive.svg"
              alt="Youlive Immobilier"
              width={128}
              height={46}
              priority
            />
            <p className="mt-[10px] text-[18px] font-bold text-[#6b6560]">
              Facturation
            </p>
          </div>

          <h2 className="mt-[30px] mb-[22px] text-[26px] leading-[1.15] font-bold text-black lg:mt-0 lg:text-[28px]">
            Connexion
          </h2>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-[14px]"
            noValidate
          >
            {errorMessage && (
              <p
                role="alert"
                className="rounded-[14px] bg-[#faede9] px-[14px] py-[12px] text-[13.5px] text-[#c4573f]"
              >
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col gap-[6px]">
              <label htmlFor="email" className={libelle}>
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="prenom.nom@youlive-immobilier.fr"
                aria-invalid={!!errors.email}
                className={champ}
                {...register("email")}
              />
              {errors.email && <p className={erreurChamp}>{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-[6px]">
              <div className="flex items-baseline justify-between">
                <label htmlFor="password" className={libelle}>
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setAfficherMdp((v) => !v)}
                  className="cursor-pointer text-[13px] font-bold text-[#b36a0c]"
                >
                  {afficherMdp ? "Masquer" : "Afficher"}
                </button>
              </div>
              <input
                id="password"
                type={afficherMdp ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                className={champ}
                {...register("password")}
              />
              {errors.password && (
                <p className={erreurChamp}>{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-[4px] min-h-[48px] w-full cursor-pointer rounded-[16px] bg-[#f28c1e] px-[30px] py-[15px] text-[16px] font-bold text-white shadow-[0_4px_12px_rgb(242_140_30/0.28)] transition hover:bg-[#e0800f] active:bg-[#d2760f] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#efebe4] disabled:text-[#b8b2aa] disabled:shadow-none"
            >
              {isSubmitting ? "Connexion…" : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => setAide((v) => !v)}
              className="cursor-pointer self-start text-[13px] font-bold text-[#b36a0c]"
            >
              Mot de passe oublié ?
            </button>
            {aide && (
              <p className="rounded-[14px] bg-[#fff7ef] px-[14px] py-[12px] text-[12.5px] leading-[1.45] text-[#6b6560]">
                Rapprochez-vous de votre administrateur : il vous enverra un
                lien pour définir un nouveau mot de passe.
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
