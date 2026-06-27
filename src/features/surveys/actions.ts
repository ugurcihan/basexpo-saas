"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function getMyActiveSurvey(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: survey } = await supabase
    .from("exhibitor_surveys")
    .select("id, title, is_active")
    .eq("exhibitor_id", exhibitorId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!survey) return null;

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, question_text, question_type, options, sort_order, is_required")
    .eq("survey_id", survey.id)
    .order("sort_order", { ascending: true });

  return { ...survey, questions: questions ?? [] };
}

export async function getExhibitorSurvey(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: survey } = await supabase
    .from("exhibitor_surveys")
    .select("id, title, is_active")
    .eq("exhibitor_id", exhibitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!survey) return null;

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, question_text, question_type, options, sort_order, is_required")
    .eq("survey_id", survey.id)
    .order("sort_order", { ascending: true });

  return { ...survey, questions: questions ?? [] };
}

export async function createOrGetSurvey(exhibitorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın", surveyId: null };

  const { data: existing } = await supabase
    .from("exhibitor_surveys")
    .select("id")
    .eq("exhibitor_id", exhibitorId)
    .limit(1)
    .maybeSingle();

  if (existing) return { error: null, surveyId: existing.id };

  const { data, error } = await supabase
    .from("exhibitor_surveys")
    .insert({ exhibitor_id: exhibitorId, title: "Anket", is_active: true })
    .select("id")
    .single();

  if (error) return { error: error.message, surveyId: null };
  return { error: null, surveyId: data.id };
}

export async function toggleSurvey(surveyId: string, isActive: boolean) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { data: exhibitors } = await supabase
    .from("exhibitors")
    .select("id")
    .eq("owner_id", user.id);

  const exhibitorIds = (exhibitors ?? []).map(e => e.id);
  if (exhibitorIds.length === 0) return { error: "Firma profili bulunamadı" };

  const { error } = await supabase
    .from("exhibitor_surveys")
    .update({ is_active: isActive })
    .eq("id", surveyId)
    .in("exhibitor_id", exhibitorIds);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function addQuestion(input: {
  surveyId: string;
  question_text: string;
  question_type: "yes_no" | "multiple_choice";
  options?: string[];
  sort_order?: number;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("survey_questions")
    .insert({
      survey_id: input.surveyId,
      question_text: input.question_text,
      question_type: input.question_type,
      options: input.options ?? null,
      sort_order: input.sort_order ?? 0,
    });

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function updateQuestion(input: {
  questionId: string;
  question_text: string;
  question_type: "yes_no" | "multiple_choice";
  options?: string[];
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("survey_questions")
    .update({
      question_text: input.question_text,
      question_type: input.question_type,
      options: input.options ?? null,
    })
    .eq("id", input.questionId);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const { error } = await supabase
    .from("survey_questions")
    .delete()
    .eq("id", questionId);

  if (error) return { error: error.message };
  revalidatePath("/exhibitor/card");
  return { error: null };
}

export async function submitSurveyResponses(responses: Array<{
  surveyId: string;
  questionId: string;
  responseValue: string;
}>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Giriş yapmalısın" };

  const rows = responses.map(r => ({
    survey_id: r.surveyId,
    question_id: r.questionId,
    visitor_id: user.id,
    response_value: r.responseValue,
  }));

  const { error } = await supabase
    .from("survey_responses")
    .upsert(rows, { onConflict: "question_id,visitor_id" });

  if (error) return { error: error.message };
  return { error: null };
}

export async function getSurveyResults(surveyId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, question_text, question_type, options")
    .eq("survey_id", surveyId)
    .order("sort_order", { ascending: true });

  const { data: responses } = await supabase
    .from("survey_responses")
    .select("question_id, response_value")
    .eq("survey_id", surveyId);

  const results = (questions ?? []).map(q => {
    const qResponses = (responses ?? []).filter(r => r.question_id === q.id);
    const counts: Record<string, number> = {};
    qResponses.forEach(r => { counts[r.response_value] = (counts[r.response_value] ?? 0) + 1; });
    return { ...q, total: qResponses.length, counts };
  });

  return results;
}
