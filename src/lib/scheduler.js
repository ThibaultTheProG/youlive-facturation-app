import { getConseillersAPI } from "@/lib/getConseillersAPI";
import { insertConseillers } from "@/backend/gestionConseillers";

export function startScheduler() {
  // Exécuter la tâche au démarrage
  executeTask();

  // Planifier la tâche toutes les 2 heures
  setInterval(async () => {
    await executeTask();
  }, 2 * 60 * 60 * 1000); // 2 heures
}

async function executeTask() {
  try {
    console.log("Début de la tâche planifiée...");
    const conseillers = await getConseillersAPI();
    await insertConseillers(conseillers);
    console.log("Tâche planifiée exécutée avec succès.");
  } catch (error) {
    console.error("Erreur lors de la tâche planifiée :", error);
  }
}