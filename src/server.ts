import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { parseHTML } from 'linkedom';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import TurndownService from 'turndown';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '50mb' }));

app.post('/api/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // 1. Fetch the HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }
    const html = await response.text();

    // Fast-fail: Reject ridiculously large HTML payloads before DOM parsing
    if (html.length > 500000) {
      res.status(413).json({ error: 'Mã nguồn trang web này quá lớn (vượt quá 500,000 ký tự). Máy chủ từ chối phân tích để tránh rủi ro tràn bộ nhớ. Vui lòng chọn một bài viết thông thường.' });
      return;
    }

    // 2. Extract main content using Readability
    const { document } = parseHTML(html);

    // Check if the page is readerable (likely an article)
    if (!isProbablyReaderable(document)) {
      res.status(400).json({ error: 'Trang web này không có cấu trúc của một bài viết/bài báo. Vui lòng thử lại với một link nội dung cụ thể.' });
      return;
    }

    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error('Could not extract main content from the URL');
    }

    // 3. Convert to Markdown and check limit
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const markdownContent = turndownService.turndown(article.content);

    if (markdownContent.length > 100000) {
      res.status(413).json({ error: 'Bài viết này quá dài (vượt quá giới hạn 25.000 tokens quy định). Vui lòng chọn bài viết ngắn hơn để đảm bảo chất lượng bản dịch.' });
      return;
    }

    res.json({ 
      title: article.title,
      content: markdownContent,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during content extraction';
    console.error('Extraction error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
