const omnibox = document.getElementById('omnibox');
const viewport = document.getElementById('viewport');
const homeScreen = document.getElementById('home-screen');
const urlText = document.getElementById('url-text');
const engineSelector = document.getElementById('search-engine');
const suggestBar = document.getElementById('suggest-bar');

const WIKER_DB = 'wiker_v6_db';

// ウィンドウが読み込まれたら実行


// ドラッグオーバー/ドロップはハンドラ関数を使って接続
omnibox.addEventListener('dragover', handleDragOver);
omnibox.addEventListener('drop', handleDrop);

// ドロップされた瞬間の処理
function handleDragOver(event) {
    event.preventDefault(); 
    event.dataTransfer.dropEffect = "copy";
}

function handleDrop(event) {
    event.preventDefault();
    let data = event.dataTransfer.getData("text-uri-list") || event.dataTransfer.getData("text");
    if (data) {
        omnibox.value = ""; 
        omnibox.value = data;
        navigate();
    }
}

// スペース分割検索ボタン

omnibox.addEventListener('input', () => {
    const val = omnibox.value.trim();
    const words = val.split(/[ 　]+/); 
    suggestBar.innerHTML = ''; 

    if (words.length > 1 && words[0] !== "") {
        words.forEach(word => {
            if (word) {
                const btn = document.createElement('button');
                btn.className = 'split-btn';
                btn.innerText = `「${word}」で検索`;
                btn.onclick = () => {
                    omnibox.value = word;
                    navigate();
                };
                suggestBar.appendChild(btn);
            }
        });
    }
});

// URL変換ロジック (YouTube/ニコニコ)

function autoConvert(url) {
    if (url.includes("youtube.com/watch?v=")) {
        const id = url.split("v=")[1].split("&")[0];
        const origin = encodeURIComponent(location.origin);
        return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`;
    }
    if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1].split("?")[0];
        const origin = encodeURIComponent(location.origin);
        return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`;
    }
    if (url.includes("nicovideo.jp/watch/")) {
        const id = url.split("watch/")[1].split("?")[0];
        return `https://embed.nicovideo.jp/watch/${id}`;
    }
    return url;
}

// ナビゲーション (メイン)

function navigate() {
    let input = omnibox.value.trim();
    if (!input) return;

    homeScreen.style.display = 'none';
    viewport.style.display = 'block';

    let targetUrl = "";

    // sm番号判定
    if (/^sm\d+$/.test(input)) {
        targetUrl = `https://embed.nicovideo.jp/watch/${input}`;
    } else {
        targetUrl = autoConvert(input);
        if (!targetUrl.startsWith('http')) {
            const engine = engineSelector.value;
            if (engine === 'wiki') {
                targetUrl = `https://ja.m.wikipedia.org/wiki/${encodeURIComponent(targetUrl)}`;
            } else {
                targetUrl = `https://websearch.excite.co.jp/?q=${encodeURIComponent(targetUrl)}&search-submit-btn=検索`;
            }
        }
    }

    viewport.src = targetUrl;
    urlText.innerText = targetUrl;
    suggestBar.innerHTML = ''; 

    // YouTube埋め込み向けの属性付与とフォールバックボタン
    try {
        if (targetUrl.includes('youtube-nocookie.com/embed/')) {
            // 主要な許可を追加して再生可能性を高める
            viewport.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            viewport.setAttribute('allowfullscreen', '');

            // フォールバック：埋め込み再生できない場合に元のYouTubeで開くためのボタン
            const id = targetUrl.split('/embed/')[1].split('?')[0];
            const openBtn = document.createElement('button');
            openBtn.className = 'open-youtube-btn';
            openBtn.innerText = 'YouTubeで開く';
            openBtn.onclick = () => { window.open(`https://www.youtube.com/watch?v=${id}`, '_blank'); };
            suggestBar.appendChild(openBtn);
        }
    } catch (e) {
        // 属性設定に失敗してもナビゲート自体は行う
        console.error('iframe attribute set failed', e);
    }
}

// ランダムメッセージ機能
function setRandomMessage() {
    const messages = [
        "Wikerで、知識の世界をさらに広げよう。",
        "今日はどんな動画や記事を見つけますか？",
        "Wikerはwikipedia向けに最適化されたブラウザです。",
        "新しいタブを開くたび、新しい発見がありますように。",
        "Wikipediaと動画を、このひとつの場所で。",
        "sm番号を直接入力してニコニコ動画へ！"
    ];
    const target = document.getElementById('random-message');
    if (target) {
        const randomIndex = Math.floor(Math.random() * messages.length);
        target.innerText = messages[randomIndex];
    }
}

function showHome() {
    viewport.style.display = 'none';
    homeScreen.style.display = 'flex';
    urlText.innerText = "Wiker Home";
    omnibox.value = '';
    suggestBar.innerHTML = '';
    setRandomMessage(); // ホームに戻るたびにメッセージをランダム更新
}

function homeSearch() {
    const homeInput = document.getElementById('home-input');
    if (homeInput.value.trim()) {
        omnibox.value = homeInput.value;
        navigate();
        homeInput.value = '';
    }
}

/**
 *  ブックマーク管理
 */
function renderBookmarks() {
    const bms = JSON.parse(localStorage.getItem(WIKER_DB)) || [];
    const list = document.getElementById('bookmark-list');
    list.innerHTML = '';
    bms.forEach((bm, index) => {
        const btn = document.createElement('button');
        btn.className = 'bookmark-item';
        btn.innerText = bm.title;
        btn.onclick = () => {
            homeScreen.style.display = 'none';
            viewport.style.display = 'block';
            viewport.src = bm.url;
            urlText.innerText = bm.url;
            omnibox.value = bm.title;
        };
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm(`「${bm.title}」を削除しますか？`)) {
                bms.splice(index, 1);
                localStorage.setItem(WIKER_DB, JSON.stringify(bms));
                renderBookmarks();
            }
        };
        list.appendChild(btn);
    });
}

function addBookmark() {
    const title = prompt("Wikerブックマークに保存:", omnibox.value || "新ページ");
    if (title) {
        const bms = JSON.parse(localStorage.getItem(WIKER_DB)) || [];
        const currentUrl = viewport.src || omnibox.value;
        bms.push({ title: title, url: currentUrl });
        localStorage.setItem(WIKER_DB, JSON.stringify(bms));
        renderBookmarks();
    }
}

// イベント設定
omnibox.addEventListener('keypress', (e) => { if (e.key === 'Enter') navigate(); });
window.onload = () => {
    if (!localStorage.getItem(WIKER_DB)) {
        const defaults = [
            { title: "青空文庫", url: "https://www.aozora.gr.jp/" },
            { title: "Wikipedia", url: "https://ja.m.wikipedia.org/" },
            { title: "ProjectGutenberg", url: "https://www.gutenberg.org/" },
            { title: "Weblio国語辞典", url: "https://www.weblio.jp/" },
            { title: "英語辞典", url: "https://ejje.weblio.jp/" }
        ];
        localStorage.setItem(WIKER_DB, JSON.stringify(defaults));
    }
    renderBookmarks();
    showHome();
};