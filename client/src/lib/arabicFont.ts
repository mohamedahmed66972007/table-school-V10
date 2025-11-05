import { jsPDF } from "jspdf";
import { AVAILABLE_ARABIC_FONTS } from "@/types/pdfCustomization";
import type { CustomFontUpload } from "@/types/pdfCustomization";

export async function loadArabicFont(
  doc: jsPDF,
  fontName: string = "Cairo",
  customFontData?: CustomFontUpload
): Promise<string> {
  try {
    if (customFontData) {
      const fileName = `${customFontData.name}.ttf`;
      doc.addFileToVFS(fileName, customFontData.base64Data);
      doc.addFont(fileName, customFontData.name, "normal");
      return customFontData.name;
    }

    const fontConfig = AVAILABLE_ARABIC_FONTS.find((f) => f.value === fontName);
    if (!fontConfig) {
      console.warn(`Font ${fontName} not found, using Taro`);
      fontName = "Taro";
    }

    const response = await fetch(fontConfig!.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let binary = "";
    uint8Array.forEach((byte) => (binary += String.fromCharCode(byte)));
    const base64Font = btoa(binary);

    const fontFileName = `${fontName}-Regular.ttf`;
    doc.addFileToVFS(fontFileName, base64Font);
    doc.addFont(fontFileName, fontName, "normal");
    return fontName;
  } catch (error) {
    console.error("Failed to load Arabic font:", error);
    return "helvetica";
  }
}

export async function loadMultipleFonts(
  doc: jsPDF,
  headerFontName: string,
  contentFontName: string,
  dayFontName: string,
  customHeaderFont?: CustomFontUpload,
  customContentFont?: CustomFontUpload,
  customDayFont?: CustomFontUpload
): Promise<{ header: string; content: string; day: string }> {
  try {
    const headerFont = await loadArabicFont(doc, headerFontName, customHeaderFont);
    const contentFont = await loadArabicFont(doc, contentFontName, customContentFont);
    const dayFont = await loadArabicFont(doc, dayFontName, customDayFont);

    return {
      header: headerFont,
      content: contentFont,
      day: dayFont,
    };
  } catch (error) {
    console.error("Failed to load multiple fonts:", error);
    return {
      header: "helvetica",
      content: "helvetica",
      day: "helvetica",
    };
  }
}