# Media Mosaic Generator

A web app that allows users to upload media files (images, videos, audio), generate a beautiful mosaic layout, and send it via email.

## Features

- Upload multiple media files (images, videos, audio)
- Generate a responsive HTML5 mosaic
- Send the mosaic via a draft email using `mailto:` link

## Setup

1. Clone or download this repository.
2. Open `index.html` in a web browser to run the app locally.
3. The email functionality uses `mailto:` to open a draft in your default email client—no external setup required.

## Deployment

This app can be hosted on GitHub Pages, Vercel, or any static site host.

### GitHub Pages

1. Push this repository to GitHub.
2. Go to Settings > Pages and set the source to the main branch.

### Vercel

1. Connect your GitHub repo to Vercel.
2. Deploy.

## Technologies Used

- HTML5
- CSS3
- JavaScript

## Notes

- Media files are processed client-side, so large files may impact performance.
- The `mailto:` link opens a draft in your email client; if no client is set up, it may not work.
- For complex mosaics, the HTML body might be truncated in some email clients.