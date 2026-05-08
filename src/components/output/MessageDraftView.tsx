"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";

interface Props {
  message: Message;
  onApproveAndSend: (message: Message) => Promise<void>;
}

export function MessageDraftView({ message: initial, onApproveAndSend }: Props) {
  const [message, setMessage] = useState<Message>(initial);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onApproveAndSend(message);
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const typeLabel = {
    job_complete: "Job Complete",
    payment_reminder: "Payment Reminder",
    quote_followup: "Quote Follow-up",
  }[message.type];

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-7xl mb-6">✓</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Message Sent!</h2>
          <p className="text-gray-500">Your {typeLabel.toLowerCase()} has been marked as sent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pb-32">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900 text-white p-6 flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Admin Ghost</div>
              <div className="text-3xl font-bold tracking-tight">MESSAGE</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400 mb-1">Type</div>
              <div className="font-semibold text-sm">{typeLabel}</div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Subject */}
            {message.subject !== undefined && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Subject
                </div>
                <input
                  className="w-full bg-gray-50 rounded-lg px-3 py-2 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition text-sm font-medium text-gray-900"
                  value={message.subject ?? ""}
                  onChange={(e) => setMessage((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Subject line"
                />
              </div>
            )}

            {/* Body */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Message
              </div>
              <textarea
                className="w-full bg-gray-50 rounded-lg px-3 py-3 border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none transition text-sm text-gray-700 resize-none leading-relaxed"
                rows={10}
                value={message.body}
                onChange={(e) => setMessage((prev) => ({ ...prev, body: e.target.value }))}
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {message.body.length} characters
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom send bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSend}
              disabled={sending}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg shadow-green-200 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {sending ? "Sending..." : "Approve and Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
