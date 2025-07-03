# Navigation Cleanup Analysis

## Current Routes in App.tsx
✅ Used routes that are properly connected:
- `/` - Index page (working)
- `/auth` - Auth page (used in navigation)
- `/profile-timeline` - Main profile page (primary navigation)
- `/profile-optimization` - Available in sidebar
- `/profile-management` - Available in sidebar  
- `/interview` - Available in sidebar
- `/application-toolkit` - Available in sidebar
- `/admin` - Admin portal (restricted access)

❌ Orphaned/Deprecated routes that need cleanup:
- `/dashboard` - Old dashboard system, replaced by profile-timeline
- `/profile` - Legacy profile page, superseded by profile-timeline
- `/upload` - Old upload system, functionality moved to modals
- `/resume-upload-v2` - Development route, not in navigation
- `/resume-timeline` - Development/debug route, not in main navigation
- `/entity-graph-admin` - Admin debug tool, not in main navigation

🔧 Missing route definitions (referenced but not defined):
- `/debug` - Referenced in AnalyticsTab but no route exists
- `/processing/:id` - Referenced in upload components but no route exists

## Navigation Components Analysis

### ProfileSidebar (Current Main Navigation)
✅ All routes properly defined and working:
- AI Interview → `/interview`
- Profile Optimization → `/profile-optimization`  
- Profile Management → `/profile-management`
- Application Toolkit → `/application-toolkit`
- Admin Portal → `/admin` (admin only)

### Old Navigation Component
❌ Components/Navigation.tsx - Contains outdated links:
- Links to `/dashboard` (deprecated)
- Links to `/upload` (deprecated)
- Links to `/profile` (deprecated)

### Dashboard Navigation
❌ DashboardLayout - Simplified but still exists:
- Only used by deprecated Dashboard page
- References removed navigation items

## Recommendations for Cleanup

### 1. Remove Deprecated Routes
- Remove `/dashboard` route and Dashboard page
- Remove `/profile` route and Profile page  
- Remove `/upload` route and ResumeUpload page
- Consider removing development routes like `/resume-upload-v2`, `/resume-timeline`, `/entity-graph-admin`

### 2. Fix Missing Routes
- Add `/debug` route for DebugAnalysisPage (if needed)
- Add `/processing/:id` route for ProcessingPage (if needed)

### 3. Remove Unused Navigation Components
- Delete old Navigation.tsx component (not used anywhere)
- Clean up DashboardLayout if Dashboard page is removed

### 4. Consolidate Navigation
- ProfileSidebar is the main navigation system
- Remove any references to old navigation patterns

## File Dependencies to Check
- Any components that import deprecated pages
- Any navigation logic that references old routes
- Any tests that might reference deprecated routes