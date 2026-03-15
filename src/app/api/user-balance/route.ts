import { validateRequest } from "@/auth";
import { getUserBalance } from "@/lib/spoint-activities";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balance = await getUserBalance(user.id);

    return Response.json(balance);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
