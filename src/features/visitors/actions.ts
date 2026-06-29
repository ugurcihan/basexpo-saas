"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type ContactStatus = "new" | "contacted" | "pending" | "done";

export type ContactLead = {
  id: string;
  score: number;
  created_at: string;
  firm: {
    id: string;
    company_name: string;
    logo_url: string | null;
    tags: string[];
    phone: string | null;
    website: string | null;
    city: string | null;
    contact_name: string | null;
    job_title: string | null;
    linkedin_url: string | null;
    event: { id: string; name: string; location: string; start_date: string } | null;
    contacts: {
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      job_title: string | null;
      contact_type: string;
      sort_order: number;
    }[];
  };
  note: { contact_id: string | null; personal_note: string | null; status: ContactStatus } | null;
};

function normalizeOne<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function getMyContacts(): Promise<ContactLead[]> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: leads }, { data: notes }] = await Promise.all([
    supabase
      .from("leads")
      .select(`
        id, score, created_at,
        exhibitor:exhibitors(
          id, company_name, logo_url, tags, phone, website, city,
          contact_name, job_title, linkedin_url,
          event:events(id, name, location, start_date),
          contacts:exhibitor_contacts(id, full_name, email, phone, job_title, contact_type, sort_order)
        )
      `)
      .eq("visitor_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("visitor_firm_notes")
      .select("exhibitor_id, contact_id, personal_note, status")
      .eq("visitor_id", user.id),
  ]);

  const noteMap = new Map((notes ?? []).map(n => [n.exhibitor_id, n]));

  // Deduplicate by exhibitor_id (visitor may have multiple scans of same firm)
  const seen = new Set<string>();

  return (leads ?? [])
    .filter(l => {
      const ex = normalizeOne(l.exhibitor as Parameters<typeof normalizeOne>[0]);
      if (!ex || seen.has((ex as { id: string }).id)) return false;
      seen.add((ex as { id: string }).id);
      return true;
    })
    .map(l => {
      const ex = normalizeOne(l.exhibitor as Parameters<typeof normalizeOne>[0]) as {
        id: string;
        company_name: string;
        logo_url: string | null;
        tags: string[];
        phone: string | null;
        website: string | null;
        city: string | null;
        contact_name: string | null;
        job_title: string | null;
        linkedin_url: string | null;
        event: unknown;
        contacts: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          contact_type: string;
          sort_order: number;
        }[];
      };
      if (!ex) return null;

      const ev = normalizeOne(ex.event as Parameters<typeof normalizeOne>[0]) as {
        id: string; name: string; location: string; start_date: string;
      } | null;

      const contacts = (Array.isArray(ex.contacts) ? ex.contacts : [])
        .sort((a, b) => a.sort_order - b.sort_order);

      const note = noteMap.get(ex.id) ?? null;

      return {
        id: l.id,
        score: l.score as number,
        created_at: l.created_at as string,
        firm: {
          id: ex.id,
          company_name: ex.company_name,
          logo_url: ex.logo_url,
          tags: ex.tags ?? [],
          phone: ex.phone,
          website: ex.website,
          city: ex.city,
          contact_name: ex.contact_name,
          job_title: ex.job_title,
          linkedin_url: ex.linkedin_url,
          event: ev,
          contacts,
        },
        note: note
          ? {
              contact_id: note.contact_id as string | null,
              personal_note: note.personal_note as string | null,
              status: (note.status ?? "new") as ContactStatus,
            }
          : null,
      };
    })
    .filter((x): x is ContactLead => x !== null);
}

export async function upsertFirmNote(input: {
  exhibitor_id: string;
  contact_id: string | null;
  personal_note: string | null;
  status: ContactStatus;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("visitor_firm_notes")
    .upsert(
      {
        visitor_id: user.id,
        exhibitor_id: input.exhibitor_id,
        contact_id: input.contact_id,
        personal_note: input.personal_note,
        status: input.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "visitor_id,exhibitor_id" },
    );

  if (error) return { error: error.message };
  revalidatePath("/visitor/contacts");
  return { error: null };
}
