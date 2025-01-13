"use server";

import db from "../lib/db";
import { Conseiller } from "@/lib/types";

export default async function getConseillerBDD(user: {
  id: number;
}): Promise<Conseiller | undefined> {
  const client = await db.connect();

  try {
    const query = `SELECT * FROM utilisateurs WHERE id=$1`;
    const result = await client.query(query, [user.id]);
    return result.rows[0] as Conseiller;
  } catch (error) {
    console.error(
      "Impossible de récupérer le conseiller depuis la BDD :",
      error
    );
    return undefined;
  } finally {
    client.release();
  }
}