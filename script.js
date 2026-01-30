document.addEventListener("DOMContentLoaded", function () {
  console.log("Script loaded successfully");

  const fileInput = document.getElementById("file-input");
  const mosaicPreview = document.getElementById("mosaic-preview");
  const sendBtn = document.getElementById("send-btn");

  let uploadedFiles = [];
  let fileOrders = [];

  fileInput.addEventListener("change", function (event) {
    uploadedFiles = Array.from(event.target.files);
    fileOrders = uploadedFiles.map((_, index) => index + 1);
    console.log("Files uploaded:", uploadedFiles.length);
    displayOrderControls();
  });

  sendBtn.addEventListener("click", function () {
    if (uploadedFiles.length === 0) {
      alert("Please upload and order images first.");
      return;
    }

    const uniqueOrders = new Set(fileOrders);
    if (uniqueOrders.size !== fileOrders.length) {
      alert("Order values must be unique. Please adjust.");
      return;
    }

    const sortedFiles = uploadedFiles.slice().sort((a, b) => {
      const indexA = uploadedFiles.indexOf(a);
      const indexB = uploadedFiles.indexOf(b);
      const orderA = fileOrders[indexA];
      const orderB = fileOrders[indexB];
      if (orderA !== orderB) return orderA - orderB;
      return indexA - indexB;
    });

    console.log(
      "Final sorted files for email:",
      sortedFiles.map((f) => f.name),
    );

    sendBtn.disabled = true;
    sendBtn.textContent = "Preparing...";

    generateEmailMosaicHTML(sortedFiles)
      .then((emailHTML) => {
        fallbackToCopyTab(emailHTML);
        sendBtn.disabled = false;
        sendBtn.textContent = "Send via Email";
      })
      .catch((error) => {
        console.error("Error generating email HTML:", error);
        alert("Error preparing email. Please try again.");
        sendBtn.disabled = false;
        sendBtn.textContent = "Send via Email";
      });
  });

  function displayOrderControls() {
    console.log("Current fileOrders:", fileOrders);
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const sortedFiles = uploadedFiles.slice().sort((a, b) => {
      const indexA = uploadedFiles.indexOf(a);
      const indexB = uploadedFiles.indexOf(b);
      const orderA = fileOrders[indexA];
      const orderB = fileOrders[indexB];
      if (orderA !== orderB) return orderA - orderB;
      return indexA - indexB;
    });

    let html = `<h3 style='margin-bottom: 10px;'>${!isTouchDevice ? "Tap Two Images to Swap Order:" : "Drag to Reorder Your Images:"}</h3><div class='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-2xl' id='sortable-grid'>`;
    sortedFiles.forEach((file) => {
      const originalIndex = uploadedFiles.indexOf(file);
      const imgSrc = URL.createObjectURL(file);
      if (!isTouchDevice) {
        html += `
          <div class="flex flex-col items-center p-2 bg-white rounded shadow cursor-pointer" data-index="${originalIndex}" style="transition: background-color 0.2s;">
            <img src="${imgSrc}" class="w-full max-h-32 object-contain rounded-lg mb-2 aspect-square" style="border-radius: 8px;">
          </div>
        `;
      } else {
        html += `
          <div class="flex flex-col items-center p-2 bg-white rounded shadow cursor-move" draggable="true" data-index="${originalIndex}">
            <img src="${imgSrc}" class="w-full max-h-32 object-contain rounded-lg mb-2 aspect-square" style="border-radius: 8px;">
          </div>
        `;
      }
    });
    html += "</div>";
    mosaicPreview.innerHTML = html;

    if (!isTouchDevice) {
      let firstSelected = null;
      const items = mosaicPreview.querySelectorAll("[data-index]");
      items.forEach((item) => {
        item.addEventListener("click", () => {
          const index = parseInt(item.getAttribute("data-index"));
          if (firstSelected === null) {
            firstSelected = index;
            item.style.backgroundColor = "#e0f7fa";
          } else if (firstSelected === index) {
            firstSelected = null;
            item.style.backgroundColor = "";
          } else {
            const temp = fileOrders[firstSelected];
            fileOrders[firstSelected] = fileOrders[index];
            fileOrders[index] = temp;
            console.log("Swapped orders:", fileOrders);
            firstSelected = null;
            displayOrderControls();
          }
        });
      });
    } else {
      const grid = document.getElementById("sortable-grid");
      let draggedIndex = null;

      grid.addEventListener("dragstart", (e) => {
        draggedIndex = parseInt(
          e.target.closest("[data-index]").getAttribute("data-index"),
        );
        e.dataTransfer.effectAllowed = "move";
      });

      grid.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      grid.addEventListener("drop", (e) => {
        e.preventDefault();
        const target = e.target.closest("[data-index]");
        if (target) {
          const targetIndex = parseInt(target.getAttribute("data-index"));
          if (draggedIndex !== null && draggedIndex !== targetIndex) {
            const temp = fileOrders[draggedIndex];
            fileOrders[draggedIndex] = fileOrders[targetIndex];
            fileOrders[targetIndex] = temp;
            console.log("Swapped orders:", fileOrders);
            displayOrderControls();
          }
        }
      });
    }
  }

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
    console.log("Generating preview mosaic for", files.length, "files");
    console.log(
      "Files in order:",
      files.map((f) => f.name),
    );

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
    console.log(
      "Email files in order:",
      files.map((f) => f.name),
    );

    return new Promise((resolve, reject) => {
      const promises = files.map((file) => {
        return new Promise((res) => {
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
                    dataUrl = e.target.result;
                  } else {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const maxSize = 400;
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

                  res(
                    `<div class="mosaic-item"><img src="${dataUrl}" alt="${file.name}" style="border-radius: 8px;"></div>`,
                  );
                } catch (err) {
                  console.error(`Error processing image:`, err);
                  res(
                    `<div class="mosaic-item" style="color: #666;">Error loading ${file.name}</div>`,
                  );
                }
              };
              img.src = e.target.result;
            };
            reader.onerror = () => {
              res(
                `<div class="mosaic-item" style="color: #666;">Error reading ${file.name}</div>`,
              );
            };
            reader.readAsDataURL(file);
          } else {
            res(
              `<div class="mosaic-item" style="color: #666;">${file.name}</div>`,
            );
          }
        });
      });

      Promise.all(promises)
        .then((items) => {
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
              .mosaic-item img { display: block; margin: 0 auto; width: 100%; max-width: 400px; height: auto; max-height: 400px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
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
                  ${items.join("")}
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
        })
        .catch(reject);
    });
  }
});
