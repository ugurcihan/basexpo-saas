import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase-server";
import { getMyContacts } from "@/features/visitors/actions";
import { ContactsClient } from "./ContactsClient";

export default async function ContactsPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "visitor") redirect("/login");

  const contacts = await getMyContacts();

  return <ContactsClient profile={profile} contacts={contacts} />;
}
