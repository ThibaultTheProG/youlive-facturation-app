"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function ExportExcelButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Récupérer toutes les factures sans pagination
      const params = new URLSearchParams({
        page: "1",
        pageSize: "99999",
        searchTerm: "",
        filterStatut: "",
        filterType: "",
        filterStatutEnvoi: "",
        sortField: "date_signature",
        sortDirection: "desc",
      });

      const response = await fetch(`/api/factures?${params.toString()}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des factures");
      const data = await response.json();

      // Transformer les données pour l'export
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = data.factures.map((f: any) => ({
        "Conseiller": `${f.conseiller?.prenom || ""} ${f.conseiller?.nom || ""}`.trim(),
        "N° de facture": f.numero || "",
        "Type": f.type || "",
        "Honoraires HT (€)": f.montant_honoraires != null ? Number(f.montant_honoraires) : "",
        "Taux rétrocession (%)": f.taux_retrocession != null ? Number(f.taux_retrocession) : "",
        "Rétrocession HT (€)": f.retrocession != null ? Number(f.retrocession) : "",
        "TVA (€)": f.montant_tva != null ? Number(f.montant_tva) : "",
        "Tranche": f.tranche === "avant_seuil" ? "Avant seuil" : f.tranche === "apres_seuil" ? "Après seuil" : "",
        "N° de mandat": f.propriete?.numero_mandat ? String(f.propriete.numero_mandat).trim() : "",
        "Date de signature": f.date_signature
          ? new Date(f.date_signature).toLocaleDateString("fr-FR")
          : "",
        "Date de création": f.created_at
          ? new Date(f.created_at).toLocaleDateString("fr-FR")
          : "",
        "Statut paiement": f.statut_paiement || "",
        "Statut envoi": f.statut_envoi || "non envoyée",
      }));

      // Générer le fichier Excel
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Ajuster la largeur des colonnes
      worksheet["!cols"] = [
        { wch: 25 }, // Conseiller
        { wch: 15 }, // N° de facture
        { wch: 12 }, // Type
        { wch: 16 }, // Honoraires HT
        { wch: 20 }, // Taux rétrocession
        { wch: 18 }, // Rétrocession HT
        { wch: 12 }, // TVA
        { wch: 14 }, // Tranche
        { wch: 18 }, // N° de mandat
        { wch: 16 }, // Date de signature
        { wch: 16 }, // Date de création
        { wch: 15 }, // Statut paiement
        { wch: 15 }, // Statut envoi
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Factures");

      // Télécharger le fichier
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `export_factures_${dateStr}.xlsx`);
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      alert("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Export en cours...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Exporter en Excel
        </>
      )}
    </Button>
  );
}
