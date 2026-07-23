---
name: add-form
description: Build a form in the RoomRent frontend with react-hook-form + zod, wired to a React Query mutation and mapping backend validation errors back onto fields — login, register, OTP, post/edit a listing, report a listing, profile, saved search. MUST use this skill for any form — even when the user just says "make the login page", "let them edit their profile", "add a report button". Ensures zod schemas mirror the backend's rules and that a 400 lands on the right field instead of a generic toast.
---

# Building a form (react-hook-form + zod)

Client-side validation exists for UX only — the backend validates everything again
(HARD RULE #3). The schema's job is to catch mistakes early and to mirror the backend's
rules closely enough that a valid form is rarely rejected.

## Mirror the backend's actual constraints

Copying these wrong means the user gets a server error on a form that looked valid:

| Field | Backend rule |
|---|---|
| `phone` | Vietnamese mobile: `/^(0|\+84)(3|5|7|8|9)\d{8}$/` |
| `password` | 8–72 characters (72 is a bcrypt limit) |
| OTP `code` | exactly 6 digits |
| Listing `title` | 10–120 characters |
| `price`, `deposit` | integer VND, price > 0 |
| `description` | ≤ 3000 characters |
| Report `description` | ≤ 1000 characters |

Keep shared schemas in `src/features/<feature>/schemas.ts`.

## Template: schema

`src/features/auth/schemas.ts`
```ts
import { z } from "zod";

export const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export const loginSchema = z.object({
  phone: z.string().regex(VN_PHONE, "Số điện thoại không hợp lệ."),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự.").max(72),
});

export const registerSchema = loginSchema
  .extend({
    fullName: z.string().min(2, "Vui lòng nhập họ tên.").max(100).optional(),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp.",
    path: ["confirmPassword"], // attach to the field, not the form root
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

> There is **no role picker at signup** — any signed-in user can post a listing.
> Don't add a "I'm a landlord" field.

## Template: form component

`src/features/auth/components/login-form.tsx`
```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { loginSchema, type LoginInput } from "../schemas";
import { useLogin } from "../hooks";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      router.push(next);
    } catch (err) {
      // The backend deliberately returns one generic message for a bad phone OR
      // password, so surface it on the form rather than guessing a field.
      if (err instanceof ApiError && err.status === 401) {
        setError("root", { message: err.message });
      } else {
        toast.error("Không đăng nhập được, thử lại sau.");
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">Số điện thoại</label>
        <Input id="phone" inputMode="tel" autoComplete="tel"
          error={!!errors.phone} {...register("phone")} />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Mật khẩu</label>
        <Input id="password" type="password" autoComplete="current-password"
          error={!!errors.password} {...register("password")} />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {errors.root && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </Button>
    </form>
  );
}
```

Every input needs a real `<label htmlFor>` and an `autoComplete` value — password
managers and mobile keyboards depend on them.

## Mapping backend validation errors onto fields

A 400 from `ValidationPipe` returns `message` as an array like
`["Invalid Vietnamese phone number.", "price must be an integer number"]`. Each entry
starts with the property name, so it can usually be routed back to a field:

```ts
function applyServerErrors<T extends Record<string, unknown>>(
  err: unknown,
  setError: UseFormSetError<T>,
) {
  if (!(err instanceof ApiError) || !err.fieldErrors) return false;

  let matched = false;
  for (const message of err.fieldErrors) {
    const field = message.split(" ")[0];           // "price must be…" -> "price"
    if (field && field in ({} as T)) continue;      // guard against odd shapes
    setError(field as Path<T>, { message });
    matched = true;
  }
  return matched;
}
```

If nothing matches, fall back to `setError("root", …)` — never swallow the error silently.

## Template: Google sign-in button

```tsx
"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleLogin } from "@/features/auth/hooks";

export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const googleLogin = useGoogleLogin();
  const router = useRouter();

  return (
    <GoogleLogin
      locale="vi"
      onSuccess={async (res) => {
        // res.credential is the ID token; the backend verifies it
        await googleLogin.mutateAsync({ idToken: res.credential! });
        router.push(next);
      }}
      onError={() => toast.error("Đăng nhập Google thất bại.")}
    />
  );
}
```

A Google account has no phone number, so the user can browse but **cannot post a
listing** until they add a contact phone — the backend answers 400 with
"Add a contact phone number to your profile before posting a listing." Catch that on
the post-listing form and route them to the profile page instead of showing a raw error.

## Multi-step forms (posting a listing)

Keep the step index in a Zustand store, and each step's values in one `useForm` whose
schema is the union of all steps — validate per step with
`trigger(["title", "price"])` before advancing. Submit once at the end so a half-built
listing is never created.

Order matters when posting: create the listing → upload images → set amenities. Both
of the latter need the room id returned by the first call.

## Do NOT
- Skip a backend rule in the zod schema "because the backend checks it" — the user then
  hits a server error on a form that looked valid.
- Show a generic toast for a 400 when the message identifies a field.
- Build inputs without `<label htmlFor>` / `autoComplete`.
- Leave the submit button enabled during submission (double-posts a listing).
- Add a role picker to the signup form.

## Checklist
- [ ] zod schema mirrors the backend's real constraints
- [ ] `zodResolver` wired to `useForm`
- [ ] Field errors rendered next to their input; form-level errors in `errors.root`
- [ ] Backend 400 messages mapped back onto fields where possible
- [ ] Labels + `autoComplete` on every input
- [ ] Submit disabled while `isSubmitting`
- [ ] Mutation via React Query, not a bare `fetch`
