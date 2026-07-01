"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import {
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { getAvatarInitials } from '@/lib/utils';
import Image from "next/image";
import { APP_CONFIG } from "@/lib/config";
import { Icons } from "@/components/icons";
import { UserNavGroup, UserSignOutDropdownButton } from "@/components/user-nav";

interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()




  const applicationMenu: NavItem[] = [
    {
      title: 'Dashboard',
      url: `/dashboard`,
      icon: 'dashboard',
      isActive: false,
      shortcut: ['a', 'd'],
      items: [],
    },
  ];

  const bookingMenu: NavItem[] = [
    {
      title: 'Book Meeting',
      url: `/dashboard/calendar`,
      icon: 'add',
      isActive: false,
      shortcut: ['b', 'm'],
      items: [],
    },
    {
      title: 'My Bookings',
      url: `/dashboard/bookings`,
      icon: 'page',
      isActive: false,
      shortcut: ['m', 'b'],
      items: [],
    },
  ];

  if (session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN") {
    bookingMenu.push({
      title: 'Manage Bookings',
      url: `/dashboard/manage-bookings`,
      icon: 'kanban',
      isActive: false,
      shortcut: ['e', 'b'],
      items: [],
    })
  }

  const userMenu: NavItem[] = [
    {
      title: 'Profile',
      url: `/dashboard/profile`,
      icon: 'user',
      isActive: false,
      shortcut: ['m', 'p'],
      items: [],
    },
  ]

  if (session?.user?.role === "SUPERADMIN") {
    userMenu.push({
      title: 'Manage Users',
      url: `/dashboard/users`,
      icon: 'employee',
      isActive: false,
      shortcut: ['m', 'u'],
      items: [],
    })
  }


  const navItems = [
    {
      label: "Overview",
      items: applicationMenu,
    },
    {
      label: "Booking",
      items: bookingMenu,
    },
    {
      label: "User",
      items: userMenu,
    }
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex gap-2 py-2 text-sidebar-accent-foreground ">
          <Link href={`/`}>
            <Image
              className="dark:invert group-data-[collapsible=icon]:hidden bg-black/70"
              src="/logo.png"
              alt={APP_CONFIG.SITE_NAME}
              width={180}
              height={38}
              priority
              aria-hidden="true"
            />
            <Image
              className="dark:invert hidden group-data-[collapsible=icon]:block"
              src="/icon.jpg"
              alt={APP_CONFIG.SITE_NAME}
              width={38}
              height={38}
              priority
              aria-hidden="true"
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden gap-0">

        {navItems.map((nav, i) => (
          <SidebarGroup key={i}>
            <SidebarGroupLabel>{nav.label}</SidebarGroupLabel>
            <SidebarMenu>
              {nav.items.map((item) => {
                const Icon = item.icon ? Icons[item.icon] : Icons.logo;

                const childActive = !!(item?.items && item?.items?.length > 0 ? item?.items?.find((c) => pathname === c.url)?.url : false);
                const isCollapseOpen = item.isActive || pathname === item.url || childActive

                return item?.items && item?.items?.length > 0 ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    className="group/collapsible"
                    {...(item.url !== '#' ? { open: isCollapseOpen } : {})}
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        {item.url !== "#" ? (
                          <Link href={item.url}>
                            <SidebarMenuButton
                              tooltip={item.title}
                              isActive={pathname === item.url}
                            >
                              {item.icon && <Icon />}
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </Link>
                        ) : (
                          <SidebarMenuButton
                            tooltip={item.title}
                            isActive={pathname === item.url}
                          >
                            {item.icon && <Icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        )}

                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === subItem.url}
                              >
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>)
        )}



      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image || ''}
                      alt={session?.user?.name || ''}
                    />
                    <AvatarFallback className="rounded-lg">
                      {getAvatarInitials(session?.user?.name || 'A')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name || ''}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email || ''}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={session?.user?.image || ''}
                        alt={session?.user?.name || ''}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getAvatarInitials(session?.user?.name ||
                          'A')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {session?.user?.name || ''}
                      </span>
                      <span className="truncate text-xs">
                        {' '}
                        {session?.user?.email || ''}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <UserNavGroup />
                <DropdownMenuSeparator />
                <UserSignOutDropdownButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
