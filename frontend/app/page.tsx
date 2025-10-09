import Banner from "@/components/shared/banner";
import Markets from "@/components/shared/markets";
import TopBar from "@/components/shared/topbar";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-2">
      <TopBar />
      <Banner />
      <Markets />
    </div>
  );
}
