import { NextRequest, NextResponse } from "next/server";
import { parseAndSaveDocument } from "@/lib/services/docParser";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/authHelper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string) || "CV";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedDoc = await parseAndSaveDocument(
      file.name,
      buffer,
      fileType as "CV" | "CERTIFICATE" | "COVER_LETTER",
      user.id
    );

    // 1. Merge newly extracted skills into the authenticated user's V2 CareerProfile
    const careerProfile = await db.careerProfile.findFirst({
      where: { userAccountId: user.id },
    });

    if (careerProfile) {
      const existingSkills: string[] = JSON.parse(careerProfile.skills || "[]");
      const updatedSkills = Array.from(new Set([...existingSkills, ...parsedDoc.extractedSkills]));
      await db.careerProfile.update({
        where: { id: careerProfile.id },
        data: { skills: JSON.stringify(updatedSkills) },
      });
    }

    // 2. Also merge into the account-scoped userProfile for UI compatibility
    const existingProfile = await db.userProfile.findFirst({
      where: { userAccountId: user.id },
    });
    if (existingProfile) {
      const currentSkillsObj = JSON.parse(existingProfile.skills || "{}");
      const currentCustomList: string[] = currentSkillsObj.custom || [];

      currentSkillsObj.custom = Array.from(
        new Set([...currentCustomList, ...parsedDoc.extractedSkills])
      );

      await db.userProfile.update({
        where: { id: existingProfile.id },
        data: { skills: JSON.stringify(currentSkillsObj) },
      });
    }

    return NextResponse.json({
      success: true,
      document: parsedDoc,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message || "Failed to upload document" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docs = await db.userDocument.findMany({
      where: { userAccountId: user.id },
      orderBy: { uploadedAt: "desc" },
    });

    const formattedDocs = docs.map((doc) => ({
      ...doc,
      extractedSkills: JSON.parse(doc.extractedSkills || "[]"),
    }));

    return NextResponse.json(formattedDocs);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message || "Failed to fetch documents" }, { status: 500 });
  }
}
