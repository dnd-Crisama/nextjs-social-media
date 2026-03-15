import DailyQuests from "@/components/DailyQuests";

export const metadata = {
  title: "Daily Quests",
};

export default function QuestsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Daily Quests</h1>
      <DailyQuests />
    </div>
  );
}