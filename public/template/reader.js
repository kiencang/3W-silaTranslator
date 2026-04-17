document.addEventListener('DOMContentLoaded', function () {
    function getCssVariableValue(variableName) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
        const numericValue = parseFloat(value);
        return numericValue == value ? numericValue : value;
    }
    function setCssVariable(variableName, value) {
        document.documentElement.style.setProperty(variableName, value);
    }
    function throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    const root = document.documentElement;
    const articleElement = document.querySelector('article');
    const articleBody = document.querySelector('article[itemprop="articleBody"]');

    const decreaseFontBtn = document.getElementById('decrease-font');
    const increaseFontBtn = document.getElementById('increase-font');
    const decreaseWidthBtn = document.getElementById('decrease-width');
    const increaseWidthBtn = document.getElementById('increase-width');
    const decreaseLineHeightBtn = document.getElementById('decrease-line-height');
    const increaseLineHeightBtn = document.getElementById('increase-line-height');
    const fontSelect = document.getElementById('font-select');
    const resetBtn = document.getElementById('reset-settings');
    const metadataSection = document.getElementById('metadata-section-sila-trans');
    // removed toggleMetadataBtn

    const toggleLightModeBtn = document.getElementById('toggle-light-mode');
    const toggleDarkModeBtn = document.getElementById('toggle-dark-mode');
    const toggleSepiaModeBtn = document.getElementById('toggle-sepia-mode');
    const toggleHighContrastModeBtn = document.getElementById('toggle-high-contrast-mode');

    const progressBar = document.getElementById('progress-bar');
    const readingTimeValueSpan = document.getElementById('reading-time-value');
    const WORDS_PER_MINUTE = 220;

    const fontSizeKey = 'userFontSize';
    const contentWidthKey = 'userContentWidth';
    const fontFamilyKey = 'userFontFamily';
    const lineHeightKey = 'userLineHeight';
    const themeKey = 'userReadingTheme';

    const defaultSettings = {
        fontSize: getCssVariableValue('--base-font-size'),
        maxWidth: getCssVariableValue('--content-max-width'),
        fontFamily: getCssVariableValue('--base-font-family').replace(/['"]+/g, ''),
        lineHeight: getCssVariableValue('--base-line-height').toString(),
        theme: 'light'
    };

    const limits = {
        fontStep: 1, widthStep: 40, lineHeightStep: 0.1,
        minFontSize: getCssVariableValue('--min-font-size'), maxFontSize: getCssVariableValue('--max-font-size'),
        minWidth: getCssVariableValue('--min-width'), maxWidth: getCssVariableValue('--max-width'),
        minLineHeight: getCssVariableValue('--min-line-height'), maxLineHeight: getCssVariableValue('--max-line-height')
    };

    function updateThemeButtonStates(activeTheme) {
        const buttons = [
            {btn: toggleLightModeBtn, theme: 'light'},
            {btn: toggleDarkModeBtn, theme: 'dark'},
            {btn: toggleSepiaModeBtn, theme: 'sepia'},
            {btn: toggleHighContrastModeBtn, theme: 'high-contrast'}
        ];
        buttons.forEach(item => {
            if (item.btn) {
                const isPressed = item.theme === activeTheme;
                item.btn.setAttribute('aria-pressed', isPressed.toString());
            }
        });
    }

    function applyTheme(theme) {
        const validThemes = ['light', 'dark', 'sepia', 'high-contrast'];
        if (!validThemes.includes(theme)) {
            theme = 'light';
        }
        root.classList.remove('dark-mode', 'sepia-mode', 'high-contrast-mode');
        if (theme === 'dark') { root.classList.add('dark-mode'); } 
        else if (theme === 'sepia') { root.classList.add('sepia-mode'); } 
        else if (theme === 'high-contrast') { root.classList.add('high-contrast-mode'); }
        updateThemeButtonStates(theme);
        localStorage.setItem(themeKey, theme);
    }

    function loadPreferences() {
        setCssVariable('--base-font-size', localStorage.getItem(fontSizeKey) || defaultSettings.fontSize);
        setCssVariable('--content-max-width', localStorage.getItem(contentWidthKey) || defaultSettings.maxWidth);
        const savedFont = localStorage.getItem(fontFamilyKey) || defaultSettings.fontFamily;
        setCssVariable('--base-font-family', savedFont);
        if (fontSelect) fontSelect.value = savedFont;
        setCssVariable('--base-line-height', localStorage.getItem(lineHeightKey) || defaultSettings.lineHeight);

        const savedTheme = localStorage.getItem(themeKey) || defaultSettings.theme;
        applyTheme(savedTheme);
    }

    if (increaseFontBtn) increaseFontBtn.addEventListener('click', () => {
        let currentSize = parseFloat(getCssVariableValue('--base-font-size'));
        let newSize = Math.min(currentSize + limits.fontStep, parseFloat(limits.maxFontSize));
        const newSizeValue = newSize + 'px';
        setCssVariable('--base-font-size', newSizeValue);
        localStorage.setItem(fontSizeKey, newSizeValue);
    });
    if (decreaseFontBtn) decreaseFontBtn.addEventListener('click', () => {
        let currentSize = parseFloat(getCssVariableValue('--base-font-size'));
        let newSize = Math.max(currentSize - limits.fontStep, parseFloat(limits.minFontSize));
        const newSizeValue = newSize + 'px';
        setCssVariable('--base-font-size', newSizeValue);
        localStorage.setItem(fontSizeKey, newSizeValue);
    });
    if (increaseWidthBtn) increaseWidthBtn.addEventListener('click', () => {
        let currentWidth = parseFloat(getCssVariableValue('--content-max-width'));
        let newWidth = Math.min(currentWidth + limits.widthStep, parseFloat(limits.maxWidth));
        const newWidthValue = newWidth + 'px';
        setCssVariable('--content-max-width', newWidthValue);
        localStorage.setItem(contentWidthKey, newWidthValue);
    });
    if (decreaseWidthBtn) decreaseWidthBtn.addEventListener('click', () => {
        let currentWidth = parseFloat(getCssVariableValue('--content-max-width'));
        let newWidth = Math.max(currentWidth - limits.widthStep, parseFloat(limits.minWidth));
        const newWidthValue = newWidth + 'px';
        setCssVariable('--content-max-width', newWidthValue);
        localStorage.setItem(contentWidthKey, newWidthValue);
    });
    if (increaseLineHeightBtn) increaseLineHeightBtn.addEventListener('click', () => {
        let currentHeight = parseFloat(getCssVariableValue('--base-line-height'));
        let newHeight = Math.min(currentHeight + limits.lineHeightStep, limits.maxLineHeight);
        const newHeightValue = newHeight.toFixed(2);
        setCssVariable('--base-line-height', newHeightValue);
        localStorage.setItem(lineHeightKey, newHeightValue);
    });
    if (decreaseLineHeightBtn) decreaseLineHeightBtn.addEventListener('click', () => {
        let currentHeight = parseFloat(getCssVariableValue('--base-line-height'));
        let newHeight = Math.max(currentHeight - limits.lineHeightStep, limits.minLineHeight);
        const newHeightValue = newHeight.toFixed(2);
        setCssVariable('--base-line-height', newHeightValue);
        localStorage.setItem(lineHeightKey, newHeightValue);
    });
    if (fontSelect) {
        fontSelect.addEventListener('change', (event) => {
            const selectedFont = event.target.value;
            setCssVariable('--base-font-family', selectedFont);
            localStorage.setItem(fontFamilyKey, selectedFont);
        });
    }

    if (toggleLightModeBtn) toggleLightModeBtn.addEventListener('click', () => applyTheme('light'));
    if (toggleDarkModeBtn) toggleDarkModeBtn.addEventListener('click', () => applyTheme('dark'));
    if (toggleSepiaModeBtn) toggleSepiaModeBtn.addEventListener('click', () => applyTheme('sepia'));
    if (toggleHighContrastModeBtn) toggleHighContrastModeBtn.addEventListener('click', () => applyTheme('high-contrast'));

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            setCssVariable('--base-font-size', defaultSettings.fontSize);
            setCssVariable('--content-max-width', defaultSettings.maxWidth);
            setCssVariable('--base-font-family', defaultSettings.fontFamily);
            setCssVariable('--base-line-height', defaultSettings.lineHeight);
            if (fontSelect) fontSelect.value = defaultSettings.fontFamily;
            applyTheme(defaultSettings.theme);
            localStorage.removeItem(fontSizeKey);
            localStorage.removeItem(contentWidthKey);
            localStorage.removeItem(fontFamilyKey);
            localStorage.removeItem(lineHeightKey);
            localStorage.removeItem(themeKey);
        });
    }

    function updateProgressBar() {
        if (!progressBar) return;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;
        const scrollableHeight = docHeight - clientHeight;
        if (scrollableHeight <= 0) {
            progressBar.style.width = '100%';
            return;
        }
        const scrollPercent = (scrollTop / scrollableHeight) * 100;
        progressBar.style.width = Math.min(scrollPercent, 100) + '%';
    }
    window.addEventListener('scroll', throttle(updateProgressBar, 100));

    function calculateReadingTime() {
        if (!articleBody || !readingTimeValueSpan) return;
        const text = articleBody.innerText || articleBody.textContent || "";
        const wordMatch = text.match(/\b\w+\b/g);
        const wordCount = wordMatch ? wordMatch.length : 0;
        if (wordCount === 0) {
            readingTimeValueSpan.textContent = "0 phút";
            return;
        }
        const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
        readingTimeValueSpan.textContent = `${minutes} phút`;
    }

    function initializeTableOfContents() {
        if (!articleElement) return;
        const headings = articleElement.querySelectorAll('h2, h3');
        const tocThreshold = 3;
        if (headings.length < tocThreshold) return;

        const tocContainer = document.createElement('div');
        tocContainer.id = 'toc-container';
        tocContainer.setAttribute('aria-label', 'Mục lục bài viết');

        const tocToggleButton = document.createElement('button');
        tocToggleButton.id = 'toc-toggle-button';
        tocToggleButton.textContent = '+';
        tocToggleButton.title = 'Mở/Đóng Mục lục';
        tocToggleButton.setAttribute('aria-expanded', 'false');
        tocToggleButton.setAttribute('aria-controls', 'toc-list');

        const tocTitle = document.createElement('div');
        tocTitle.id = 'toc-title';
        tocTitle.textContent = 'Mục lục';
        tocTitle.setAttribute('aria-hidden', 'true');

        const tocList = document.createElement('ul');
        tocList.id = 'toc-list';
        tocList.setAttribute('role', 'navigation');

        let headingCounter = 0;
        headings.forEach(heading => {
            headingCounter++;
            const level = heading.tagName.toLowerCase();
            const text = heading.textContent.trim();
            if (!text) return;
            let id = heading.id;
            if (!id) {
                id = `toc-heading-${headingCounter}-${text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}`;
                id = id.substring(0, 50);
                heading.id = id;
            }

            const listItem = document.createElement('li');
            listItem.classList.add(`toc-level-${level.charAt(1)}`);

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = text;
            link.title = `Đi đến: ${text}`;

            link.addEventListener('click', function (event) {
                event.preventDefault();
                const targetElement = document.getElementById(id);
                if (targetElement) {
                    targetElement.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            });

            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        if (tocList.children.length > 0) {
            tocContainer.appendChild(tocToggleButton);
            tocContainer.appendChild(tocTitle);
            tocContainer.appendChild(tocList);
            document.body.appendChild(tocContainer);

            tocToggleButton.addEventListener('click', () => {
                const isExpanded = tocContainer.classList.toggle('toc-expanded');
                tocToggleButton.setAttribute('aria-expanded', isExpanded);
                tocToggleButton.textContent = isExpanded ? '−' : '+';
                tocTitle.setAttribute('aria-hidden', !isExpanded);
            });
        }
    }

    loadPreferences();
    if (readingTimeValueSpan) calculateReadingTime();
    initializeTableOfContents();
    updateProgressBar();
});
