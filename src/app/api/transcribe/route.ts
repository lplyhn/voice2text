import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";

export async function POST(req: NextRequest) {
  let tempFilePath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create a temporary file to store the uploaded audio
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `upload_${Date.now()}_${file.name}`);
    await fs.writeFile(tempFilePath, buffer);

    // Call the local Python script for transcription
    const pythonScriptPath = path.join(process.cwd(), "transcribe.py");
    
    const transcription = await new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn("python", [pythonScriptPath, tempFilePath!]);
      
      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
          return;
        }
        try {
          const result = JSON.parse(output);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.text);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      });
    });

    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error("Local transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio locally" },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        console.error("Failed to delete temp file:", e);
      }
    }
  }
}
