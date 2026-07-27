"use client"

import Link from "next/link"
import { CheckIcon, LogOutIcon, StoreIcon, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type MenuStore = {
  id: string
  name: string
  slug: string
  role: string
  isActive: boolean
}

function UserMenu({
  name,
  email,
  avatarUrl,
  stores,
}: {
  name: string
  email: string
  avatarUrl: string | null
  stores: MenuStore[]
}) {
  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || email[0]?.toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/*
          The label MUST be inside a Group. Base UI's Menu.GroupLabel reads
          MenuGroupContext and throws without it — unlike Radix, where a label
          stands alone. Easy to miss when porting a shadcn snippet.
        */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium">
              {name || "Your account"}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem render={<Link href="/dashboard/account" />}>
          <UserIcon />
          My Account
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <StoreIcon />
            Stores
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            {stores.map((store) => (
              /*
                A form POST, not a link: switching sets an httpOnly cookie, so
                it has to be a server round trip — and a GET that mutates state
                would be triggerable by a prefetch.
              */
              <form
                key={store.id}
                action="/api/stores/switch"
                method="post"
                className="contents"
              >
                <input type="hidden" name="storeId" value={store.id} />
                <DropdownMenuItem
                  // Menu.Item assumes a non-button (nativeButton defaults to
                  // false). This really is a native submit button — that's what
                  // makes the form work without JavaScript — so say so, or Base
                  // UI layers on role/aria-disabled it doesn't need.
                  nativeButton
                  render={<button type="submit" className="w-full" />}
                >
                  {store.isActive ? (
                    <CheckIcon className="text-primary" />
                  ) : (
                    <span className="size-4" aria-hidden="true" />
                  )}
                  <span className="flex min-w-0 flex-1 flex-col text-left">
                    <span className="truncate">{store.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {store.role}
                    </span>
                  </span>
                </DropdownMenuItem>
              </form>
            ))}

            {stores.length === 0 ? (
              <DropdownMenuItem disabled>No stores yet</DropdownMenuItem>
            ) : null}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/dashboard/settings" prefetch={false} />}
            >
              <StoreIcon />
              Store settings
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/*
          A real form POST, not a fetch: sign-out must not be reachable by GET
          (any prefetch or <img src> would log the user out), and a form works
          without JavaScript.
        */}
        <form action="/api/auth/sign-out" method="post">
          <DropdownMenuItem
            variant="destructive"
            nativeButton
            render={<button type="submit" className="w-full" />}
          >
            <LogOutIcon />
            Logout
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserMenu }
