import { GoogleGenAI } from "@google/genai";
import fs from "fs";
const p = "./node_modules/@google/genai/dist/genai.d.ts";
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, "utf-8");
  const lines = content.split('\n');
  for(let i=0; i<lines.length; i++) {
    if (lines[i].includes("export declare interface Blob ") || lines[i].includes("export declare interface Blob_2")) {
      console.log(lines.slice(Math.max(0, i-2), i+15).join('\n'));
    }
  }
}
