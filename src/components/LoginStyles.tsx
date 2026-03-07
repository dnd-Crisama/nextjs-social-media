"use client";

export default function AnimeLoginStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Nunito:wght@400;600;700&display=swap');

      @keyframes float {
        0%, 100% { transform: translateY(0px) scale(1); opacity: 0.45; }
        50% { transform: translateY(-10px) scale(1.15); opacity: 0.85; }
      }

      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }

      input {
        background: rgba(237, 233, 254, 0.55) !important;
        border-color: rgba(139, 92, 246, 0.28) !important;
        color: #3b1f6e !important;
        font-family: 'Nunito', sans-serif !important;
        transition: all 0.3s ease;
        border-radius: 10px !important;
      }

      input::placeholder {
        color: rgba(109, 40, 217, 0.32) !important;
      }

      input:focus {
        background: rgba(245, 243, 255, 0.9) !important;
        border-color: rgba(139, 92, 246, 0.65) !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1), 0 4px 16px rgba(139, 92, 246, 0.12) !important;
        outline: none !important;
      }

      label {
        color: #6d28d9 !important;
        font-size: 0.72rem !important;
        letter-spacing: 0.1em !important;
        text-transform: uppercase !important;
        font-weight: 700 !important;
        font-family: 'Nunito', sans-serif !important;
      }

      button[type="submit"] {
        background: linear-gradient(135deg, #7c3aed, #a855f7, #ec4899, #a855f7, #7c3aed) !important;
        background-size: 300% auto !important;
        border: none !important;
        border-radius: 12px !important;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease !important;
        box-shadow: 0 4px 20px rgba(139, 92, 246, 0.32);
        font-weight: 700 !important;
        letter-spacing: 0.08em !important;
        font-family: 'Nunito', sans-serif !important;
        color: white !important;
        animation: shimmer 4s linear infinite;
      }

      button[type="submit"]:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 8px 28px rgba(139, 92, 246, 0.42) !important;
      }

      button[type="submit"]:active:not(:disabled) {
        transform: translateY(0px) scale(0.99);
      }

      button[type="submit"]:disabled {
        opacity: 0.65;
        cursor: not-allowed;
        animation: none;
      }

      .relative button[type="button"] {
        color: rgba(139, 92, 246, 0.45) !important;
        transition: color 0.2s ease !important;
      }
      .relative button[type="button"]:hover {
        color: rgba(109, 40, 217, 0.85) !important;
      }

      p[class*="destructive"] {
        color: #dc2626 !important;
        background: rgba(254, 202, 202, 0.45);
        border: 1px solid rgba(252, 165, 165, 0.7);
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 0.8rem;
      }

      [class*="FormMessage"] {
        color: #dc2626 !important;
        font-size: 0.73rem !important;
      }
    `}</style>
  );
}