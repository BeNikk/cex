import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

export default function TopBar() {
  return (
    <div className="flex flex-row h-10 w-full items-center justify-between">
      <div
        className="flex flex-row items-center gap-6 text-white"
      >
        <Link href={'/'}
          className="flex flex-row items-center gap-2 text-white"
        >
          <Image src={'/backpack-logo-1.svg'} width={32} height={32} alt="backpack-logo" />
          <p className="font-bold text-white text-lg">
            Backpack
          </p>
        </Link>
        <Link href={`/trade/SOL_USDC`}>
          <p className="text-[#969faf] text-sm font-bold">
            Trade
          </p>
        </Link>
        <Link href={'https://github.com/BeNikk/cex'}>
          <p className="text-[#969faf] text-sm font-bold">
            Star
          </p>
        </Link>
        <Link href={'https://github.com/BeNikk/cex/blob/main/README.md'}>
          <p className="text-[#969faf] text-sm font-bold">
            Learn
          </p>
        </Link>
        <Link href={'https://backpack.exchange'}>
          <p className="text-[#969faf] text-sm font-bold">
            Original
          </p>
        </Link>
      </div>
      <div className="flex flex-row items-center gap-2">
        <Button className="bg-[#152b23] text-[#00c279] font-bold ">
          Signup
        </Button>
        <Button className="bg-[#192439] text-[#498ff6] font-bold text-sm">
          Signin
        </Button>
      </div>
    </div>
  )
}
