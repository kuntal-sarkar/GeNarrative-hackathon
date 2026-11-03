// Script import is local-only; PDF text extraction is not OCR.
// Scanned/image-only PDFs require an OCR workflow later.
export async function readScript(file) {
  if (!file) throw new Error("Select a document first.");
  const ext = file.name.toLowerCase().split(".").pop();
  if (!["pdf", "txt", "md"].includes(ext)) throw new Error("Use PDF, TXT or MD files.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Maximum file size is 25 MB.");
  let text = "";
  let pages = 0;
  if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    pages = document.numPages;
    if (pages > 300) throw new Error("PDF is too long (max 300 pages). Split the file first.");
    const chunks = [];
    for (let i = 1; i <= pages; i++) {
      const page = await document.getPage(i);
      const content = await page.getTextContent();
      // Keep line boundaries where available instead of flattening the whole screenplay.
      let line = ""; const lines = [];
      for (const item of content.items) {
        if (typeof item.str !== "string") continue;
        line += item.str;
        if (item.hasEOL) { lines.push(line); line = ""; }
        else line += " ";
      }
      if (line.trim()) lines.push(line);
      chunks.push(lines.join("\n"));
    }
    text = chunks.join("\n\n");
  } else text = await file.text();
  if (!text.trim()) throw new Error("No selectable text found. For scanned PDFs, OCR is needed; this importer doesn't invent text.");
  if (text.length > 1300000) throw new Error("Extracted script exceeds 1,300,000 characters.");
  return { text, filename: file.name, pages };
}
