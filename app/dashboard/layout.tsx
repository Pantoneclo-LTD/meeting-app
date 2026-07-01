import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col pl-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {children}
        </main>
      </div>
    </div>
  )
}
