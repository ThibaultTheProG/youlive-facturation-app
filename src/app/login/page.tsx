"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardFooter,
  CardContent,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide."),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
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
      console.log("Rôle reçu :", role); // Vérifiez que le rôle est bien reçu.

      // Rediriger l'utilisateur selon son profil (admin ou conseiller)

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

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-center">Connexion</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Votre email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Votre mot de passe"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600 text-center">{errorMessage}</p>
            )}
            <Button type="submit" className="w-full bg-orange-strong">
              Connexion
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-center text-gray-600">
            Besoin daide ? Contactez : thibault.tuffin@websmith.fr
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
