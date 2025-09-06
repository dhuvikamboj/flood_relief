# Language Translation Implementation Plan

## Goal
Add multi-language support to the flood relief application, focusing on English, Punjabi, and Hindi to serve the local community better during emergencies.

## Requirements Checklist
- [ ] Install i18n library (react-i18next)
- [ ] Create translation files for English, Punjabi, and Hindi
- [ ] Set up language context and hooks
- [ ] Add language switcher component
- [ ] Translate all UI text in key components
- [ ] Translate the extensive Punjabi tutorial content
- [ ] Persist language preference
- [ ] Test language switching functionality

## Assumptions and Scope Boundaries
- Focus on frontend translation only (React app)
- Prioritize English, Punjabi (Gurmukhi script), and Hindi (Devanagari script)
- Use react-i18next as the internationalization library
- Store translations in JSON files
- Keep existing Punjabi tutorial content as reference for accurate translation
- Scope includes Landing page, forms, navigation, and key user flows

## Plan (Ordered Steps)
1. Install react-i18next and setup basic configuration
2. Create language context and provider
3. Create translation files for all three languages
4. Create language switcher component
5. Refactor Landing page to use translations
6. Add language persistence using localStorage
7. Test and validate translations

## Files to Touch
- `/FloodReliefApp/package.json` - Add i18n dependencies
- `/FloodReliefApp/src/contexts/LanguageContext.tsx` - New language context
- `/FloodReliefApp/src/i18n/` - New directory for translation files
  - `index.ts` - i18n configuration
  - `en.json` - English translations
  - `pa.json` - Punjabi translations  
  - `hi.json` - Hindi translations
- `/FloodReliefApp/src/components/LanguageSwitcher.tsx` - New component
- `/FloodReliefApp/src/pages/Landing.tsx` - Refactor with translations
- `/FloodReliefApp/src/App.tsx` - Add language provider

## Validation Plan
- Build: `npm run build` should complete successfully
- Lint: `npm run lint` should pass
- Functional: Language switcher should change text immediately
- Persistence: Language choice should persist across browser sessions
- Content: All three languages should display correctly with proper fonts
- Manual: Verify tutorial content translation accuracy

## Progress Log

### 2025-09-06 14:00 - Translation Implementation Progress
- Created i18n configuration and setup files
- Added translation files for English, Punjabi, and Hindi
- Created LanguageSwitcher component
- Started translating Landing.tsx page (partially complete)
- Build successful after initial translations

### Todos
- [x] Install i18next dependencies ✓
- [x] Setup basic i18n configuration ✓
- [x] Create translation files ✓
- [x] Implement language switcher ✓
- [ ] Complete Landing page translations
- [ ] Translate other pages (Home, Reports, Profile, etc.)
- [ ] Translate navigation labels in App.tsx
- [ ] Test language switching functionality

### Done
- [x] Analyzed current code structure
- [x] Created implementation plan
- [x] Installed react-i18next, i18next, i18next-browser-languagedetector
- [x] Created i18n/index.ts configuration
- [x] Created translation files: en.json, pa.json, hi.json
- [x] Created LanguageSwitcher component
- [x] Added i18n import to App.tsx
- [x] Started translating Landing.tsx (hero section, auth section, stats, partial maps)
- [x] Build test passed

### Decisions
- Using react-i18next for robust i18n support
- Supporting 3 languages: English (default), Punjabi, Hindi
- Keeping existing tutorial structure but making it translatable
- Using JSON files for translations for easy maintenance
- Language switcher in page headers
