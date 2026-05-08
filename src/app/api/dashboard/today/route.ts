export async function GET() {
  return Response.json({
    date_label: "Today",
    headline: "Your admin starts with what you capture in the van.",
    quick_actions: [
      {
        id: "voice-capture",
        label: "Record Job Note",
        description: "Speak the job details now and draft the invoice later.",
      },
      {
        id: "receipt-capture",
        label: "Snap Receipt",
        description: "Store the receipt now so the expense is not lost tonight.",
      },
    ],
    reminders: [
      "Unsent invoice draft for Queen Street leak repair",
      "Receipt missing for replacement valve purchase",
      "Follow-up message due for Sarah this afternoon",
    ],
  });
}
