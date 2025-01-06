import { insertConseillers } from "@/backend/gestionConseillers";

export async function GET() {
  const response = await fetch("https://api.apimo.pro/agencies/24045/users", {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.USERNAME}:${process.env.PASSWORD}`
      ).toString("base64")}`,
      cache: "force-cache",
    },
  });
  const brut = await response.json();
  const data = brut.users;
  await insertConseillers(data)
  return Response.json({ data });
}
