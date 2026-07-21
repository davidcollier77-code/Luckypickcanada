import Stripe from 'stripe';
import postgres from 'postgres';
import { sanitizeSingleLine, validatePlainTextField } from './form-security';

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
let stripe;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripe;
}

function getSql() {
  if (!process.env.POSTGRES_URL) {
    return null;
  }

  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL, { max: 1 });
  }

  return sql;
}

export function validateLuckShare({ name, province }) {
  const cleanProvince = String(province || '').toUpperCase();
  const cleanDisplayName = validatePlainTextField({
    value: name,
    label: 'Name',
    minLength: 2,
    maxLength: 40,
    required: true,
    allowUrls: false,
  });

  if (cleanDisplayName.error) {
    return cleanDisplayName;
  }

  if (!provinceCodes.has(cleanProvince)) {
    return { error: 'Choose a Canadian province or territory.' };
  }

  return { name: sanitizeSingleLine(cleanDisplayName.value, 40), province: cleanProvince };
}

async function ensureLuckSharesTable(database) {
  await database`
    create table if not exists luck_shares (
      id bigserial primary key,
      display_name text not null,
      province text not null,
      checkout_session_id text unique,
      created_at timestamptz not null default now()
    )
  `;

  await database`
    alter table luck_shares
    add column if not exists checkout_session_id text unique
  `;
}

async function verifyPaidLuckyPickSession(checkoutSessionId) {
  const stripeClient = getStripe();

  if (!stripeClient) {
    return { error: 'Stripe is not configured. Complete the $1 Lucky Pick checkout first.' };
  }

  if (!checkoutSessionId) {
    return { error: 'Purchase the $1 Lucky Pick before adding yourself to the map.' };
  }

  try {
    const session = await stripeClient.checkout.sessions.retrieve(String(checkoutSessionId));

    if (session.payment_status !== 'paid') {
      return { error: 'Complete the $1 Lucky Pick payment before adding yourself to the map.' };
    }

    if (session.metadata?.checkoutType !== 'lucky_pick' || session.amount_total !== 100 || session.currency !== 'cad') {
      return { error: 'Only the $1 Lucky Pick purchase unlocks the map.' };
    }

    return { checkoutSessionId: session.id };
  } catch (error) {
    console.error('Little Luck Map payment verification failed', error);
    return { error: 'Unable to verify the $1 Lucky Pick purchase.' };
  }
}

export async function createLuckShare({ name, province, checkoutSessionId }) {
  const validated = validateLuckShare({ name, province });

  if (validated.error) {
    return validated;
  }

  const payment = await verifyPaidLuckyPickSession(checkoutSessionId);

  if (payment.error) {
    return payment;
  }

  const database = getSql();

  if (!database) {
    return { error: 'The Little Luck Map database is not configured yet.' };
  }

  try {
    await ensureLuckSharesTable(database);
    await database`
      insert into luck_shares (display_name, province, checkout_session_id)
      values (${validated.name}, ${validated.province}, ${payment.checkoutSessionId})
    `;
  } catch (error) {
    console.error('Little Luck Map failed', error);
    return { error: 'Unable to add this purchase to the map.' };
  }

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
