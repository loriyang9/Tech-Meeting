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
    const viewTag = document.getElementById('template-view-tag');

    const techTemplateHtml = `
<div class="mock-template-wrapper">
    <div class="template-header">
        <span class="tpl-badge">範本草案</span>
        <h3>IDDI 去塑專案：技術蒐集範本 (研發與設計團隊填寫)</h3>
        <p class="tpl-intro">本範本旨在系統化盤點富迪既有與儲備之去塑結構工法及低碳紙材替代技術，藉此建構產品設計決策的基礎參數庫。</p>
    </div>
    
    <div class="template-fields-grid">
        <div class="field-block">
            <span class="field-label">1. 技術/結構名稱 (例如：全紙一體式卡扣、水性環保替塑油塗層)</span>
            <div class="field-input-box placeholder-input">請填入技術或工法之官方/內部名稱...</div>
        </div>
        
        <div class="field-block-row">
            <div class="field-block">
                <span class="field-label">2. 量產可行性階段</span>
                <div class="field-radio-group">
                    <span class="radio-item checked">✔ 已於現有產品中量產實證</span>
                    <span class="radio-item">⬜ 未來 1-2 年內，極具量產潛能之儲備技術</span>
                </div>
            </div>
            <div class="field-block">
                <span class="field-label">3. 適用功能與技術類別</span>
                <div class="field-radio-group">
                    <span class="radio-item checked">✔ 固定與保護</span>
                    <span class="radio-item">⬜ 襯托承載</span>
                    <span class="radio-item">⬜ 攜帶掛鉤</span>
                    <span class="radio-item">⬜ 封口與收納</span>
                </div>
            </div>
        </div>

        <div class="field-block">
            <span class="field-label">4. 關鍵製程參數限制 (如厚度、塗布量、抗張強度等量產限制)</span>
            <div class="field-textarea placeholder-textarea">例如：水性塗層塗布量限制在 4-6 g/m² 之間，烘乾溫度需控制在 105℃-115℃，避免紙張脆化...</div>
        </div>

        <div class="field-block">
            <span class="field-label">5. 物理性能驗證數據 (如承重能力 kg、拉力承受 N、防潮抗摔性)</span>
            <div class="field-textarea placeholder-textarea">例如：在卡扣無膠結構下，垂直抗拉力可達 45N，雙層防震紙構承重能力極限達 15kg...</div>
        </div>

        <div class="field-block">
            <span class="field-label">6. 照片、樣品或 3D 結構圖解</span>
            <div class="field-upload-placeholder">
                <span class="upload-icon-label">Drag & Drop / Click to Upload</span>
                <p>請粘貼或上傳技術圖紙、打樣實物照片、或 3D 卡扣防呆榫卯結構渲染圖檔 (PDF / JPG / CAD)</p>
            </div>
        </div>
    </div>
</div>`;

    const clientTemplateHtml = `
<div class="mock-template-wrapper">
    <div class="template-header">
        <span class="tpl-badge badge-red">範本草案</span>
        <h3>IDDI 去塑專案：客戶需求蒐集範本 (業務與行銷團隊填寫)</h3>
        <p class="tpl-intro">本範本旨在精準蒐集歐美品牌與市場端對於去塑包裝之剛性法規需求與商務痛點，以回饋研發中心推動 Sales Kit 開發。</p>
    </div>
    
    <div class="template-fields-grid">
        <div class="field-block">
            <span class="field-label">1. 客戶/品牌所屬產業類別 (如：資通訊、美妝保養、生鮮冷鏈、國際 NGO)</span>
            <div class="field-input-box placeholder-input">例如：北歐高階消費性電子品牌、歐美永續母嬰護理品牌...</div>
        </div>
        
        <div class="field-block-row">
            <div class="field-block">
                <span class="field-label">2. 主要法規與 ESG 剛性指標需求</span>
                <div class="field-radio-group">
                    <span class="radio-item checked">✔ 歐盟 PPWR 合規 (減少包材空隙率及減塑)</span>
                    <span class="radio-item">⬜ 100% 紙類回收 (不需人工分類拆解)</span>
                    <span class="radio-item">⬜ Scope 3 供應鏈減碳目標限制</span>
                </div>
            </div>
            <div class="field-block">
                <span class="field-label">3. 去塑推廣遇到之商務溝通痛點/談判瓶頸</span>
                <div class="field-radio-group">
                    <span class="radio-item checked">✔ 全紙結構扣合力或封口力不足</span>
                    <span class="radio-item">⬜ 客戶擔心全紙包裝防潮防霉性</span>
                    <span class="radio-item">⬜ 去塑替代成本偏高與空運材積限制</span>
                </div>
            </div>
        </div>

        <div class="field-block">
            <span class="field-label">4. 客戶曾提出之特定去塑規格與物理要求 (描述客戶原先依賴塑膠之部分)</span>
            <div class="field-textarea placeholder-textarea">例如：原先依賴 EPE 緩衝材保護，客戶要求全紙替代結構必須通過 1.2 米跌落測試，且不得有任何刮傷...</div>
        </div>

        <div class="field-block">
            <span class="field-label">5. 預期與防災避難情境之對接點 (預估可用於哪些場景作為推廣說服點)</span>
            <div class="field-textarea placeholder-textarea">例如：可對接「過度安置期」的低碳避難包裝箱，或「黃金72小時」的無工具快開醫療盒，向客戶展示防塵與防潑水實力...</div>
        </div>
    </div>
</div>`;

    if (templateBtns && rolesWrapper && fullViewWrapper && viewBody) {
        templateBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering any keyboard or parent events
                const type = btn.getAttribute('data-template');

                // Inject corresponding template HTML and update titles/classes
                if (type === 'tech') {
                    viewBody.innerHTML = techTemplateHtml;
                    if (viewTitle) viewTitle.textContent = '技術蒐集範本';
                    if (viewTag) {
                        viewTag.textContent = '設計師專屬';
                        viewTag.className = 'template-view-tag'; // Reset class
                    }
                } else if (type === 'client') {
                    viewBody.innerHTML = clientTemplateHtml;
                    if (viewTitle) viewTitle.textContent = '客戶需求蒐集範本';
                    if (viewTag) {
                        viewTag.textContent = '業務專屬';
                        viewTag.className = 'template-view-tag client-tag'; // Add custom class
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
