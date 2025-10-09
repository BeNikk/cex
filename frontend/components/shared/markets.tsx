"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from "next/image"
import { useRouter } from "next/navigation"

const markets = [
  {
    market: "SOL",
    price: '$227',
    volume: '82.7M',
    marketCap: '$124.3B'
  }
]
export default function Markets() {
  const router = useRouter()

  return (
    <div className="bg-[#14151b] w-[80%] rounded-lg text-white mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] text-[#9099a9] text-md font-bold">Name</TableHead>
            <TableHead className="text-[#9099a9] font-bold text-md">Price</TableHead>
            <TableHead className="text-[#9099a9] text-md font-bold">24h Volume</TableHead>
            <TableHead className="text-right text-[#9099a9] font-bold text-md">Market Cap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {markets.map((market) => (
            <TableRow key={market.market} onClick={() => {
              router.push('/trade/SOL_USDC')
            }}>
              <TableCell className="font-bold flex flex-row items-center gap-2 text-lg text-white">
                <Image src={'/sol.png'} alt="sol" height={32} width={32}></Image>
                <p>
                  {market.market}
                </p>
              </TableCell>
              <TableCell className="text-lg text-white font-bold">{market.price}</TableCell>
              <TableCell className="text-lg text-white font-bold">{market.volume}</TableCell>
              <TableCell className="text-right text-lg text-white font-bold">{market.marketCap}</TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>

    </div >
  )
}


