import { validateRequest } from "@/auth";
import { recordActivity } from "@/lib/spoint-activities";

export async function POST() {
  const { user } = await validateRequest();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await recordActivity(user.id, "DAILY_CHECKIN");
    if (!result) return Response.json({ error: "Already checked in today" }, { status: 400 });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}