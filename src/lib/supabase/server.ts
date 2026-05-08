export function createSupabaseServerClient() {
  return { kind: "server-client" } as const;
}
