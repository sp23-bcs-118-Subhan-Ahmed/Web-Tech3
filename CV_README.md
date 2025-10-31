# Personal CV Page - Documentation

## Overview
A professional Curriculum Vitae (CV) page integrated with the BeDentist Web Technologies project. The CV features modern hover effects and smooth CSS transitions to reveal section details.

## Files Created
1. **cv.html** - Main CV page with complete structure
2. **css/cv-styles.css** - Dedicated stylesheet with hover effects and animations
3. **Updated index.html** - Added CV link to navigation menu

## Features Implemented

### ✅ Required Sections
- **Personal Information** - Name, contact details, nationality, languages
- **Education** - Academic history with timeline layout
- **Skills** - Programming languages, web technologies, tools, and soft skills
- **Experience & Projects** - Work experience and project showcase
- **Contact Information** - Detailed contact methods and availability

### ✅ Hover Effects
- **Section Cards**: Only headings visible initially
- **On Hover**: 
  - Section content smoothly expands
  - Icons rotate 360°
  - Cards lift with shadow effect
  - Background color transitions
  - Skill bars animate
  - Timeline markers scale up

### ✅ Design Integration
- Matches BeDentist color scheme (#5ccdbe teal/green)
- Uses same fonts and styling (Segoe UI)
- Integrated sidebar navigation
- Responsive design for all devices
- Smooth CSS transitions (0.3s - 0.6s)

## How to View

### Option 1: Direct Access
1. Open `cv.html` in your web browser
2. Navigate using the sidebar menu
3. Hover over each section to reveal details

### Option 2: From Main Site
1. Open `index.html`
2. Click "CV" link in the sidebar navigation
3. Explore the CV page

## Special Features

### 1. PDF Download
- Button to download `cv.pdf` (your existing file)
- Located in the hero section

### 2. Animated Elements
- **Hero Section**: Gradient background with pulsing pattern
- **Section Cards**: Staggered fade-in on page load
- **Skill Progress Bars**: Animated width transitions
- **Timeline**: Connected dots with hover effects

### 3. Interactive Elements
- Hover over section headers to expand content
- Hover over info items for highlight effect
- Hover over skill tags for color change
- Contact items animate on hover

### 4. Responsive Design
- Desktop: Full layout with sidebar
- Tablet: Adjusted grid layouts
- Mobile: Stacked single-column layout
- Print-friendly version (hides navigation)

## Technology Stack
- **HTML5**: Semantic markup, accessibility features
- **CSS3**: 
  - Flexbox and Grid layouts
  - CSS transitions and animations
  - Gradient backgrounds
  - Box shadows and transforms
- **No JavaScript**: Pure CSS hover effects

## Customization Guide

### Update Personal Information
Edit the content in `cv.html`:
- Lines ~50-80: Personal info section
- Lines ~85-135: Education section
- Lines ~140-230: Skills section
- Lines ~235-350: Experience & Projects
- Lines ~355-410: Contact information

### Modify Colors
Edit `css/cv-styles.css`:
```css
/* Main theme color */
--bedentist-teal: #5ccdbe;
--bedentist-green: #4ecbbe;
```

### Adjust Hover Speed
In `cv-styles.css`, change transition duration:
```css
.cv-section-card {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility Features
- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard navigation support
- Focus visible indicators
- Sufficient color contrast
- Screen reader friendly

## Performance
- No external dependencies (except base styles.css)
- Pure CSS animations (GPU accelerated)
- Optimized for fast loading
- Minimal JavaScript (none in CV page)

## Testing Checklist
- [ ] All sections visible and hoverable
- [ ] Smooth transitions on hover
- [ ] PDF download link works
- [ ] Navigation links functional
- [ ] Responsive on mobile devices
- [ ] Print version displays correctly
- [ ] Cross-browser compatibility

## Future Enhancements (Optional)
- Add smooth scroll to sections
- Implement dark mode toggle
- Add skill proficiency percentages
- Include project images/screenshots
- Add certifications section
- Include references section
- Add language switcher (English/Urdu)

## Credits
- **Developer**: Ahmed Subhan Tariqi
- **Course**: Web Technologies
- **Institution**: University of Central Punjab
- **Project**: BeDentist - Dental Clinic Website
- **Date**: October 2025

---

**Note**: Remember to replace placeholder information with your actual details before final submission!
