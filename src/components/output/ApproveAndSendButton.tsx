"use client";

interface Props {
  onSend: () => Promise<void>;
  disabled?: boolean;
}

export function ApproveAndSendButton({ onSend, disabled }: Props) {
  return (
    <button
      onClick={onSend}
      disabled={disabled}
      className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all bg-green-500 hover:bg-green-600 active:scale-95 shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
    >
      Approve and Send
    </button>
  );
}
