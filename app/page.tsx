import { Button } from "@/components/ui/button";
import Image from "next/image";
import { db } from "@/lib/db";
import UserButton from '@/modules/auth/components/user-button'

export default async function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button className="bg-black text-white">
        GET STARTED
      </Button>
      <UserButton />
    </div>
  );
}
