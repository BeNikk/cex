import Banner from "@/components/shared/banner";
import TopBar from "@/components/shared/topbar";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center p-2">
      <TopBar />
      <Banner />
    </div>
  );
}
