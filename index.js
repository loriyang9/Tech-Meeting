/* ==========================================================================
   IDDI Presentation - Minimalist Slides Engine (JS)
   FUDY Group & Sunlitt Design - 2026
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Core DOM Elements & State
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
    let isTransitioning = false; // Debounce lock for wheel/swipe
    const TRANSITION_LOCK_MS = 800; // Time window for slide lock
    
    // Set total slides in UI
    if (totalNumSpan) {
        totalNumSpan.textContent = totalSlides;
    }

    // ----------------------------------------------------------------------
    // 2. Slide Navigation Core Engine
    // ----------------------------------------------------------------------
    function goToSlide(index) {
        // Bounds checking
        if (index < 0 || index >= totalSlides) return;
        
        // Remove active class from previous active slide
        const prevSlide = slides[currentSlideIndex];
        if (prevSlide) {
            prevSlide.classList.remove('active');
            // Add custom animation state if needed
            if (index > currentSlideIndex) {
                prevSlide.classList.add('exit-left');
                prevSlide.classList.remove('exit-right');
            } else {
                prevSlide.classList.add('exit-right');
                prevSlide.classList.remove('exit-left');
            }
        }
        
        // Update current state
        currentSlideIndex = index;
        const activeSlide = slides[currentSlideIndex];
        
        // Activate new slide
        if (activeSlide) {
            activeSlide.classList.remove('exit-left', 'exit-right');
            activeSlide.classList.add('active');
        }
        
        // Synchronize elements
        updateSidebar(currentSlideIndex);
        updateControls(currentSlideIndex);
        updateProgress(currentSlideIndex);
        updateHash(currentSlideIndex);
    }
    
    // Update Sidebar Navigation state
    function updateSidebar(index) {
        navItems.forEach((item, idx) => {
            if (idx === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Update Footer Controls
    function updateControls(index) {
        if (currentNumSpan) {
            currentNumSpan.textContent = index + 1;
        }
        
        // Disable state for first/last page buttons
        if (prevBtn) {
            prevBtn.style.opacity = index === 0 ? '0.3' : '1';
            prevBtn.style.pointerEvents = index === 0 ? 'none' : 'auto';
        }
        if (nextBtn) {
            nextBtn.style.opacity = index === totalSlides - 1 ? '0.3' : '1';
            nextBtn.style.pointerEvents = index === totalSlides - 1 ? 'none' : 'auto';
        }
    }
    
    // Update Progress Bar
    function updateProgress(index) {
        if (progressBar) {
            const percentage = (index / (totalSlides - 1)) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    }

    // Update URL hash without jumping
    function updateHash(index) {
        const slideId = `slide-${index + 1}`;
        history.pushState(null, null, `#${slideId}`);
    }

    // ----------------------------------------------------------------------
    // 3. User Interaction Triggers
    // ----------------------------------------------------------------------
    
    // Sidebar Item Clicking
    navItems.forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            goToSlide(idx);
        });
    });

    // Control Buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => goToSlide(currentSlideIndex + 1));
    }
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Avoid triggering inside input fields (if any)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ': // Spacebar
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

    // Debounced Mouse Wheel Scroll
    window.addEventListener('wheel', (e) => {
        // Prevent scroll interference during slide transitions
        if (isTransitioning) return;
        
        // Detect significant vertical scroll delta
        if (Math.abs(e.deltaY) > 30) {
            isTransitioning = true;
            
            if (e.deltaY > 0) {
                goToSlide(currentSlideIndex + 1);
            } else {
                goToSlide(currentSlideIndex - 1);
            }
            
            // Release lock after transition completes
            setTimeout(() => {
                isTransitioning = false;
            }, TRANSITION_LOCK_MS);
        }
    }, { passive: true });

    // Touch Swiping (Mobile & Tablet)
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
        
        // Swipe Threshold: 50px minimum horizontal, and flatter than vertical
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            isTransitioning = true;
            
            if (deltaX < 0) {
                // Swipe Left -> Next
                goToSlide(currentSlideIndex + 1);
            } else {
                // Swipe Right -> Prev
                goToSlide(currentSlideIndex - 1);
            }
            
            setTimeout(() => {
                isTransitioning = false;
            }, TRANSITION_LOCK_MS);
        }
    }, { passive: true });

    // ----------------------------------------------------------------------
    // 4. Fullscreen API Wrapper
    // ----------------------------------------------------------------------
    function toggleFullscreen() {
        if (!document.fullscreenElement &&
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            // Request Fullscreen
            const requestFS = presentation.requestFullscreen || 
                              presentation.mozRequestFullScreen || 
                              presentation.webkitRequestFullscreen || 
                              presentation.msRequestFullscreen;
            if (requestFS) {
                requestFS.call(presentation);
            }
        } else {
            // Exit Fullscreen
            const exitFS = document.exitFullscreen || 
                           document.mozCancelFullScreen || 
                           document.webkitExitFullscreen || 
                           document.msExitFullscreen;
            if (exitFS) {
                exitFS.call(document);
            }
        }
    }

    // Adjust UI when entering/exiting fullscreen
    function onFullscreenChange() {
        const isFS = document.fullscreenElement || 
                     document.webkitFullscreenElement;
        
        if (isFS) {
            fullscreenBtn.textContent = 'Collapse';
            fullscreenBtn.setAttribute('aria-label', '退出全螢幕');
        } else {
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.setAttribute('aria-label', '全螢幕');
        }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    // ----------------------------------------------------------------------
    // 6. Slide 6 Interactive Templates Full View Logic
    // ----------------------------------------------------------------------
    const templateBtns = document.querySelectorAll('.template-btn');
    const rolesWrapper = document.getElementById('roles-overview-wrapper');
    const fullViewWrapper = document.getElementById('template-full-view-wrapper');
    const backBtn = document.getElementById('template-back-btn');
    const viewBody = document.getElementById('template-view-body');
    const viewTitle = document.getElementById('template-view-title');


    const techTemplateHtml = `
<div class="mock-template-wrapper">
    <div class="template-header">
        <div class="tpl-badge-group">
            <span class="tpl-date">截止日期：2026.06.11(四) 中午 12:00</span>
        </div>
        <h3>富迪現有技術/結構能力盤點表</h3>
        <p class="tpl-intro"><strong>填寫說明：</strong>有符合「所具備的能力」的技術或結構，請寫下它的名稱，並貼上該技術或結構的照片。如果沒有名稱，請寫下內部習慣使用的稱呼。當你認為表格中沒有對應的技術或結構，請直接留空白；不確定的內容也可先填寫關鍵詞，訪談時再補充說明。如果你還想到重要、常使用，但是沒有列在「所具備的能力」，請直接在「其他」欄位裡補充。</p>
    </div>
    
    <div class="template-info-box">
        <div class="info-title">填寫者資訊</div>
        <div class="info-grid">
            <div class="info-field">
                <span class="info-label">姓名 / 職稱</span>
                <div class="info-placeholder">請填寫填寫者之姓名與職稱...</div>
            </div>
            <div class="info-field">
                <span class="info-label">在富迪的年資</span>
                <div class="info-placeholder">請填寫在富迪服務之年資...</div>
            </div>
            <div class="info-field full-row">
                <span class="info-label">最熟悉、最擅長的紙結構、材料或技術類型</span>
                <div class="info-placeholder">請填寫您最擅長之類型，例如：一體成型卡扣結構、蜂巢紙板結構、水性防潮塗層等...</div>
            </div>
        </div>
    </div>
    
    <div class="template-sections-container">
        <!-- Section 1 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">01</span>
                <h4>紙箱紙盒包裝本身的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">所具備的能力</div>
                    <div class="table-col col-tech">技術或結構 (可填寫 1 ~ 4 項)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>長期倉儲存放穩定不易變質</strong>
                        <span class="desc">如高溫或防潮</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>紙箱紙盒耐重、耐撞擊</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>持續使用不易壞</strong>
                        <span class="desc">如支援重複開關扣合</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>運送時可壓縮或平整收納</strong>
                        <span class="desc">或容易堆疊</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>便於回收再利用</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">填寫其他紙箱紙盒本身之設計技術或工法...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">02</span>
                <h4>為了紙箱紙盒包裝內的物品所做的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">所具備的能力</div>
                    <div class="table-col col-tech">技術或結構 (可填寫 1 ~ 4 項)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>防撞保護</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>內容物固定或定位，防位移</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>可從外看見並確認內容物狀態</strong>
                        <span class="desc">如透明窗或開孔設計等</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>維持活體內容物安穩舒適或避免掙脫</strong>
                        <span class="desc">如透光透氣、防抓或上鎖等</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">填寫其他內部物品保護相關之設計工法...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 3 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">03</span>
                <h4>針對使用紙箱紙盒包裝的人 (使用者) 所做的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">所具備的能力</div>
                    <div class="table-col col-tech">技術或結構 (可填寫 1 ~ 4 項)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>使用的舒適度</strong>
                        <span class="desc">如好握好提、符合人體工學、拿久了也不會不舒服</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>通用設計</strong>
                        <span class="desc">如單手或力氣不足也可以操作 (無障礙使用)</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>保護使用者不受傷</strong>
                        <span class="desc">如減少銳利邊緣、降低割傷風險</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>不用教學，或簡單提示與線索，使用者就會操作</strong>
                        <span class="desc">不用教學，或簡單提示與線索，使用者就會操作 (直覺性操作)</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>外觀容易辨認</strong>
                        <span class="desc">如視覺識別、印刷呈現不脫色</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">技術/結構名稱或內部稱呼 + 貼上照片...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">填寫其他針對使用者優化之設計工法...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

    const clientTemplateHtml = `
<div class="mock-template-wrapper">
    <div class="template-header">
        <div class="tpl-badge-group">
            <span class="tpl-date">截止日期：2026.06.11(四) 中午 12:00</span>
        </div>
        <h3>富迪客戶需求盤點表</h3>
        <p class="tpl-intro"><strong>填寫說明：</strong>從客戶的角度，了解客戶對富迪的產品，有哪些需求、期待。當你認為表格中沒有提到、卻是客戶特別重視的需求，請直接在「其他」欄位裡補充。</p>
    </div>
    
    <div class="template-info-box">
        <div class="info-title">填寫者資訊</div>
        <div class="info-grid">
            <div class="info-field">
                <span class="info-label">姓名 / 職稱</span>
                <div class="info-placeholder">請填寫填寫者之姓名與職稱...</div>
            </div>
            <div class="info-field">
                <span class="info-label">在富迪的年資</span>
                <div class="info-placeholder">請填寫在富迪服務之年資...</div>
            </div>
            <div class="info-field full-row">
                <span class="info-label">最熟悉領域或市場</span>
                <div class="info-placeholder">請填寫您最熟悉之領域，例如：歐美電子產品包裝、東南亞物流市場、綠色永續包裝採購等...</div>
            </div>
        </div>
    </div>
    
    <div class="template-sections-container">
        <!-- Section 1 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">01</span>
                <h4>紙箱紙盒包裝本身的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">需求或期待</div>
                    <div class="table-col col-tech">客戶需求 (可填寫 1 ~ 4 個客戶)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>長期倉儲存放穩定不易變質</strong>
                        <span class="desc">如高溫或防潮</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>紙箱紙盒耐重、耐撞擊</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>持續使用不易壞</strong>
                        <span class="desc">如支援重複開關扣合</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>運送時可壓縮或平整收納</strong>
                        <span class="desc">或容易堆疊</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>便於回收再利用</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 2 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">02</span>
                <h4>為了紙箱紙盒包裝內的物品所做的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">需求或期待</div>
                    <div class="table-col col-tech">客戶需求 (可填寫 1 ~ 4 個客戶)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>防撞保護</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                            <div class="tech-slot">2. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>內容物固定或定位，防位移</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>可從外看見並確認內容物狀態</strong>
                        <span class="desc">如透明窗或開孔設計等</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>維持活體內容物安穩舒適或避免掙脫</strong>
                        <span class="desc">如透光透氣、防抓或上鎖等</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section 3 -->
        <div class="tpl-section">
            <div class="section-header">
                <span class="section-num">03</span>
                <h4>為了使用紙箱紙盒包裝的人 (使用者) 所做的設計</h4>
            </div>
            <div class="table-mock">
                <div class="table-row table-header-row">
                    <div class="table-col col-capability">需求或期待</div>
                    <div class="table-col col-tech">客戶需求 (可填寫 1 ~ 4 個客戶)</div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>使用的舒適度</strong>
                        <span class="desc">如好握好提、符合人體工學、拿久了也不會不舒服</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>通用設計</strong>
                        <span class="desc">如單手或力氣不足也可以操作 (無障礙使用)</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>保護使用者不受傷</strong>
                        <span class="desc">如減少銳利邊緣、降低割傷風險</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>不用教學，或簡單提示與線索，使用者就會操作</strong>
                        <span class="desc">直覺性操作</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>外觀容易辨認</strong>
                        <span class="desc">如視覺識別、印刷呈現不脫色</span>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="table-row">
                    <div class="table-col col-capability">
                        <strong>其他</strong>
                    </div>
                    <div class="table-col col-tech">
                        <div class="tech-input-slots">
                            <div class="tech-slot">1. <span class="slot-placeholder">請具體寫下，過去客戶有的需求、期待，或是曾經提出的回饋...</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`;

    if (templateBtns && rolesWrapper && fullViewWrapper && viewBody) {
        templateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering any keyboard or parent events
                const type = btn.getAttribute('data-template');
                const downloadLink = document.getElementById('template-download-link');

                // Inject corresponding template HTML and update titles/classes
                if (type === 'tech') {
                    viewBody.innerHTML = techTemplateHtml;
                    if (viewTitle) viewTitle.textContent = '技術蒐集範本';
                    if (downloadLink) {
                        downloadLink.href = '技術盤點表_20260602.docx';
                        downloadLink.download = '技術盤點表_20260602.docx';
                        downloadLink.className = 'template-header-download-btn tech-theme';
                    }
                } else if (type === 'client') {
                    viewBody.innerHTML = clientTemplateHtml;
                    if (viewTitle) viewTitle.textContent = '客戶需求蒐集範本';
                    if (downloadLink) {
                        downloadLink.href = '客戶需求盤點表_20260602.docx';
                        downloadLink.download = '客戶需求盤點表_20260602.docx';
                        downloadLink.className = 'template-header-download-btn client-theme';
                    }
                }

                // Hide roles and fade in full view wrapper
                rolesWrapper.style.display = 'none';
                fullViewWrapper.style.display = 'flex';
                
                // Reset scroll position to top
                viewBody.scrollTop = 0;
            });
        });

        const goBackToRoles = () => {
            fullViewWrapper.style.display = 'none';
            rolesWrapper.style.display = 'flex';
        };

        if (backBtn) {
            backBtn.addEventListener('click', goBackToRoles);
        }

        // Isolate preview modal from slide scrolling & swiping propagation
        if (fullViewWrapper) {
            fullViewWrapper.addEventListener('wheel', (e) => {
                e.stopPropagation();
            }, { passive: false });

            fullViewWrapper.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            fullViewWrapper.addEventListener('touchend', (e) => {
                e.stopPropagation();
            }, { passive: true });
        }
    }

    // ----------------------------------------------------------------------
    // 5. Initial Routing (Hash Link)
    // ----------------------------------------------------------------------
    function init() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#slide-')) {
            const slideNum = parseInt(hash.replace('#slide-', ''), 10);
            if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= totalSlides) {
                goToSlide(slideNum - 1);
                return;
            }
        }
        // Default to first slide
        goToSlide(0);
    }
    
    init();
});
