"use client"
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { NotificationBell } from "@/components/notification-bell";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center px-4 gap-2">
        <SidebarTrigger className="-ml-1 [&_svg]:size-5" />
      </div>
      <div className="flex items-center gap-2 px-4">
        <NotificationBell />
        <UserNav />
      </div>
    </header>
  );
}
