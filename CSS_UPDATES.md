# CSS Updates for New Features

## New Styles to Add to styles.css

### 1. Video Section Styles

```css
/* Video Section */
.videos-section {
    padding: 80px 0;
    background-color: var(--gray-100);
}

.section-subtitle {
    text-align: center;
    font-size: 18px;
    color: var(--gray-700);
    margin-bottom: 48px;
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 32px;
}

.video-card {
    background: var(--white);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
    transition: all 0.3s ease;
}

.video-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
}

.video-wrapper {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
}

.video-wrapper iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.video-card h3 {
    padding: 16px;
    font-size: 18px;
    font-weight: 600;
    color: var(--gray-900);
}

.video-language {
    padding: 0 16px 16px;
    font-size: 14px;
    color: var(--gray-700);
}
```

### 2. About Company Section Styles

```css
/* About Company Section */
.about-section {
    padding: 80px 0;
}

.about-content {
    max-width: 800px;
    margin: 0 auto 64px;
}

.about-text p {
    font-size: 18px;
    line-height: 1.8;
    color: var(--gray-700);
    margin-bottom: 16px;
}

.subsection-title {
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 40px;
    color: var(--gray-900);
}

/* Team Grid */
.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 32px;
    margin-bottom: 64px;
}

.team-card {
    background: var(--white);
    padding: 32px 24px;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    text-align: center;
    transition: all 0.3s ease;
}

.team-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
}

.team-photo {
    font-size: 64px;
    margin-bottom: 16px;
}

.team-card h4 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--gray-900);
}

.team-card p {
    font-size: 16px;
    color: var(--gray-700);
}

/* Social CTA */
.social-cta {
    text-align: center;
    background: var(--gray-100);
    padding: 48px 32px;
    border-radius: 16px;
}

.social-cta h3 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 24px;
    color: var(--gray-900);
}

.social-links {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-bottom: 32px;
    flex-wrap: wrap;
}

.social-btn {
    padding: 12px 24px;
    background: var(--white);
    color: var(--gray-900);
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 2px solid var(--gray-200);
}

.social-btn:hover {
    border-color: var(--primary-red);
    color: var(--primary-red);
    transform: translateY(-2px);
}

.btn-large {
    padding: 20px 48px;
    font-size: 18px;
}
```

### 3. Admin Panel Updates

```css
/* Admin Video Item */
.admin-video-item {
    padding: 16px;
    border: 2px solid var(--gray-200);
    border-radius: 8px;
    margin-bottom: 12px;
}

.admin-video-item h4 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}

.admin-video-item p {
    font-size: 14px;
    color: var(--gray-700);
    margin-bottom: 8px;
}

.admin-video-item a {
    color: var(--primary-red);
    text-decoration: none;
}

.admin-video-item a:hover {
    text-decoration: underline;
}

/* Danger Button */
.btn-danger {
    background-color: #dc2626;
    color: var(--white);
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-danger:hover {
    background-color: #b91c1c;
    transform: translateY(-2px);
}

/* Form Small Text */
.form-group small {
    display: block;
    margin-top: 4px;
    font-size: 13px;
    color: var(--gray-700);
}

/* Admin Test Item Update */
.admin-test-item {
    padding: 16px;
    border: 2px solid var(--gray-200);
    border-radius: 8px;
    margin-bottom: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.admin-test-item button {
    margin-top: 12px;
    align-self: flex-start;
}
```

### 4. Responsive Updates

```css
/* Responsive Design Updates */
@media (max-width: 768px) {
    .videos-grid {
        grid-template-columns: 1fr;
    }

    .team-grid {
        grid-template-columns: 1fr;
    }

    .social-links {
        flex-direction: column;
        align-items: center;
    }

    .social-btn {
        width: 100%;
        max-width: 300px;
    }

    .btn-large {
        width: 100%;
        max-width: 300px;
    }
}
```

## Implementation Instructions

1. Open `styles.css`
2. Add all new styles at the end of the file (before responsive section)
3. Update responsive section with new media queries
4. Save file

## Notes

- All styles follow existing design system
- Uses existing CSS variables for colors
- Maintains consistent spacing and shadows
- Fully responsive for mobile devices
- Hover effects for better UX
