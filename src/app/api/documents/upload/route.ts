import { NextResponse } from "next/server";
import { parseAndSaveDocument } from "@/lib/services/docParser";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = (formData.get("fileType") as string) || "CV";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsedDoc = await parseAndSaveDocument(file.name, buffer, fileType as "CV" | "CERTIFICATE" | "COVER_LETTER");

    // Merge newly extracted skills into the user profile skill taxonomy
    const existingProfile = await db.userProfile.findFirst();
    if (existingProfile) {
      const currentSkillsObj = JSON.parse(existingProfile.skills || "{}");
      const currentCustomList: string[] = currentSkillsObj.custom || [];
      
      const newCustomList = Array.from(new Set([...currentCustomList, ...parsedDoc.extractedSkills]));
      currentSkillsObj.custom = newCustomList;

      await db.userProfile.update({
        where: { id: existingProfile.id },
        data: { skills: JSON.stringify(currentSkillsObj) },
      });
    }

    return NextResponse.json({
      success: true,
      document: parsedDoc,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const docs = await db.userDocument.findMany({
      orderBy: { uploadedAt: "desc" },
    });

    const formattedDocs = docs.map((doc) => ({
      ...doc,
      extractedSkills: JSON.parse(doc.extractedSkills || "[]"),
    }));

    return NextResponse.json(formattedDocs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch documents" }, { status: 500 });
  }
}
