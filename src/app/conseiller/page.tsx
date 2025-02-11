import { redirect } from "next/navigation";



export default function Conseiller() {

  redirect("/conseiller/compte");

    return (
      <>
      <h1>Page Conseiller</h1>
      </>
    );
  }
  