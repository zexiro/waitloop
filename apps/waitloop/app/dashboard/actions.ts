"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, createApiKey, revokeApiKey } from "@/lib/auth";
import { createWaitlist, deleteWaitlist } from "@/lib/waitlists";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function createWaitlistAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const w = await createWaitlist(user.id, { name });
  redirect(`/dashboard/w/${w.slug}`);
}

export async function deleteWaitlistAction(formData: FormData) {
  const user = await requireUser();
  await deleteWaitlist(user.id, String(formData.get("id")));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createKeyAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || "default";
  const { key } = await createApiKey(user.id, name);
  // Shown once: pass back via search param on redirect.
  redirect(`/dashboard/keys?new=${encodeURIComponent(key)}`);
}

export async function revokeKeyAction(formData: FormData) {
  const user = await requireUser();
  await revokeApiKey(user.id, String(formData.get("id")));
  revalidatePath("/dashboard/keys");
}
