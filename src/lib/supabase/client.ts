export function createSupabaseBrowserClient() {
  return { kind: "browser-client" } as const;
}
