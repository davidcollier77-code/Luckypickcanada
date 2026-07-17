import postgres from 'postgres';

let sql;

function getSql() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }

  return sql;
}

function cleanText(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function validateSuggestion({ name, email, message }) {
  const cleanName = cleanText(name, 40);
  const cleanEmail = cleanText(email, 120).toLowerCase();
  const cleanMessage = cleanText(message, 1000);

  if (!cleanMessage || cleanMessage.length < 10) {
    return { error: 'Enter a suggestion with at least 10 characters.' };
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: 'Enter a valid email address or leave it blank.' };
  }

  return {
    name: cleanName || null,
    email: cleanEmail || null,
    message: cleanMessage,
  };
}

async function ensureSuggestionsTable(database) {
  await database`
    create table if not exists suggestions (
      id bigserial primary key,
      display_name text,
      email text,
      message text not null,
      created_at timestamptz not null default now()
    )
  `;
}

export async function createSuggestion({ name, email, message, website }) {
  if (website) {
    return { ok: true };
  }

  const validated = validateSuggestion({ name, email, message });

  if (validated.error) {
    return validated;
  }

  const database = getSql();

  if (!database) {
    return { error: 'The suggestion box database is not configured yet.' };
  }

  try {
    await ensureSuggestionsTable(database);
    await database`
      insert into suggestions (display_name, email, message)
      values (${validated.name}, ${validated.email}, ${validated.message})
    `;
  } catch (error) {
    console.error('Suggestion box failed', error);
    return { error: 'Unable to save this suggestion right now.' };
  }

  return { ok: true };
}
