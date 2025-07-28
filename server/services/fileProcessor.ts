import fs from "fs";
import path from "path";
import { promisify } from "util";

// Note: In a production environment, you would install these packages:
// npm install pdf-parse mammoth
// For now, we'll provide a basic text extraction implementation

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    if (mimeType === "text/plain") {
      const content = await fs.promises.readFile(filePath, "utf-8");
      return content;
    }
    
    if (mimeType === "application/pdf") {
      // In production, use pdf-parse:
      // const pdfParse = require("pdf-parse");
      // const dataBuffer = await fs.promises.readFile(filePath);
      // const data = await pdfParse(dataBuffer);
      // return data.text;
      
      // Placeholder implementation
      return "PDF text extraction requires pdf-parse package. Please upload a text file for now.";
    }
    
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // In production, use mammoth:
      // const mammoth = require("mammoth");
      // const result = await mammoth.extractRawText({ path: filePath });
      // return result.value;
      
      // Placeholder implementation
      return "DOCX text extraction requires mammoth package. Please upload a text file for now.";
    }
    
    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    console.error("File processing error:", error);
    throw new Error("Failed to extract text from file");
  }
}

export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  return allowedTypes.includes(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
