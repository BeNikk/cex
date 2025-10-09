'use client';
import TopBar from "@/components/shared/topbar";
import { useParams } from "next/navigation"

export default function TradePage({ params }: { params: any }) {
  const { market } = useParams();
  return (
    <div className="flex flex-col w-screen">
      <TopBar />
      <div className="flex flex-row items-center w-full">
        <div className="w-[70%]">
          world
        </div>
        <div className="w-[30%]">
          hello
        </div>
      </div>
    </div>
  )
} 
