import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Captures an array of HTML elements as separate sections,
 * each starting on a new PDF page, producing a multi-section A4 document.
 */
export async function exportCustomerPdf(
  sections: HTMLElement[],
  filename = "DaBella-Proposal.pdf",
) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  let firstPage = true;

  for (const section of sections) {
    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Paginate this section
    let position = 0;
    let remaining = imgHeight;

    while (remaining > 0) {
      if (!firstPage) pdf.addPage();
      firstPage = false;
      pdf.addImage(imgData, "JPEG", 0, position, pageWidth, imgHeight);
      remaining -= pageHeight;
      position -= pageHeight;
    }
  }

  pdf.save(filename);
}
