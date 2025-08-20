// app7.js
// Markdown search bar (only for markdown, searches all markdown files)
(function() {
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

    function injectMdMenu(filesDropdown) {
        if (!filesDropdown || filesDropdown.querySelector('.files-md-main')) return;
        var mdMain = document.createElement('div');
        mdMain.className = 'files-dropdown-item files-md-main';
        mdMain.textContent = 'MD';
        mdMain.style.fontWeight = 'bold';
        mdMain.tabIndex = 0;
        mdMain.style.cursor = 'pointer';
        mdMain.style.position = 'relative';

        var mdSubmenu = document.createElement('div');
        mdSubmenu.style.display = 'none';
        mdSubmenu.style.position = 'absolute';
        mdSubmenu.style.left = '100%';
        mdSubmenu.style.top = '0';
        mdSubmenu.style.background = '#fff';
        mdSubmenu.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
        mdSubmenu.style.borderRadius = '8px';
        mdSubmenu.style.minWidth = '120px';
        mdSubmenu.style.zIndex = '1002';

        var md1 = document.createElement('button');
        md1.className = 'files-dropdown-item';
        md1.textContent = 'md1';
        md1.type = 'button';
        md1.onclick = function(e) {
            e.stopPropagation();
            showMarkdown('md1');
            mdSubmenu.style.display = 'none';
        };
        var md2 = document.createElement('button');
        md2.className = 'files-dropdown-item';
        md2.textContent = 'md2';
        md2.type = 'button';
        md2.onclick = function(e) {
            e.stopPropagation();
            showMarkdown('md2');
            mdSubmenu.style.display = 'none';
        };
        mdSubmenu.appendChild(md1);
        mdSubmenu.appendChild(md2);
        mdMain.appendChild(mdSubmenu);

        mdMain.addEventListener('mouseenter', function() {
            mdSubmenu.style.display = 'block';
        });
        mdMain.addEventListener('mouseleave', function() {
            mdSubmenu.style.display = 'none';
        });
        mdMain.addEventListener('click', function(e) {
            e.stopPropagation();
            mdSubmenu.style.display = (mdSubmenu.style.display === 'block') ? 'none' : 'block';
        });
        filesDropdown.appendChild(mdMain);
    }

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

    // Only search markdown files
    function addMarkdownSearch(container, currentMdKey) {
        var searchBox = document.createElement('div');
        searchBox.className = 'md-html-search-bar';
        searchBox.style.display = 'flex';
        searchBox.style.alignItems = 'center';
        searchBox.style.gap = '8px';
        searchBox.style.marginBottom = '12px';
        searchBox.innerHTML = '<input type="text" placeholder="Search in all markdown..." class="md-search-input" style="width:40%;min-width:120px;max-width:100%;padding:8px 12px;border-radius:6px;border:1px solid #ccc;font-size:15px;">' +
            '<button class="md-search-prev" style="padding:6px 10px;">&#8593;</button>' +
            '<button class="md-search-next" style="padding:6px 10px;">&#8595;</button>' +
            '<span class="md-search-count" style="min-width:120px;text-align:center;font-size:14px;color:#555;"></span>';
        container.prepend(searchBox);
        var input = searchBox.querySelector('.md-search-input');
        var prevBtn = searchBox.querySelector('.md-search-prev');
        var nextBtn = searchBox.querySelector('.md-search-next');
        var countSpan = searchBox.querySelector('.md-search-count');
        var mdContent = container.querySelector('.markdown-content');
        var mdFiles = [
            {key: 'md1', label: 'md1', content: window.markdown1Content},
            {key: 'md2', label: 'md2', content: window.markdown2Content}
        ];
        var allMatches = [];
        var currentGlobalIdx = 0;

        function updateHighlights(jumpToIdx) {
            var q = input.value.trim();
            allMatches = [];
            var counts = [];
            mdFiles.forEach(function(md, i) {
                var html = simpleMarkdownToHtml(md.content);
                var {html: highlighted, count} = highlightMatches(html, q);
                counts.push(count);
                md.html = highlighted;
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
            mdContent.innerHTML = mdFiles[showFileIdx].html;
            var highlights = mdContent.querySelectorAll('.md-search-highlight');
            var localIdx = 0;
            if (allMatches.length > 0 && allMatches[currentGlobalIdx].fileIdx === showFileIdx) {
                localIdx = allMatches[currentGlobalIdx].matchIdx;
                if (highlights[localIdx]) {
                    highlights[localIdx].classList.add('md-search-current');
                    highlights[localIdx].scrollIntoView({block:'center',behavior:'smooth'});
                }
            }
            var countText = counts.map((c, i) => c > 0 ? c + ' in ' + mdFiles[i].label : '').filter(Boolean).join(', ');
            if (allMatches.length > 0) {
                countSpan.textContent = (currentGlobalIdx+1) + ' / ' + allMatches.length + (countText ? ' ('+countText+')' : '');
            } else {
                countSpan.textContent = '0 / 0';
            }
            var title = container.querySelector('.data-section-title');
            if (title) title.textContent = 'Markdown: ' + mdFiles[showFileIdx].label;
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

    function showMarkdown(mdKey) {
        var root = document.getElementById('root');
        if (!root) return;
        var mdFiles = {
            md1: window.markdown1Content,
            md2: window.markdown2Content
        };
        var label = mdKey;
        var md = mdFiles[mdKey] || '';
        root.innerHTML = '<div class="data-section"><div class="data-section-header"><span class="data-section-title">Markdown: ' + label + '</span></div>' +
            '<div class="markdown-content"></div></div>';
        var container = root.querySelector('.data-section');
        var mdContent = container.querySelector('.markdown-content');
        mdContent.innerHTML = simpleMarkdownToHtml(md);
        addMarkdownSearch(container, mdKey);
    }

    function tryInjectMdMenu() {
        var filesDropdown = document.querySelector('.files-dropdown-content');
        if (filesDropdown) injectMdMenu(filesDropdown);
    }

    if (document.readyState !== 'loading') tryInjectMdMenu();
    else document.addEventListener('DOMContentLoaded', tryInjectMdMenu);

    var observer = new MutationObserver(function() {
        tryInjectMdMenu();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Add styles for highlight and responsive search bar
    var style = document.createElement('style');
    style.textContent = '.md-search-highlight { background: #fff3cd; color: #d35400; border-radius: 3px; padding: 1px 2px; } .md-search-current { background: #ff6b6b !important; color: #fff !important; } .md-html-search-bar .md-search-input { width: 40%; min-width: 120px; max-width: 100%; } @media (max-width: 600px) { .md-html-search-bar .md-search-input { width: 90%; min-width: 60px; } }';
    document.head.appendChild(style);

    // Expose for app8.js
    window.markdownSearchBar = addMarkdownSearch;
})();
