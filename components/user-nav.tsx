'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn, getAvatarInitials } from '@/lib/utils';
import { BadgeCheck, Bell } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export function UserNav() {
  const { data: session } = useSession();

  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn(["relative rounded-full h-8"])}>
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session.user?.image ?? ''}
                  alt={session.user?.name ?? ''}
                />
                <AvatarFallback>{getAvatarInitials(session.user?.name || '')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 justify-end items-start">
                <p className="text-sm font-medium leading-none">
                  {session.user?.name}
                </p>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session.user?.image ?? ''}
                  alt={session.user?.name ?? ''}
                />
                <AvatarFallback>{getAvatarInitials(session.user?.name || '')}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session.user?.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <UserNavGroup />
          <DropdownMenuSeparator />
          <UserSignOutDropdownButton />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}


export function UserNavGroup() {

  return (<DropdownMenuGroup>
    <DropdownMenuItem asChild>
      <Link href={"/dashboard/profile"}>
        <BadgeCheck />
        Profile
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href={"/dashboard/notifications"}>
        <Bell />
        Notifications
        <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
      </Link>
    </DropdownMenuItem>
  </DropdownMenuGroup>)
}


export function UserSignOutDropdownButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const result = await signOut({
      redirect: false,
      redirectTo: '/login',
    })

    if (result?.url) {
      return router.replace('/login');
    }
  }

  return (<DropdownMenuItem onClick={() => handleSignOut()}>
    Log out
    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
  </DropdownMenuItem>)
}