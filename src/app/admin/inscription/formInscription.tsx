"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
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

export default function FormInscription() {
  const router = useRouter();
  const [conseillers, setConseillers] = useState<Conseiller[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    conseillerId: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchConseillers();
  }, []);

  const fetchConseillers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/conseillers/get");
      const data = await response.json();
      setConseillers(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des conseillers :", error);
      toast.error("Impossible de charger la liste des conseillers");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConseiller = async (val: string) => {
    setFormData({
      ...formData,
      conseillerId: val,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch("/api/assignPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conseillerId: formData.conseillerId,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Mot de passe assigné avec succès");
        router.push("/admin/inscription");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation du mot de passe :", error);
      toast.error("Une erreur est survenue lors de l'assignation du mot de passe");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">Inscription Conseiller</CardTitle>
        <CardDescription className="text-white/80">
          Créez un compte pour un nouveau conseiller
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6 pb-2">
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
                    !formData.conseillerId && "text-muted-foreground"
                  )}
                >
                  {formData.conseillerId ? (
                    conseillers.find(
                      (conseiller) => conseiller.id.toString() === formData.conseillerId
                    )
                      ? `${conseillers.find(
                          (conseiller) => conseiller.id.toString() === formData.conseillerId
                        )?.prenom} ${conseillers.find(
                          (conseiller) => conseiller.id.toString() === formData.conseillerId
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
                                formData.conseillerId === conseiller.id.toString()
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

          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium">
              Mot de passe
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full"
              placeholder="Minimum 6 caractères"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-medium">
              Confirmer le mot de passe
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full"
              placeholder="Confirmer le mot de passe"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 transition-colors"
            disabled={submitting || !formData.conseillerId || !formData.password}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inscription en cours...
              </>
            ) : (
              "Inscrire le conseiller"
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center text-sm text-gray-500 pt-2 pb-6">
        Le conseiller recevra ses identifiants par email
      </CardFooter>
    </Card>
  );
}