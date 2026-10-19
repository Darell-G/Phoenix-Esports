import { ref } from "vue";

function saved(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences still work when storage is unavailable. */
  }
}
const storedTheme = saved("phoenix.portal.theme");
const dark = ref(
  storedTheme === "dark" ||
    (storedTheme !== "light" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches),
);
const collapsed = ref(saved("phoenix.portal.sidebar") === "collapsed");

export function usePortalPreferences() {
  function toggleTheme() {
    dark.value = !dark.value;
    persist("phoenix.portal.theme", dark.value ? "dark" : "light");
  }
  function toggleSidebar() {
    collapsed.value = !collapsed.value;
    persist(
      "phoenix.portal.sidebar",
      collapsed.value ? "collapsed" : "expanded",
    );
  }
  return { dark, collapsed, toggleTheme, toggleSidebar };
}
