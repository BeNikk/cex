import { getTicker } from "@/lib/request";
import { useEffect, useState } from "react";

interface MarketBarProps {
  market: string;
}
export default function MarketBar({ market }: MarketBarProps) {
  const [ticker, setTicker] = useState<any | null>(null);

  useEffect(() => {
    async function fetchTicker() {
      const data = await getTicker();
      const filtered = data.find((t: any) => t.symbol === market);
      setTicker(filtered || null);
    }
    fetchTicker();
  }, [market]);

  if (!ticker) {
    return <div className="p-4 text-slate-400">Loading ticker...</div>;
  }

  return (
    <div className="flex items-center justify-between w-full p-4 border-b border-slate-800 bg-slate-900">
      <div className="flex flex-row items-center space-x-6">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">Market</p>
          <p className="text-md font-semibold">{ticker.symbol.replace("_", " / ")}</p>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">Last Price</p>
          <p className="text-md font-semibold">${ticker.lastPrice}</p>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">24H Change</p>
          <p
            className={`text-md font-semibold ${Number(ticker.priceChange) >= 0 ? "text-green-500" : "text-red-500"
              }`}
          >
            {Number(ticker.priceChange) >= 0 ? "+" : ""}
            {ticker.priceChange} ({ticker.priceChangePercent}%)
          </p>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">24H High</p>
          <p className="text-md font-semibold">{ticker.high}</p>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">24H Low</p>
          <p className="text-md font-semibold">{ticker.low}</p>
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-400">24H Volume</p>
          <p className="text-md font-semibold">{ticker.volume}</p>
        </div>
      </div>
    </div>
  );
}

