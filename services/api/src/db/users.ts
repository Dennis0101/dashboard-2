import { sql } from "./client.js";

export async function upsertUser(params: {
  userId: string;
  provider: string;
  providerSubject: string;
  email?: string;
}): Promise<void> {
  if (!sql) return;
  const { userId, provider, providerSubject, email } = params;

  await sql.begin(async (tx) => {
    await tx`
      insert into app_users (id, provider, provider_subject, email)
      values (${userId}::uuid, ${provider}, ${providerSubject}, ${email ?? null})
      on conflict (provider, provider_subject)
      do update set email = excluded.email
    `;

    // Default tier. In production this should be driven by billing system.
    await tx`
      insert into subscriptions (user_id, tier)
      values (${userId}::uuid, 'basic')
      on conflict (user_id)
      do update set updated_at = now()
    `;
  });
}

