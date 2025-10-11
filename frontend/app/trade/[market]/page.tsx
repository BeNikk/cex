'use client';
import MarketBar from "@/components/shared/marketbar";
import Order from "@/components/shared/order";
import TopBar from "@/components/shared/topbar";
import { useParams } from "next/navigation"

export default function TradePage({ params }: { params: { market: string } }) {
  const { market } = useParams();

  return (
    <div className="flex flex-col w-screen">
      <TopBar />
      <div className="flex flex-row gap-2 w-full">
        <div className="w-[70%] flex flex-col items-center">
          <MarketBar market={market?.toString() || ""} />
          <div>
            hello world
          </div>
        </div>
        <div className="w-[30%]">
          <Order market={market?.toString() ?? ""} />
        </div>
      </div>
    </div>
  )
} 
