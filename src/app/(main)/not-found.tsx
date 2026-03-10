import Image from "next/image";
import notfound1 from "@/assets/404-notfound1.png";
import notfound2 from "@/assets/404-notfound2.jpg";

export default function NotFound() {

  const images = [notfound1, notfound2];

  const randomImage = images[Math.floor(Math.random() * images.length)];

  return (
    <main className="my-12 w-full space-y-6 text-center flex flex-col items-center">
      <Image
        src={randomImage}
        alt="Page not found"
        width={300}
        height={300}
      />

      <h1 className="text-3xl font-bold">Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </main>
  );
}