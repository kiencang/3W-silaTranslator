import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
} from '@google/genai';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: ['*']
});

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
    res.status(400).json({ error: errorMessage });
  }
});

app.post('/api/gemini/generate', async (req, res) => {
  try {
    const headerApiKey = req.headers['x-gemini-api-key'];
    const rawUserKey = Array.isArray(headerApiKey) ? headerApiKey[0] : headerApiKey;
    const apiKey = (typeof rawUserKey === 'string' && rawUserKey.trim()) ||
                   (typeof req.body?.userApiKey === 'string' && req.body.userApiKey.trim());

    if (!apiKey) {
      res.status(400).json({
        error: 'Chưa cấu hình API Key. Kính mời quý khách nhấp vào biểu tượng chiếc chìa khóa ở góc trên để cấu hình API Key cá nhân.'
      });
      return;
    }

    const { model, prompt, systemInstruction, useSearchGrounding } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Nội dung cần dịch (prompt) không được để trống.' });
      return;
    }

    const selectedModel = (typeof model === 'string' && model.trim()) ? model.trim() : 'gemini-flash-latest';

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || undefined,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        tools: useSearchGrounding ? [{ googleSearch: {} }] : undefined,
      },
    });

    const text = response.text || '';
    res.json({ text });
  } catch (error: unknown) {
    console.error('Gemini Generate Error:', error);
    let errorMessage = error instanceof Error ? error.message : 'Lỗi trong quá trình gọi Gemini API';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed?.error?.message) {
        errorMessage = parsed.error.message;
      }
    } catch {
      // Keep original errorMessage if not JSON
    }
    res.status(400).json({ error: errorMessage });
  }
});

app.all('/api/*splat', (req, res) => {
  res.status(404).json({ error: `Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}` });
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
  const port = Number(process.env['PORT']) || 3000;
  app.listen(port, '0.0.0.0', (error) => {
    if (error) {
      throw error;
    }
    console.log(`Máy chủ Node Express đang lắng nghe tại http://0.0.0.0:${port}`);
  });
}

/**
 * Trình xử lý request được sử dụng bởi Angular CLI (cho dev-server và trong quá trình build) hoặc Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
