import pg from "pg";

const { Pool } = pg;
const db = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

db.on("connect", () => console.log("Connecté au pool de base de données"));
db.on("error", (err) => console.error("Erreur avec le pool de base de données :", err));

export default db;