import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db } from "@/lib/db";

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button className="bg-black text-white">
        GET STARTED
      </Button>
    </div>
  );
}
