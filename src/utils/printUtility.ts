/**
 * High-reliability printing utility for Dues Book v7
 * Handles printing smoothly even when hosted inside sandboxed preview iframes.
 */

export function printDocumentElement(elementId: string, title: string = 'Dues Book Document'): void {
  const element = document.getElementById(elementId);

  if (!element) {
    window.print();
    return;
  }

  try {
    // Create an invisible iframe specifically for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Print Frame');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return;
    }

    // Collect all stylesheets and style tags currently loaded in the parent document
    const headStyles: string[] = [];
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      headStyles.push(node.outerHTML);
    });

    const printStyles = `
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 12mm 12mm;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        body {
          background-color: #ffffff !important;
          color: #0f172a !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          margin: 0 !important;
          padding: 8px !important;
          font-size: 10pt !important;
          line-height: 1.35 !important;
        }
        .print\\:hidden, button, [role="tooltip"] {
          display: none !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        th, td {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 5px 7px !important;
        }
        .break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      </style>
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${headStyles.join('\n')}
          ${printStyles}
        </head>
        <body>
          <div class="print-container">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print()', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    };

    // Wait for styles and fonts to render in iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.onload = triggerPrint;
      setTimeout(triggerPrint, 350);
    } else {
      setTimeout(triggerPrint, 350);
    }
  } catch (err) {
    console.warn('Dedicated print iframe failed, triggering window.print()', err);
    window.print();
  }
}
