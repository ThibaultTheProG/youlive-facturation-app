import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-4 h-screen">
        <Image
          src={"/images/logo.svg"}
          width={400}
          height={400}
          alt="Logo Youlive"
        />
        <h1>{"Bienvenu sur l'application de facturation Youlive"}</h1>

        <div className="flex flex-row space-x-4">
          <Link href={"/conseiller"}>
            <button className="bg-orange-strong hover:bg-orange-light hover:text-black p-4 rounded-lg text-white cursor-pointer">
              Espace conseiller
            </button>
          </Link>
          <Link href={"/admin"}>
            <button className="bg-orange-strong hover:bg-orange-light hover:text-black p-4 rounded-lg text-white cursor-pointer">
              Espace admin
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
