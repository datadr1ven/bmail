document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded successfully"); // Debug: Check if script runs

  const fileInput = document.getElementById("file-input");
  const generateBtn = document.getElementById("generate-btn");
  const mosaicPreview = document.getElementById("mosaic-preview");
  const sendBtn = document.getElementById("send-btn");

  if (!generateBtn) {
    console.error("Generate button not found!");
    return;
  }

  let uploadedFiles = [];

  fileInput.addEventListener("change", function (event) {
    uploadedFiles = Array.from(event.target.files);
    console.log("Files uploaded:", uploadedFiles.length);
  });

  generateBtn.addEventListener("click", function () {
    console.log("Generate button clicked"); // Debug: Check if event fires

    if (uploadedFiles.length === 0) {
      alert("Please upload at least one media file.");
      return;
    }

    mosaicPreview.innerHTML = "";

    try {
      // Generate mosaic
      const mosaicHTML = generateMosaicHTML(uploadedFiles);
      mosaicPreview.innerHTML = mosaicHTML;
      console.log("Mosaic generated successfully"); // Debug: Confirm generation
    } catch (error) {
      console.error("Error generating mosaic:", error);
      alert("Error generating mosaic. Check console for details.");
    }
  });

  sendBtn.addEventListener("click", function () {
    if (uploadedFiles.length === 0) {
      alert("Please generate a mosaic first.");
      return;
    }

    // Disable button and show loading
    sendBtn.disabled = true;
    sendBtn.textContent = "Preparing...";

    // Generate email-compatible HTML with base64 data URIs
    generateEmailMosaicHTML(uploadedFiles)
      .then((emailHTML) => {
        // Always open the copy tab for simplicity
        fallbackToCopyTab(emailHTML);

        // Re-enable button
        sendBtn.disabled = false;
        sendBtn.textContent = "Send via Email";
      })
      .catch((error) => {
        console.error("Error generating email HTML:", error);
        alert("Error preparing email. Please try again.");

        // Re-enable button on error
        sendBtn.disabled = false;
        sendBtn.textContent = "Send via Email";
      });
  });

  function fallbackToCopyTab(emailHTML) {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Your Media Mosaic - Copy to Email</title>
          <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
        </head>
        <body>
          <h2>Copy this mosaic into your email:</h2>
          <p>Select all (Ctrl+A) and copy (Ctrl+C), then paste into your email composer.</p>
          <div id="content">${emailHTML}</div>
        </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      alert("Popup blocked. Please allow popups.");
    }
  }

  function generateMosaicHTML(files) {
    console.log("Generating preview mosaic for", files.length, "files"); // Debug

    // Artist-grade mobile-optimized mosaic with Tailwind, more prominent background and spacing
    let html = `
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-2xl">
    `;

    files.forEach((file) => {
      const fileType = file.type.split("/")[0];
      let element;

      if (fileType === "image") {
        element = `<img src="${URL.createObjectURL(file)}" class="w-full max-h-32 object-contain rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 aspect-square" alt="${file.name}">`;
      } else if (fileType === "video") {
        element = `<video controls class="w-full max-h-32 object-contain rounded-lg shadow-lg aspect-square"><source src="${URL.createObjectURL(file)}" type="${file.type}"></video>`;
      } else if (fileType === "audio") {
        element = `<audio controls class="w-full mt-2"><source src="${URL.createObjectURL(file)}" type="${file.type}"></audio>`;
      }

      if (element) {
        html += `<div class="flex justify-center">${element}</div>`;
      }
    });

    html += "</div>";
    return html;
  }

  function generateEmailMosaicHTML(files) {
    console.log("Generating email mosaic for", files.length, "files");

    return new Promise((resolve, reject) => {
      // Email-compatible responsive structure
      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Return to Sender</title>
          <style>
            .mosaic { font-size: 0; text-align: center; }
            .mosaic-item { display: block; width: 100%; padding: 10px; text-align: center; box-sizing: border-box; }
            .mosaic-item img { display: block; margin: 0 auto; width: auto; max-width: 400px; height: 250px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          </style>
          <!--[if mso]>
          <style>
            .mosaic-item { width: 100% !important; }
          </style>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #ffffff; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Return to Sender</h1>
            </div>
            <div style="background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
              <div class="mosaic">
      `;

      let processed = 0;
      const total = files.length;

      if (total === 0) {
        html += "</div></div></div></body></html>";
        resolve(html);
        return;
      }

      files.forEach((file) => {
        const fileType = file.type.split("/")[0];
        if (fileType === "image") {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
              try {
                const isGif = file.type === "image/gif";
                let dataUrl;

                if (isGif) {
                  // Preserve animation for GIFs
                  dataUrl = e.target.result;
                } else {
                  // Resize and compress for other images
                  const canvas = document.createElement("canvas");
                  const ctx = canvas.getContext("2d");
                  const maxSize = 200;
                  let { width, height } = img;

                  if (width > height) {
                    if (width > maxSize) {
                      height = (height * maxSize) / width;
                      width = maxSize;
                    }
                  } else {
                    if (height > maxSize) {
                      width = (width * maxSize) / height;
                      height = maxSize;
                    }
                  }

                  canvas.width = width;
                  canvas.height = height;
                  ctx.drawImage(img, 0, 0, width, height);
                  dataUrl = canvas.toDataURL(file.type, 0.8);
                }

                html += `<div class="mosaic-item"><img src="${dataUrl}" alt="${file.name}"></div>`;

                processed++;
                if (processed === total) {
                  html += `
                    </div>
                  </div>
                  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                    <p>Generated with love. <a href="#" style="color: #667eea; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #667eea; text-decoration: none;">Terms</a></p>
                  </div>
                </div>
              </body>
            </html>
                  `;
                  resolve(html);
                }
              } catch (err) {
                console.error(`Error processing image:`, err);
                html += `<div class="mosaic-item" style="color: #666;">Error loading ${file.name}</div>`;
                processed++;
                if (processed === total) {
                  html += "</div></div></div></body></html>";
                  resolve(html);
                }
              }
            };
            img.src = e.target.result;
          };
          reader.onerror = () => {
            html += `<div class="mosaic-item" style="color: #666;">Error reading ${file.name}</div>`;
            processed++;
            if (processed === total) {
              html += "</div></div></div></body></html>";
              resolve(html);
            }
          };
          reader.readAsDataURL(file);
        } else {
          html += `<div class="mosaic-item" style="color: #666;">${file.name}</div>`;
          processed++;
          if (processed === total) {
            html += "</div></div></div></body></html>";
            resolve(html);
          }
        }
      });
    });
  }
});
