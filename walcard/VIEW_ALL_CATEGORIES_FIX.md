# Fix for "عرض الكل" Button in Categories Section

## Problem
The "عرض الكل" (Show All) button in the categories section on the home page was not working because it lacked an `onPress` handler.

## Solution
1. **Added Handler Function**: Created `handleViewAllCategories()` function that navigates to the search page
2. **Connected Handler**: Added `onPress={handleViewAllCategories}` to the TouchableOpacity button

## Files Changed
- `walcard/app/store-owner/index.tsx`

## Changes Made

### 1. Added Handler Function
```typescript
const handleViewAllCategories = () => {
  router.push('/store-owner/search');
};
```

### 2. Connected Handler to Button
```typescript
<TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllCategories}>
  <Text style={styles.viewAllText}>عرض الكل</Text>
  <MaterialIcons name="arrow-forward-ios" size={16} color="#40E0D0" />
</TouchableOpacity>
```

## Expected Behavior
- When users tap "عرض الكل" in the categories section, they will be navigated to the search page
- The search page will show all categories and products for browsing
- This provides a way to view all categories and products in a dedicated search interface

## Testing
1. Open the store owner home page
2. Scroll to the categories section
3. Tap the "عرض الكل" button
4. Verify navigation to the search page

## Notes
- The button now properly navigates to `/store-owner/search`
- This provides a better user experience for browsing all categories
- The search page already has category filtering functionality 