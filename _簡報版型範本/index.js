/* ==========================================================================
   IDDI Presentation Template - Minimalist Slides Engine (JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. 核心 DOM 元素選取與狀態初始化
    // ----------------------------------------------------------------------
    const presentation = document.querySelector('.presentation-container');
    const slides = Array.from(document.querySelectorAll('.slide'));
    const navItems = Array.from(document.querySelectorAll('.nav-item'));
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    const currentNumSpan = document.querySelector('.current-slide-num');
    const totalNumSpan = document.querySelector('.total-slide-num');
    const progressBar = document.querySelector('.progress-bar');
    
    let currentSlideIndex = 0;
    const totalSlides = slides.length;
    let isTransitioning = false;     // 防抖動鎖，防止滾輪或手勢過快切換
    const TRANSITION_LOCK_MS = 600;  // 轉場過渡保護時間 (微調為更迅速的 600ms)
    
    // 設定介面上的總頁數
    if (totalNumSpan) {
        totalNumSpan.textContent = totalSlides;
    }

    // ----------------------------------------------------------------------
    // 2. 投影片切換核心引擎 (核心驅動函式，請勿隨意修改)
    // ----------------------------------------------------------------------
    function goToSlide(index) {
        // 邊界檢查
        if (index < 0 || index >= totalSlides) return;
        
        // 移除前一張投影片的 active 狀態，並設定滑出方向動畫
        const prevSlide = slides[currentSlideIndex];
        if (prevSlide) {
            prevSlide.classList.remove('active');
            if (index > currentSlideIndex) {
                prevSlide.classList.add('exit-left');
                prevSlide.classList.remove('exit-right');
            } else {
                prevSlide.classList.add('exit-right');
                prevSlide.classList.remove('exit-left');
            }
        }
        
        // 更新當前索引
        currentSlideIndex = index;
        const activeSlide = slides[currentSlideIndex];
        
        // 啟動新投影片的 active 狀態，清除滑出動畫
        if (activeSlide) {
            activeSlide.classList.remove('exit-left', 'exit-right');
            activeSlide.classList.add('active');
        }
        
        // 同步所有導覽元件狀態
        updateSidebar(currentSlideIndex);
        updateControls(currentSlideIndex);
        updateProgress(currentSlideIndex);
        updateHash(currentSlideIndex);
    }
    
    // 更新側邊欄高亮狀態
    function updateSidebar(index) {
        navItems.forEach((item, idx) => {
            if (idx === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // 更新底部控制按鈕的透明度與禁用狀態
    function updateControls(index) {
        if (currentNumSpan) {
            currentNumSpan.textContent = index + 1;
        }
        
        if (prevBtn) {
            prevBtn.style.opacity = index === 0 ? '0.3' : '1';
            prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
        }
        if (nextBtn) {
            nextBtn.style.opacity = index === totalSlides - 1 ? '0.3' : '1';
            nextBtn.style.pointerEvents = index === totalSlides - 1 ? 'none' : 'auto';
        }
    }
    
    // 更新底部進度條比例
    function updateProgress(index) {
        if (progressBar) {
            const percentage = totalSlides > 1 ? (index / (totalSlides - 1)) * 100 : 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    // 更新 URL 的錨點 (Hash)，方便重整後保持在同一頁
    function updateHash(index) {
        const slideId = `slide-${index + 1}`;
        history.pushState(null, null, `#${slideId}`);
    }

    // ----------------------------------------------------------------------
    // 3. 互動觸發監聽事件 (使用者操作對接)
    // ----------------------------------------------------------------------
    
    // 側邊欄目錄點擊跳轉
    navItems.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(idx);
        });
    });

    // 底部左右切換按鈕
    if (prevBtn) {
        prevBtn.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => goToSlide(currentSlideIndex + 1));
    }
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // 鍵盤快捷鍵監聽
    document.addEventListener('keydown', (e) => {
        // 如果使用者正在輸入文字框，則不觸發切換
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ': // 空白鍵
            case 'Enter':
                e.preventDefault();
                goToSlide(currentSlideIndex + 1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                goToSlide(currentSlideIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(totalSlides - 1);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });

    // 滑鼠滾輪切換 (附帶時間防抖動鎖)
    window.addEventListener('wheel', (e) => {
        if (isTransitioning) return;
        
        if (Math.abs(e.deltaY) > 30) {
            isTransitioning = true;
            
            if (e.deltaY > 0) {
                goToSlide(currentSlideIndex + 1);
            } else {
                goToSlide(currentSlideIndex - 1);
            }
            
            setTimeout(() => {
                isTransitioning = false;
            }, TRANSITION_LOCK_MS);
        }
    }, { passive: true });

    // 平板與手機手勢滑動切換 (Swipe Gestures)
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (isTransitioning) return;
        
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // 滑動門檻：水平滑動距離大於 50px 且夾角大於垂直方向
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isTransitioning = true;
            
            if (deltaX < 0) {
                goToSlide(currentSlideIndex + 1); // 向左滑 -> 下一張
            } else {
                goToSlide(currentSlideIndex - 1); // 向右滑 -> 上一張
            }
            
            setTimeout(() => {
                isTransitioning = false;
            }, TRANSITION_LOCK_MS);
        }
    }, { passive: true });

    // ----------------------------------------------------------------------
    // 4. 全螢幕模式 (Fullscreen API) 支援
    // ----------------------------------------------------------------------
    function toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            // 請求全螢幕
            const requestFS = presentation.requestFullscreen || 
                              presentation.mozRequestFullScreen || 
                              presentation.webkitRequestFullscreen || 
                              presentation.msRequestFullscreen;
            if (requestFS) {
                requestFS.call(presentation);
            }
        } else {
            // 退出全螢幕
            const exitFS = document.exitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.webkitExitFullscreen || 
                           document.msExitFullscreen;
            if (exitFS) {
                exitFS.call(document);
            }
        }
    }

    // 監聽全螢幕狀態改變 UI 圖示文字
    function onFullscreenChange() {
        const isFS = document.fullscreenElement || 
                     document.webkitFullscreenElement;
        
        if (isFS) {
            presentation.classList.add('fullscreen-mode');
            fullscreenBtn.textContent = '✕';
            fullscreenBtn.setAttribute('aria-label', '退出全螢幕');
        } else {
            presentation.classList.remove('fullscreen-mode');
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.setAttribute('aria-label', '全螢幕');
        }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    // ----------------------------------------------------------------------
    // 5. 初始化錨點檢查 (如果 URL 中有 #slide-N 則直接跳轉)
    // ----------------------------------------------------------------------
    const initialHash = window.location.hash;
    if (initialHash && initialHash.startsWith('#slide-')) {
        const slideNum = parseInt(initialHash.replace('#slide-', ''), 10);
        if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= totalSlides) {
            goToSlide(slideNum - 1);
        }
    }
});
