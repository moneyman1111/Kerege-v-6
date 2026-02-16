# Mobile Responsive CSS Updates

Add these styles to `styles.css` to replace the existing responsive section:

```css
/* ============================================
   MOBILE RESPONSIVE DESIGN
   ============================================ */

/* Burger Menu (Hidden on Desktop) */
.burger-menu {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    z-index: 1001;
}

.burger-menu span {
    width: 28px;
    height: 3px;
    background-color: var(--gray-900);
    border-radius: 2px;
    transition: all 0.3s ease;
}

.burger-menu.active span:nth-child(1) {
    transform: rotate(45deg) translate(8px, 8px);
}

.burger-menu.active span:nth-child(2) {
    opacity: 0;
}

.burger-menu.active span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -7px);
}

/* Global Mobile Optimizations */
@media (max-width: 768px) {
    /* Prevent horizontal scroll */
    body {
        overflow-x: hidden;
    }

    /* Minimum font size for readability */
    body {
        font-size: 16px;
    }

    /* Container padding */
    .container {
        padding: 0 16px;
    }

    /* ============================================
       NAVIGATION - BURGER MENU
       ============================================ */
    
    .burger-menu {
        display: flex;
    }

    .nav-menu {
        position: fixed;
        top: 0;
        right: -100%;
        width: 280px;
        height: 100vh;
        background: var(--white);
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
        flex-direction: column;
        padding: 80px 32px 32px;
        gap: 24px;
        transition: right 0.3s ease;
        z-index: 1000;
    }

    .nav-menu.active {
        right: 0;
    }

    .nav-link {
        font-size: 18px;
        padding: 12px 0;
        border-bottom: 1px solid var(--gray-200);
    }

    .nav-link.active::after {
        display: none;
    }

    .nav-link.active {
        background: var(--gray-100);
        padding: 12px 16px;
        border-radius: 8px;
        border-bottom: none;
    }

    /* ============================================
       HERO SECTION
       ============================================ */
    
    .hero {
        padding: 48px 0;
    }

    .hero-title {
        font-size: 32px;
        line-height: 1.2;
    }

    .hero-subtitle {
        font-size: 16px;
    }

    /* ============================================
       SECTIONS
       ============================================ */
    
    .section-title {
        font-size: 28px;
        margin-bottom: 32px;
    }

    .problems,
    .solution,
    .test-selection,
    .about-us,
    .team-section,
    .contact-section {
        padding: 48px 0;
    }

    /* ============================================
       CARDS & GRIDS - SINGLE COLUMN
       ============================================ */
    
    .cards-grid,
    .tests-grid,
    .team-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .card,
    .test-card,
    .team-card {
        padding: 24px 20px;
    }

    /* ============================================
       BUTTONS - TOUCH FRIENDLY (44px minimum)
       ============================================ */
    
    .btn {
        min-height: 48px;
        padding: 14px 28px;
        font-size: 16px;
        width: 100%;
        max-width: 100%;
    }

    .btn-call {
        padding: 16px 32px;
        font-size: 17px;
    }

    /* ============================================
       TEST INTERFACE - MOBILE OPTIMIZED
       ============================================ */
    
    /* Test Header - Sticky */
    .test-header {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 16px 0;
    }

    .test-info {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
    }

    .test-info h2 {
        font-size: 18px;
    }

    .timer {
        font-size: 24px;
        align-self: flex-end;
    }

    /* Test Container - Single Column */
    .test-container {
        grid-template-columns: 1fr;
        gap: 24px;
        padding: 16px;
    }

    /* Test Image - Full Width */
    .test-image-section img {
        width: 100%;
        border-radius: 8px;
    }

    /* Answer Section - Not Sticky on Mobile */
    .answer-section {
        position: static;
        padding: 24px 16px;
    }

    .answer-section h3 {
        font-size: 18px;
        margin-bottom: 16px;
    }

    /* Answer Grid - Optimized for Touch */
    .answer-grid {
        gap: 12px;
        max-height: none;
        padding-right: 0;
    }

    .answer-row {
        grid-template-columns: 35px 1fr;
        gap: 8px;
    }

    .question-number {
        font-size: 14px;
    }

    /* Answer Buttons - LARGE for Touch */
    .answer-btn {
        width: 48px;
        height: 48px;
        font-size: 16px;
        border-width: 3px;
    }

    .answer-btn:hover {
        transform: none; /* Remove hover effect on mobile */
    }

    .answer-btn:active {
        transform: scale(0.95);
    }

    /* Submit Button - Full Width */
    .answer-section .btn {
        width: 100%;
        margin-top: 16px;
    }

    /* ============================================
       MODALS - MOBILE OPTIMIZED
       ============================================ */
    
    .modal-content {
        padding: 32px 20px;
        width: 95%;
        max-width: 95%;
    }

    .modal-title {
        font-size: 24px;
    }

    .modal-subtitle {
        font-size: 15px;
    }

    .close {
        font-size: 28px;
        right: 16px;
        top: 16px;
    }

    /* ============================================
       FORMS - FULL WIDTH INPUTS
       ============================================ */
    
    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        font-size: 15px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        min-height: 48px;
        font-size: 16px;
        padding: 12px 14px;
    }

    .form-group textarea {
        min-height: 100px;
    }

    /* ============================================
       ABOUT PAGE - MOBILE
       ============================================ */
    
    .about-hero {
        padding: 48px 0 40px;
    }

    .about-title {
        font-size: 28px;
    }

    .about-slogan {
        font-size: 16px;
    }

    .about-description {
        font-size: 16px;
        text-align: left;
    }

    /* Stats Grid - 2 Columns */
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }

    .stat-card {
        padding: 24px 16px;
    }

    .stat-number {
        font-size: 36px;
    }

    .stat-label {
        font-size: 14px;
    }

    /* Team Section */
    .section-subtitle {
        font-size: 16px;
        margin-top: -24px;
    }

    .team-avatar {
        font-size: 64px;
    }

    .team-name {
        font-size: 20px;
    }

    .team-subject {
        font-size: 15px;
    }

    .team-experience,
    .team-achievement {
        font-size: 13px;
    }

    /* Contact Section */
    .contact-subtitle {
        font-size: 16px;
    }

    .social-links {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .social-link {
        width: 100%;
        justify-content: center;
        padding: 16px 24px;
        font-size: 17px;
    }

    .contact-info {
        font-size: 18px;
    }

    .contact-address {
        font-size: 15px;
    }

    /* ============================================
       ADMIN PANEL - MOBILE
       ============================================ */
    
    .admin-container {
        padding: 24px 16px;
    }

    .admin-header h1 {
        font-size: 24px;
    }

    .admin-section {
        padding: 20px 16px;
        margin-bottom: 20px;
    }

    .admin-section h2 {
        font-size: 20px;
        margin-bottom: 16px;
    }

    .admin-test-item,
    .admin-video-item {
        padding: 12px;
    }

    .admin-test-item h4 {
        font-size: 16px;
    }

    .admin-test-item p {
        font-size: 13px;
    }

    .admin-test-item button,
    .admin-video-item button {
        width: 100%;
        margin-top: 8px;
    }

    .admin-login {
        margin: 40px auto;
        padding: 32px 24px;
    }

    /* ============================================
       IMAGE ZOOM MODAL
       ============================================ */
    
    .image-modal img {
        max-width: 100%;
        max-height: 90%;
    }

    .close-zoom {
        top: 16px;
        right: 16px;
        font-size: 36px;
    }

    /* ============================================
       SUCCESS MODAL
       ============================================ */
    
    .success-content h2 {
        font-size: 26px;
    }

    .success-content p {
        font-size: 16px;
    }
}

/* Extra Small Devices (< 480px) */
@media (max-width: 480px) {
    .hero-title {
        font-size: 26px;
    }

    .section-title {
        font-size: 24px;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .stat-number {
        font-size: 32px;
    }

    .answer-btn {
        width: 44px;
        height: 44px;
        font-size: 15px;
    }

    .nav-menu {
        width: 100%;
        right: -100%;
    }

    .nav-menu.active {
        right: 0;
    }
}

/* Landscape Mode on Mobile */
@media (max-width: 768px) and (orientation: landscape) {
    .test-container {
        grid-template-columns: 1fr 1fr;
    }

    .answer-section {
        position: sticky;
        top: 80px;
    }
}
```

## Implementation Instructions

1. Open `styles.css`
2. Find the existing `@media (max-width: 768px)` section (around line 585)
3. Replace it entirely with the code above
4. Save the file

This provides:
- ✅ Burger menu with smooth animation
- ✅ Touch-friendly buttons (48px minimum)
- ✅ Full-width inputs and forms
- ✅ Single-column layouts on mobile
- ✅ Sticky test header
- ✅ Large answer buttons (48px)
- ✅ Optimized admin panel
- ✅ Responsive images
- ✅ No horizontal scroll
