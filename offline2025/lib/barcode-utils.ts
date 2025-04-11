// This utility file provides barcode generation and printing functionality

export const generateBarcodeSVG = (value: string): string => {
    if (!value) return ""
  
    try {
      // In a real implementation, this would use a barcode library
      // For now, we'll return a placeholder SVG
      return `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50%" y="20" font-family="Arial" font-size="12" text-anchor="middle">${value}</text>
        <g transform="translate(20,30)">
          ${generateBarcodeLines(value)}
        </g>
        <text x="50%" y="70" font-family="Arial" font-size="12" text-anchor="middle">${value}</text>
      </svg>`.replace(/#/g, "%23")
    } catch (error) {
      console.error("Error generating barcode:", error)
      return ""
    }
  }
  
  // Helper function to generate simple barcode lines
  const generateBarcodeLines = (value: string): string => {
    let result = ""
    const chars = value.split("")
    let position = 0
  
    chars.forEach((char, index) => {
      const width = 2 + (char.charCodeAt(0) % 3)
      const gap = 1
      const height = 30
  
      result += `<rect x="${position}" y="0" width="${width}" height="${height}" fill="black"/>`
      position += width + gap
    })
  
    return result
  }
  
  // Print barcode function
  export const printBarcode = (product: { name: string; barcode: string; price: number }) => {
    const barcodeImg = generateBarcodeSVG(product.barcode)
    if (!barcodeImg) return
  
    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to print barcodes")
      return
    }
  
    // Create content for the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcode - ${product.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .barcode-container {
            display: inline-block;
            margin: 10px;
            padding: 10px;
            border: 1px dashed #ccc;
            text-align: center;
          }
          .product-name {
            font-size: 12px;
            margin-bottom: 5px;
            font-weight: bold;
          }
          .product-price {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .barcode-container {
              border: none;
              page-break-inside: avoid;
            }
            .print-controls {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls" style="margin-bottom: 20px;">
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
          <label>
            Copies:
            <select id="copies" onchange="updateCopies()">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="12">12</option>
              <option value="16">16</option>
            </select>
          </label>
        </div>
        <div id="barcodes-container"></div>
        <script>
          function updateCopies() {
            const count = parseInt(document.getElementById('copies').value);
            const container = document.getElementById('barcodes-container');
            container.innerHTML = '';
            
            for (let i = 0; i < count; i++) {
              const barcodeDiv = document.createElement('div');
              barcodeDiv.className = 'barcode-container';
              barcodeDiv.innerHTML = \`
                <div class="product-name">${product.name}</div>
                <img src="${barcodeImg}" alt="Barcode for ${product.barcode}">
                <div class="product-price">$${product.price.toFixed(2)}</div>
              \`;
              container.appendChild(barcodeDiv);
            }
          }
          
          // Initialize with 1 copy
          updateCopies();
        </script>
      </body>
      </html>
    `)
  
    printWindow.document.close()
  }
  