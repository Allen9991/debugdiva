export async function POST(request: Request) {
  const { document_id, document_type } = await request.json();

  // Once Jayden's DB schema is set up replace with:
  // const supabase = createSupabaseServerClient()
  // const table = document_type === "invoice" ? "invoices" : document_type === "quote" ? "quotes" : "messages"
  // await supabase.from(table).update({ status: "sent", sent_at }).eq("id", document_id)

  const sent_at = new Date().toISOString();
  return Response.json({ sent: true, sent_at });
}
