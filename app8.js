// app8.js
// HTML search bar (for HTML, searches all HTML and markdown files)
(function() {
    function highlightMatches(html, query) {
        if (!query) return {html, count: 0};
        var safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re = new RegExp(safe, 'gi');
        var idx = 0;
        var count = 0;
        var newHtml = html.replace(re, function(match) {
            count++;
            return '<span class="md-search-highlight" data-md-idx="' + (idx++) + '">' + match + '</span>';
        });
        return {html: newHtml, count};
    }

    function simpleMarkdownToHtml(md) {
        if (!md) return '';
        return md
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\n---\n/g, '<hr>')
            .replace(/\n/g, '<br>');
    }

    // Search bar for HTML, searches all HTML and markdown files
    function addHtmlSearch(container, currentHtmlKey) {
        var searchBox = document.createElement('div');
        searchBox.className = 'md-html-search-bar';
        searchBox.style.display = 'flex';
        searchBox.style.alignItems = 'center';
        searchBox.style.gap = '8px';
        searchBox.style.marginBottom = '12px';
        searchBox.innerHTML = '<input type="text" placeholder="Search in all HTML and markdown..." class="md-search-input" style="width:40%;min-width:120px;max-width:100%;padding:8px 12px;border-radius:6px;border:1px solid #ccc;font-size:15px;">' +
            '<button class="md-search-prev" style="padding:6px 10px;">&#8593;</button>' +
            '<button class="md-search-next" style="padding:6px 10px;">&#8595;</button>' +
            '<span class="md-search-count" style="min-width:120px;text-align:center;font-size:14px;color:#555;"></span>';
        container.prepend(searchBox);
        var input = searchBox.querySelector('.md-search-input');
        var prevBtn = searchBox.querySelector('.md-search-prev');
        var nextBtn = searchBox.querySelector('.md-search-next');
        var countSpan = searchBox.querySelector('.md-search-count');
        var htmlContent = container.querySelector('.html-content');
        var files = [];
        if (window.html1Content) files.push({key: 'html1', label: 'html1', type: 'html', content: window.html1Content});
        if (window.html2Content) files.push({key: 'html2', label: 'html2', type: 'html', content: window.html2Content});
        if (window.html3Content) files.push({key: 'html3', label: 'html3', type: 'html', content: window.html3Content});
        if (window.markdown1Content) files.push({key: 'md1', label: 'md1', type: 'markdown', content: window.markdown1Content});
        if (window.markdown2Content) files.push({key: 'md2', label: 'md2', type: 'markdown', content: window.markdown2Content});
        var allMatches = [];
        var currentGlobalIdx = 0;

        function updateHighlights(jumpToIdx) {
            var q = input.value.trim();
            allMatches = [];
            var counts = [];
            files.forEach(function(f, i) {
                var html = f.type === 'markdown' ? simpleMarkdownToHtml(f.content) : f.content;
                var {html: highlighted, count} = highlightMatches(html, q);
                counts.push(count);
                f.html = highlighted;
                for (var j = 0; j < count; ++j) {
                    allMatches.push({fileIdx: i, matchIdx: j});
                }
            });
            var showFileIdx = 0;
            if (allMatches.length > 0) {
                if (jumpToIdx !== undefined) {
                    currentGlobalIdx = jumpToIdx;
                } else if (currentGlobalIdx >= allMatches.length) {
                    currentGlobalIdx = 0;
                } else if (currentGlobalIdx < 0) {
                    currentGlobalIdx = allMatches.length - 1;
                }
                showFileIdx = allMatches[currentGlobalIdx]?.fileIdx || 0;
            } else {
                currentGlobalIdx = 0;
            }
            var file = files[showFileIdx];
            if (file.type === 'markdown') {
                htmlContent.className = 'markdown-content';
                htmlContent.innerHTML = simpleMarkdownToHtml(file.content);
            } else {
                htmlContent.className = 'html-content';
                htmlContent.innerHTML = file.html;
            }
            var highlights = htmlContent.querySelectorAll('.md-search-highlight');
            var localIdx = 0;
            if (allMatches.length > 0 && allMatches[currentGlobalIdx].fileIdx === showFileIdx) {
                localIdx = allMatches[currentGlobalIdx].matchIdx;
                if (highlights[localIdx]) {
                    highlights[localIdx].classList.add('md-search-current');
                    highlights[localIdx].scrollIntoView({block:'center',behavior:'smooth'});
                }
            }
            var countText = counts.map((c, i) => c > 0 ? c + ' in ' + files[i].label : '').filter(Boolean).join(', ');
            if (allMatches.length > 0) {
                countSpan.textContent = (currentGlobalIdx+1) + ' / ' + allMatches.length + (countText ? ' ('+countText+')' : '');
            } else {
                countSpan.textContent = '0 / 0';
            }
            var title = container.querySelector('.data-section-title');
            if (title) title.textContent = (file.type === 'markdown' ? 'Markdown: ' : 'HTML: ') + file.label;
        }
        input.addEventListener('input', function() {
            currentGlobalIdx = 0;
            updateHighlights();
        });
        prevBtn.addEventListener('click', function() {
            if (allMatches.length > 0) { currentGlobalIdx = (currentGlobalIdx - 1 + allMatches.length) % allMatches.length; updateHighlights(); }
        });
        nextBtn.addEventListener('click', function() {
            if (allMatches.length > 0) { currentGlobalIdx = (currentGlobalIdx + 1) % allMatches.length; updateHighlights(); }
        });
        updateHighlights();
    }

    function injectHtmlMenu(filesDropdown) {
        if (!filesDropdown || filesDropdown.querySelector('.files-html-main')) return;
        var htmlMain = document.createElement('div');
        htmlMain.className = 'files-dropdown-item files-html-main';
        htmlMain.textContent = 'HTML';
        htmlMain.style.fontWeight = 'bold';
        htmlMain.tabIndex = 0;
        htmlMain.style.cursor = 'pointer';
        htmlMain.style.position = 'relative';

        var htmlSubmenu = document.createElement('div');
        htmlSubmenu.style.display = 'none';
        htmlSubmenu.style.position = 'absolute';
        htmlSubmenu.style.left = '100%';
        htmlSubmenu.style.top = '0';
        htmlSubmenu.style.background = '#fff';
        htmlSubmenu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        htmlSubmenu.style.borderRadius = '8px';
        htmlSubmenu.style.minWidth = '120px';
        htmlSubmenu.style.zIndex = '1002';

        var html1 = document.createElement('button');
        html1.className = 'files-dropdown-item';
        html1.textContent = 'html1';
        html1.type = 'button';
        html1.onclick = function(e) {
            e.stopPropagation();
            showHtml('html1');
            htmlSubmenu.style.display = 'none';
        };
        var html2 = document.createElement('button');
        html2.className = 'files-dropdown-item';
        html2.textContent = 'html2';
        html2.type = 'button';
        html2.onclick = function(e) {
            e.stopPropagation();
            showHtml('html2');
            htmlSubmenu.style.display = 'none';
        };
        htmlSubmenu.appendChild(html1);
        htmlSubmenu.appendChild(html2);
        htmlMain.appendChild(htmlSubmenu);

        htmlMain.addEventListener('mouseenter', function() {
            htmlSubmenu.style.display = 'block';
        });
        htmlMain.addEventListener('mouseleave', function() {
            htmlSubmenu.style.display = 'none';
        });
        htmlMain.addEventListener('click', function(e) {
            e.stopPropagation();
            htmlSubmenu.style.display = (htmlSubmenu.style.display === 'block') ? 'none' : 'block';
        });
        filesDropdown.appendChild(htmlMain);
    }

    function showHtml(htmlKey) {
        var root = document.getElementById('root');
        if (!root) return;
        var modal = document.querySelector('.modal, .refresh-box, .error-message');
        if (modal) modal.style.display = 'none';
        var htmlFiles = {
            html1: window.html1Content,
            html2: window.html2Content
        };
        var label = htmlKey;
        var html = htmlFiles[htmlKey] || '';
        root.innerHTML = '<div class="data-section"><div class="data-section-header"><span class="data-section-title">HTML: ' + label + '</span></div>' +
            '<div class="html-content">' + html + '</div></div>';
        var container = root.querySelector('.data-section');
        addHtmlSearch(container, htmlKey);
    }

    function tryInjectHtmlMenu() {
        var filesDropdown = document.querySelector('.files-dropdown-content');
        if (filesDropdown) injectHtmlMenu(filesDropdown);
    }

    if (document.readyState !== 'loading') tryInjectHtmlMenu();
    else document.addEventListener('DOMContentLoaded', tryInjectHtmlMenu);

    var observer = new MutationObserver(function() {
        tryInjectHtmlMenu();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Add styles for highlight and responsive search bar
    var style = document.createElement('style');
    style.textContent = '.md-search-highlight { background: #fff3cd; color: #d35400; border-radius: 3px; padding: 1px 2px; } .md-search-current { background: #ff6b6b !important; color: #fff !important; } .md-html-search-bar .md-search-input { width: 40%; min-width: 120px; max-width: 100%; } @media (max-width: 600px) { .md-html-search-bar .md-search-input { width: 90%; min-width: 60px; } }';
    document.head.appendChild(style);
})();
