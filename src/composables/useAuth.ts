import { ref } from "vue";
import type { User } from "@supabase/supabase-js";
import { requireClient, supabase } from "../lib/client";
import type { Module, PortalAccount } from "../lib/types";
export const currentUser = ref<User | null>(null);
export const portalAccount = ref<PortalAccount | null>(null);
let initialized: Promise<void> | null = null;
export async function refreshPortalAccount() {
  portalAccount.value = null;
  if (!currentUser.value) return;
  const { data } = await requireClient()
    .from("officers_and_committees")
    .select("*")
    .eq("user_id", currentUser.value.id)
    .eq("active", true)
    .single();
  portalAccount.value = data as PortalAccount | null;
}
export function initAuth() {
  if (!initialized)
    initialized = (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      currentUser.value = data.session?.user ?? null;
      await refreshPortalAccount();
      supabase.auth.onAuthStateChange((_event, session) => {
        currentUser.value = session?.user ?? null;
        setTimeout(() => {
          void refreshPortalAccount();
        }, 0);
      });
    })();
  return initialized;
}
export const can = (module: Module) =>
  !!portalAccount.value &&
  (portalAccount.value.is_admin ||
    portalAccount.value.modules.includes(module));
export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
  portalAccount.value = null;
  currentUser.value = null;
}
