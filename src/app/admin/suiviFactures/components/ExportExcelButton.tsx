"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";
import { toast } from "react-hot-toast";

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

      // Créer le workbook et la feuille
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Factures");

      // Définir les colonnes
      worksheet.columns = [
        { header: "Conseiller", key: "conseiller", width: 25 },
        { header: "N° de facture", key: "numero", width: 15 },
        { header: "Type", key: "type", width: 12 },
        { header: "Honoraires HT (€)", key: "honoraires", width: 18 },
        { header: "Taux rétrocession (%)", key: "taux", width: 22 },
        { header: "Rétrocession HT (€)", key: "retrocession", width: 20 },
        { header: "TVA (€)", key: "tva", width: 12 },
        { header: "Tranche", key: "tranche", width: 14 },
        { header: "N° de mandat", key: "mandat", width: 18 },
        { header: "Date de signature", key: "date_signature", width: 18 },
        { header: "Date de création", key: "date_creation", width: 18 },
        { header: "Statut paiement", key: "statut_paiement", width: 16 },
        { header: "Statut envoi", key: "statut_envoi", width: 16 },
      ];

      // Style de l'en-tête
      worksheet.getRow(1).font = { bold: true };

      // Ajouter les lignes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const f of data.factures) {
        worksheet.addRow({
          conseiller: `${f.conseiller?.prenom || ""} ${f.conseiller?.nom || ""}`.trim(),
          numero: f.numero || "",
          type: f.type || "",
          honoraires: f.montant_honoraires != null ? Number(f.montant_honoraires) : "",
          taux: f.taux_retrocession != null ? Number(f.taux_retrocession) : "",
          retrocession: f.retrocession != null ? Number(f.retrocession) : "",
          tva: f.montant_tva != null ? Number(f.montant_tva) : "",
          tranche: f.tranche === "avant_seuil" ? "Avant seuil" : f.tranche === "apres_seuil" ? "Après seuil" : "",
          mandat: f.propriete?.numero_mandat ? String(f.propriete.numero_mandat).trim() : "",
          date_signature: f.date_signature
            ? new Date(f.date_signature).toLocaleDateString("fr-FR")
            : "",
          date_creation: f.created_at
            ? new Date(f.created_at).toLocaleDateString("fr-FR")
            : "",
          statut_paiement: f.statut_paiement || "",
          statut_envoi: f.statut_envoi || "non envoyée",
        });
      }

      // Générer le buffer et télécharger
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_factures_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      toast.error("Erreur lors de l'export Excel");
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
