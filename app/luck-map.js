import postgres from 'postgres';

export const provinces = [
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'ON', name: 'Ontario' },
  { code: 'QC', name: 'Quebec' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
];

const provinceCodes = new Set(provinces.map((province) => province.code));

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

function cleanName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);
}

export function validateLuckShare({ name, province }) {
  const cleanProvince = String(province || '').toUpperCase();
  const cleanDisplayName = cleanName(name);

  if (!cleanDisplayName || cleanDisplayName.length < 2) {
    return { error: 'Enter a name with at least 2 characters.' };
  }

  if (!provinceCodes.has(cleanProvince)) {
    return { error: 'Choose a Canadian province or territory.' };
  }

  return { name: cleanDisplayName, province: cleanProvince };
}

async function ensureLuckSharesTable(database) {
  await database`
    create table if not exists luck_shares (
      id bigserial primary key,
      display_name text not null,
      province text not null,
      created_at timestamptz not null default now()
    )
  `;
}

export async function createLuckShare({ name, province }) {
  const validated = validateLuckShare({ name, province });

  if (validated.error) {
    return validated;
  }

  const database = getSql();

  if (!database) {
    return { error: 'The Little Luck Map database is not configured yet.' };
  }

  await ensureLuckSharesTable(database);
  await database`
    insert into luck_shares (display_name, province)
    values (${validated.name}, ${validated.province})
  `;

  return { ok: true };
}

export async function getLuckMap() {
  const database = getSql();

  if (!database) {
    return { provinceCounts: {}, recentShares: [], totalShares: 0, isConfigured: false };
  }

  try {
    await ensureLuckSharesTable(database);

    const rows = await database`
      select display_name, province, created_at
      from luck_shares
      order by created_at desc
      limit 12
    `;

    const counts = await database`
      select province, count(*)::int as count
      from luck_shares
      group by province
    `;

    const provinceCounts = Object.fromEntries(counts.map((row) => [row.province, row.count]));
    const totalShares = counts.reduce((total, row) => total + row.count, 0);

    return { provinceCounts, recentShares: rows, totalShares, isConfigured: true };
  } catch (error) {
    console.error('Little Luck Map failed', error);
    return { provinceCounts: {}, recentShares: [], totalShares: 0, isConfigured: false };
  }
}
