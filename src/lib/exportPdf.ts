import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportCustomerPdf(element: HTMLElement, filename = "DaBella-Proposal.pdf") {
  // Temporarily remove animations and ensure full render
  element.style.overflow = "visible";

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1200,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const imgWidth = 210; // A4 mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "a4");
  let position = 0;
  const pageHeight = 297;

  // Multi-page support
  let remainingHeight = imgHeight;
  while (remainingHeight > 0) {
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    remainingHeight -= pageHeight;
    if (remainingHeight > 0) {
      pdf.addPage();
      position -= pageHeight;
    }
  }

  pdf.save(filename);
}
