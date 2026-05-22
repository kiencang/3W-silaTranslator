import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentUtilService {
  
  countWords(str: string): number {
    let count = 0;
    let inWord = false;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c === 32 || c === 10 || c === 13 || c === 9) {
        inWord = false;
      } else {
        if (!inWord) {
          count++;
          inWord = true;
        }
      }
    }
    return count;
  }

  processYoutubeIframes(finalHtml: string, youtubeVideos: string[] | undefined): string {
    if (!youtubeVideos || youtubeVideos.length === 0) return finalHtml;

    let processedHtml = finalHtml;
    youtubeVideos.forEach((videoHtml, i) => {
      const uniqueId = Math.random().toString(36).substring(2, 9) + i;
      let videoSrc = '';
      let videoId = '';
      const srcMatch = videoHtml.match(/src="([^"]+)"/i);
      if (srcMatch && srcMatch[1]) {
        videoSrc = srcMatch[1];
        if (videoSrc.startsWith('//')) {
          videoSrc = 'https:' + videoSrc;
          videoHtml = videoHtml.replace(srcMatch[1], videoSrc);
        }
        const idMatch = videoSrc.match(/(?:embed\/|v=|\/v\/|youtu\.be\/|\/e\/)([^"&?/\s]{11})/);
        if (idMatch && idMatch[1]) {
          videoId = idMatch[1];
        }
      }
      
      const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : (videoSrc || '#');
      const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';

      const responsiveVideoHtml = `<div id="yt-wrap-${uniqueId}" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px; margin: 24px 0px; background: #000;">
        <div id="yt-iframe-container-${uniqueId}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          ${videoHtml.replace(/<iframe /gi, '<iframe style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;" ')}
        </div>
        <div id="yt-fallback-${uniqueId}" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: url('${thumbnailUrl}'); background-size: cover; background-position: center;">
          <a href="${watchUrl}" target="_blank" style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-decoration: none; color: white; font-family: sans-serif; height: 100%; width: 100%;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3);" onmouseover="this.style.background='rgba(0,0,0,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.3)'"></div>
            <svg width="68" height="48" viewBox="0 0 68 48" style="position: relative; z-index: 2;"><path d="M66.5 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.1 34 .1 34 .1s-21.79 0-27.08 1.45C3.98 2.33 2.27 4.81 1.49 7.74.1 13.03.1 24 .1 24s0 10.97 1.39 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.9 34 47.9 34 47.9s21.79 0 27.08-1.45c2.93-.78 4.64-3.26 5.42-6.19C67.9 34.97 67.9 24 67.9 24s0-10.97-1.39-16.26z" fill="#FF0000"/><path d="M27 34l18-10-18-10v20z" fill="#FFFFFF"/></svg>
            <span style="position: relative; z-index: 2; margin-top: 12px; font-weight: 500; font-size: 15px; text-shadow: 0 1px 4px rgba(0,0,0,0.8); background: rgba(0,0,0,0.7); padding: 4px 12px; border-radius: 20px;">Xem trên YouTube</span>
          </a>
        </div>
        <script>
          (function() {
            if (window.location.protocol === 'file:') {
              var iframeContainer = document.getElementById('yt-iframe-container-${uniqueId}');
              var fallback = document.getElementById('yt-fallback-${uniqueId}');
              if (iframeContainer) iframeContainer.remove();
              if (fallback) fallback.style.display = 'flex';
            }
          })();
        </script>
      </div>`;
      
      const regexStr = `<p><code>\\[SILA_YOUTUBE_${i}\\]<\\/code><\\/p>|<code>\\[SILA_YOUTUBE_${i}\\]<\\/code>|\\[SILA_YOUTUBE_${i}\\]`;
      const regex = new RegExp(regexStr, 'gi');
      processedHtml = processedHtml.replace(regex, responsiveVideoHtml);
    });

    return processedHtml;
  }

  slugify(text: string): string {
    return text.toString().toLowerCase()
      .normalize('NFD') // Normalize to decomposed form
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/đ/g, 'd').replace(/Đ/g, 'D') // Handle Vietnamese 'đ'
      .replace(/[^a-z0-9 -]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
  }

  generateFilename(rawHtmlString: string, currentUrl: string): string {
    let filename = '';
    
    if (rawHtmlString) {
      const titleMatch = rawHtmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        filename = this.slugify(titleMatch[1].trim());
      }
    }
    
    if (!filename && currentUrl) {
      try {
        const urlObj = new URL(currentUrl.startsWith('http') ? currentUrl : 'https://' + currentUrl);
        const pathSegments = urlObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          let lastSegment = pathSegments[pathSegments.length - 1];
          lastSegment = lastSegment.replace(/\.[a-z0-9]+$/i, '');
          if (lastSegment) {
            filename = 'vi_' + this.slugify(lastSegment);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    }
    
    if (!filename) {
      filename = `ban-dich-${new Date().getTime()}`;
    }
    
    if (filename.length > 60) {
      filename = filename.substring(0, 60).replace(/-+$/, '');
    }
    
    return `${filename}.html`;
  }
}
