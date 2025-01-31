"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PDFViewer } from "@react-pdf/renderer";
import FactureCommission from "@/components/factures/FactureCommission";
import FactureRecrutement from "@/components/factures/FactureRecrutement";
import { FactureDetaillee } from "@/lib/types";

export default function FacturePDFPage() {
  const params = useParams(); // ✅ Récupérer les paramètres dynamiques correctement
  const router = useRouter();
  const [facture, setFacture] = useState<FactureDetaillee | null>(null);

  useEffect(() => {
    if (!params?.id) return; // ✅ Attendre que `params.id` soit défini avant de continuer

    const fetchFacture = async () => {
      try {
        const response = await fetch(`/factures/${params.id}`);
        if (!response.ok) throw new Error("Facture introuvable");

        const data: FactureDetaillee = await response.json();
        setFacture(data);
      } catch (error) {
        console.error("Erreur lors du chargement de la facture :", error);
        router.push("/404"); // ✅ Rediriger vers une page 404 si la facture n'existe pas
      }
    };

    fetchFacture();
  }, [params?.id, router]); // ✅ Ajout de `params?.id` pour éviter l'erreur de Next.js

  if (!facture) return <p>Chargement...</p>;
  
  console.log(facture);

  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      {facture.type === "commission" ? <FactureCommission facture={facture}/> : <FactureRecrutement facture={facture}/>}
    </PDFViewer>
  );
}
