import Image from "next/image";
import { Button } from "../ui/button";

export default function Banner() {
  return (
    <div className="bg-[#0a0311] rounded-lg text-white w-[80%] mt-8 h-[360px] mx-auto flex flex-col  items-start justify-start">
      <div className="mx-6 flex flex-row">
        <div className="mt-24 flex flex-col gap-2 items-start">
          <p className="font-bold text-4xl text-white">
            Earn 4.51% APY on your SOL collateral
          </p>
          <p className="text-[#969faf] font-bold text-md">
            Lend sol to use as staking yield + lending yield, and use as a collateral
          </p>
          <Button className="bg-white font-bold text-black">
            Lend Sol
          </Button>
        </div>
        <div>
          <Image src={'/bag.png'} alt="bag-image" height={300} width={300} className="ml-16 mt-8 rounded-xl" />
        </div>
      </div>

    </div>
  )
}
