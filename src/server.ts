import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response } from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '50mb' }));

app.post('/api/fetch-html', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      res.status(400).json({ error: `Failed to fetch URL: ${response.statusText}` });
      return;
    }
    
    const rawHtml = await response.text();
    res.json({ rawHtml });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi trong quá trình lấy nội dung gốc';
    console.error('Lỗi fetch:', error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Phục vụ các file tĩnh từ thư mục /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
  }),
);

/**
 * Xử lý tất cả các request khác bằng cách render ứng dụng Angular.
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
 * Khởi động máy chủ nếu module này là điểm đầu vào chính, hoặc được chạy thông qua PM2.
 * Máy chủ sẽ lắng nghe trên cổng được định nghĩa bởi biến môi trường `PORT`, hoặc mặc định là 3000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Máy chủ Node Express đang lắng nghe tại http://localhost:${port}`);
  });
}

/**
 * Trình xử lý request được sử dụng bởi Angular CLI (cho dev-server và trong quá trình build) hoặc Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
