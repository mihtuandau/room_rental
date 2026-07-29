---
name: add-ui-component
description: "Build accessible shared RoomRent UI primitives with Radix, Tailwind, and CVA. Use for buttons, inputs, dialogs, selects, tabs, or badges."
---

# Building a shared UI component (Radix + Tailwind + cva)

Shared components live in `src/components/ui/` and keep the Radix name (`Dialog`,
`Select`, `Checkbox`) so it's obvious what they wrap. Feature-specific components
(`RoomCard`, `FilterPanel`) do **not** belong here — they go under `components/rooms/`,
`components/search/`, etc.

Radix is installed as the consolidated `radix-ui` package, so import primitives from
there rather than from individual `@radix-ui/react-*` packages — with one exception:
`Slot` (used for `asChild`) comes from the standalone `@radix-ui/react-slot`.

**Slot forces a Client Component.** As of Radix v1.2+, `Slot` calls `createContext`, so
any component using `asChild` needs `"use client"`. That's fine — Server Components can
still render it — but it means `asChild` is not free, so don't add it to a component
that doesn't need it.

## Rule: variants belong in `cva`, not in conditional class strings

Anything with more than one visual variant uses `class-variance-authority`. Ad-hoc
ternaries over class names are how two buttons end up subtly different.

## Template: Button

`src/components/ui/button.tsx`
```tsx
"use client"; // required: Slot uses createContext

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // shared: focus ring and disabled handling belong here so no variant can forget them
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:ring-zinc-400",
        outline: "border border-zinc-300 bg-white hover:bg-zinc-50 focus-visible:ring-zinc-400",
        ghost: "hover:bg-zinc-100 focus-visible:ring-zinc-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** render as the child element (e.g. next/link) instead of a <button> */
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
```

`asChild` matters for navigation: `<Button asChild><Link href="/dang-tin">Đăng tin</Link></Button>`
renders a real anchor, which keeps it keyboard- and SEO-friendly, instead of a button
that calls `router.push`.

## Template: Dialog

`src/components/ui/dialog.tsx`
```tsx
"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-xl bg-white p-6 shadow-xl focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className="text-lg font-semibold" {...props} />;
}

export function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className="mt-1 text-sm text-zinc-600" {...props} />;
}
```

Always render a `DialogTitle` — Radix warns when one is missing because screen readers
have nothing to announce. If the design has no visible title, wrap it in
`VisuallyHidden` rather than dropping it.

## Template: Input with error state

`src/components/ui/input.tsx`
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      aria-invalid={error || undefined}
      className={cn(
        "h-10 w-full rounded-lg border bg-white px-3 text-sm transition-colors",
        "placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:bg-zinc-50",
        error
          ? "border-red-500 focus:ring-red-500"
          : "border-zinc-300 focus:border-emerald-600 focus:ring-emerald-600",
        className,
      )}
      {...props}
    />
  );
}
```

## Client vs Server Components

Anything using Radix state (Dialog, Select, Tabs, Dropdown) needs `"use client"`.
Purely presentational components (Button, Input, Badge, Card) do not — leaving the
directive off keeps them usable inside Server Components.

## Do NOT
- Import raw Radix primitives directly in a page or feature component; wrap them here first.
- Encode variants as ternaries over class strings instead of `cva`.
- Hardcode colours per component — reuse the palette already used by the existing variants.
- Drop the focus ring for looks; keyboard users need it.
- Put feature components (RoomCard, FilterPanel) in `components/ui/`.

## Checklist
- [ ] Lives in `components/ui/`, named after the Radix primitive
- [ ] Variants via `cva`, merged with `cn()` so callers can still override
- [ ] `className` is accepted and merged last
- [ ] Focus-visible and disabled states handled
- [ ] `"use client"` only where Radix state requires it
- [ ] Interactive elements have accessible names (`aria-label` / `DialogTitle`)
