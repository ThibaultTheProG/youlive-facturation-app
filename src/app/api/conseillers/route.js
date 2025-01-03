export async function GET() {
  const response = await fetch("https://api.apimo.pro/agencies/24045/users", {
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${process.env.USERNAME}:${process.env.PASSWORD}`
      ).toString("base64")}`,
      cache: "force-cache",
    },
  });
  const data = await response.json();
  const users = data.users;
  return Response.json({ users });
}
