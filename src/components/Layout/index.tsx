"use client";
import Header from "./Header";
import Sidebar from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E8EBF4] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-[#EFF2FC]">{children}</main>
      </div>
    </div>
  );
}
