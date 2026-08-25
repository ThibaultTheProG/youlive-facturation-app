"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Conseiller } from "@/lib/types";

const fetchConseillers = async (url: string): Promise<Conseiller[]> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export default function FormInscription() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [conseillerId, setConseillerId] = useState("");

  // SWR gère le chargement et le cache : pas d'effet ni d'état de chargement
  // à piloter à la main.
  const { data: conseillers = [], isLoading: loading } = useSWR<Conseiller[]>(
    "/api/conseillers/get",
    fetchConseillers,
    {
      onError: (error) => {
        console.error("Erreur lors de la récupération des conseillers :", error);
        toast.error("Impossible de charger la liste des conseillers");
      },
    }
  );

  const handleSelectConseiller = async (val: string) => {
    setConseillerId(val);
  };

  // L'admin ne saisit plus de mot de passe : le conseiller reçoit un lien
  // d'invitation et choisit lui-même le sien (cf. `/api/auth/invitation`).
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!conseillerId) {
      toast.error("Sélectionnez un conseiller");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/invitation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conseillerId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Invitation envoyée");
        setConseillerId("");
        router.push("/admin/inscription");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de l'invitation :", error);
      toast.error("Une erreur est survenue lors de l'envoi de l'invitation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm border border-gray-200 rounded-2xl">
      <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
        <CardTitle className="text-base font-semibold text-gray-900">Nouveau conseiller</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Sélectionnez un conseiller pour lui envoyer son invitation
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 pt-6 pb-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="conseiller" className="font-medium">
              Sélectionner un conseiller
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={loading}
                  className={cn(
                    "w-full justify-between",
                    !conseillerId && "text-muted-foreground"
                  )}
                >
                  {conseillerId ? (
                    conseillers.find(
                      (conseiller) => conseiller.id.toString() === conseillerId
                    )
                      ? `${conseillers.find(
                          (conseiller) => conseiller.id.toString() === conseillerId
                        )?.prenom} ${conseillers.find(
                          (conseiller) => conseiller.id.toString() === conseillerId
                        )?.nom}`
                      : "Sélectionner un conseiller"
                  ) : (
                    "Sélectionner un conseiller"
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un conseiller..." />
                  <CommandList>
                    <CommandEmpty>Aucun conseiller trouvé</CommandEmpty>
                    <CommandGroup>
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span>Chargement des conseillers...</span>
                        </div>
                      ) : (
                        conseillers.map((conseiller) => (
                          <CommandItem
                            key={conseiller.id}
                            value={`${conseiller.prenom} ${conseiller.nom}`}
                            onSelect={() => {
                              handleSelectConseiller(conseiller.id.toString());
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                conseillerId === conseiller.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {conseiller.prenom} {conseiller.nom}
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-sm text-gray-500">
            Le conseiller recevra un email l&apos;invitant à définir lui-même son
            mot de passe. Le lien est valable 48 heures et ne fonctionne
            qu&apos;une seule fois.
          </p>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 transition-colors"
            disabled={submitting || !conseillerId}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer l'invitation"
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center text-xs text-gray-400 px-6 pt-2 pb-6">
        Le conseiller pourra se connecter avec ces identifiants
      </CardFooter>
    </Card>
  );
}