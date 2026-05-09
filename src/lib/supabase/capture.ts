export type SupabaseServiceConfig = {
  supabaseUrl: string;
  serviceRoleKey: string;
};

type SupabaseUserListResponse = {
  users?: Array<{ id?: string }>;
};

type PublicUserResponse = Array<{ id?: string }>;

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), serviceRoleKey };
}

export async function ensureCaptureBucket(
  config: SupabaseServiceConfig,
  bucketName: string,
) {
  const response = await fetch(`${config.supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
    }),
  });

  if (response.ok) {
    return;
  }

  const errorText = await response.text();

  if (
    response.status === 400 &&
    errorText.toLowerCase().includes("already exists")
  ) {
    return;
  }

  throw new Error(`Failed to ensure '${bucketName}' storage bucket: ${errorText}`);
}

export async function resolveCaptureUserId(config: SupabaseServiceConfig) {
  if (process.env.CAPTURE_USER_ID) {
    return process.env.CAPTURE_USER_ID;
  }

  const publicUserResponse = await fetch(
    `${config.supabaseUrl}/rest/v1/users?select=id&limit=1`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
    },
  );

  if (publicUserResponse.ok) {
    const users = (await publicUserResponse.json()) as PublicUserResponse;

    if (users[0]?.id) {
      return users[0].id;
    }
  }

  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/admin/users?page=1&per_page=1`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SupabaseUserListResponse;

  return payload.users?.[0]?.id ?? null;
}
