import pg from "pg";

const { Pool } = pg;
const db = new Pool({
  connectionString:
    process.env.NODE_ENV === "production"
      ? process.env.DB_URL
      : process.env.DB_URL_PREPROD, // Pooling activé
});

db.on("connect", () => console.log("Connecté au pool de base de données : ", process.env.NODE_ENV));
db.on("error", (err) =>
  console.error("Erreur avec le pool de base de données :", err)
);

export default db;
