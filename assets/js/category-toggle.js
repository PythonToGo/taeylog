(function() {
  'use strict';

  let initialized = false;

  function toggleCategory(navItem, childrenList) {
    // Check if currently animating
    if (navItem.dataset.animating === 'true') {
      return;
    }
    
    const isExpanded = navItem.classList.contains('expanded');
    
    if (isExpanded) {
      // Collapse
      navItem.dataset.animating = 'true';
      navItem.classList.remove('expanded');
      childrenList.style.maxHeight = '0';
      setTimeout(function() {
        if (!navItem.classList.contains('expanded')) {
          childrenList.style.display = 'none';
        }
        navItem.dataset.animating = 'false';
      }, 300);
    } else {
      // Expand
      navItem.dataset.animating = 'true';
      navItem.classList.add('expanded');
      childrenList.style.display = 'block';
      // Use setTimeout to ensure display:block is applied before maxHeight transition
      setTimeout(function() {
        childrenList.style.maxHeight = '300px';
        setTimeout(function() {
          navItem.dataset.animating = 'false';
        }, 300);
      }, 10);
    }
  }

  function expandCategory(navItem) {
    const childrenList = navItem.querySelector('.category-children');
    if (childrenList) {
      navItem.classList.add('expanded');
      childrenList.style.display = 'block';
      setTimeout(function() {
        childrenList.style.maxHeight = '300px';
      }, 10);
    }
  }

  function handleCategoryClick(e) {
    // Find the parent nav-item
    const navItem = this.closest('.nav-item.category-sub.has-children');
    if (!navItem) {
      return;
    }
    
    // Find the children list (now inside the nav-item)
    const childrenList = navItem.querySelector('.category-children');
    if (!childrenList) {
      return;
    }
    
    // Check if currently animating
    if (navItem.dataset.animating === 'true') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Always toggle when clicking on the category link
    e.preventDefault();
    e.stopPropagation();
    toggleCategory(navItem, childrenList);
  }

  function toggleAllCategories(postItem, categoriesContainer) {
    // Check if currently animating
    if (postItem.dataset.animating === 'true') {
      return;
    }
    
    const isExpanded = postItem.classList.contains('expanded');
    const isCollapsed = postItem.classList.contains('collapsed') || 
                       (!isExpanded && categoriesContainer.classList.contains('collapsed'));
    
    if (isExpanded && !isCollapsed) {
      // Collapse
      postItem.dataset.animating = 'true';
      postItem.classList.remove('expanded');
      postItem.classList.add('collapsed');
      categoriesContainer.classList.add('collapsed');
      categoriesContainer.style.maxHeight = '0';
      setTimeout(function() {
        if (categoriesContainer.classList.contains('collapsed')) {
          categoriesContainer.style.display = 'none';
        }
        postItem.dataset.animating = 'false';
      }, 300);
    } else {
      // Expand
      postItem.dataset.animating = 'true';
      postItem.classList.remove('collapsed');
      postItem.classList.add('expanded');
      categoriesContainer.classList.remove('collapsed');
      categoriesContainer.style.display = 'block';
      setTimeout(function() {
        categoriesContainer.style.maxHeight = '2000px';
        setTimeout(function() {
          postItem.dataset.animating = 'false';
        }, 300);
      }, 10);
    }
  }

  function handlePostClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const postItem = this.closest('.nav-item.post-toggle-item');
    if (!postItem) {
      return;
    }
    
    const categoriesContainer = document.querySelector('#sidebar .all-categories-container');
    if (!categoriesContainer) {
      return;
    }
    
    // Check if currently animating
    if (postItem.dataset.animating === 'true') {
      return;
    }
    
    // Toggle all categories
    toggleAllCategories(postItem, categoriesContainer);
  }

  function initCategoryToggle() {
    // Prevent multiple initializations
    if (initialized) {
      return true;
    }
    
    // Initialize post toggle
    const postToggle = document.querySelector('#sidebar .nav-link.post-toggle-link');
    const postItem = document.querySelector('#sidebar .nav-item.post-toggle-item');
    const categoriesContainer = document.querySelector('#sidebar .all-categories-container');
    
    if (postToggle && postItem && categoriesContainer) {
      // Set initial state to collapsed (folded)
      if (!postItem.classList.contains('expanded') && !postItem.classList.contains('collapsed')) {
        postItem.classList.add('collapsed');
        categoriesContainer.classList.add('collapsed');
        categoriesContainer.style.display = 'none';
        categoriesContainer.style.maxHeight = '0';
      }
      
      if (postToggle.dataset.toggleInitialized !== 'true') {
        postToggle.addEventListener('click', handlePostClick);
        postToggle.dataset.toggleInitialized = 'true';
      }
    }
    
    const categoryToggles = document.querySelectorAll('#sidebar .nav-link.category-toggle.toggleable');
    
    if (categoryToggles.length === 0) {
      return false; // Elements not ready yet
    }
    
    categoryToggles.forEach(function(toggle) {
      // Check if already has listener (using data attribute)
      if (toggle.dataset.toggleInitialized === 'true') {
        return;
      }
      
      // Add click event listener
      toggle.addEventListener('click', handleCategoryClick);
      toggle.dataset.toggleInitialized = 'true';
    });
    
    // Auto-expand post toggle if there's an active category
    const activeCategory = document.querySelector('#sidebar .nav-item.category-sub.active, #sidebar .nav-item.category-sub-sub.active');
    if (activeCategory) {
      // Expand post toggle to show categories
      const postItem = document.querySelector('#sidebar .nav-item.post-toggle-item');
      const categoriesContainer = document.querySelector('#sidebar .all-categories-container');
      if (postItem && categoriesContainer) {
        postItem.classList.add('expanded');
        categoriesContainer.classList.remove('collapsed');
        categoriesContainer.style.display = 'block';
        categoriesContainer.style.maxHeight = '2000px';
      }
      
      // If active is a child, expand its parent
      if (activeCategory.classList.contains('category-sub-sub')) {
        // Find the parent category-sub that contains this child
        const parentNavItem = activeCategory.closest('.nav-item.category-sub.has-children');
        if (parentNavItem) {
          expandCategory(parentNavItem);
        }
      } else if (activeCategory.classList.contains('category-sub') && activeCategory.classList.contains('has-children')) {
        // If active is a parent with children, expand it
        expandCategory(activeCategory);
      }
    }
    
    initialized = true;
    return true;
  }

  // Initialize when DOM is ready
  function startInit() {
    function tryInit() {
      if (!initCategoryToggle()) {
        setTimeout(tryInit, 200);
      }
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        tryInit();
      });
    } else {
      tryInit();
    }
    
    // Also try after a delay in case sidebar is loaded dynamically
    setTimeout(function() {
      if (!initialized) {
        tryInit();
      }
    }, 500);
    
    // Listen for categories rendered event
    document.addEventListener('categoriesRendered', function() {
      // Re-initialize post toggle after categories are rendered
      const postToggle = document.querySelector('#sidebar .nav-link.post-toggle-link');
      const postItem = document.querySelector('#sidebar .nav-item.post-toggle-item');
      const categoriesContainer = document.querySelector('#sidebar .all-categories-container');
      
      if (postToggle && postItem && categoriesContainer) {
        // Set initial state to collapsed (folded) if not already set
        if (!postItem.classList.contains('expanded') && !postItem.classList.contains('collapsed')) {
          postItem.classList.add('collapsed');
          categoriesContainer.classList.add('collapsed');
          categoriesContainer.style.display = 'none';
          categoriesContainer.style.maxHeight = '0';
        }
        
        // Add listener if not already added
        if (postToggle.dataset.toggleInitialized !== 'true') {
          postToggle.addEventListener('click', handlePostClick);
          postToggle.dataset.toggleInitialized = 'true';
        }
      }
      
      // Re-initialize category toggles
      setTimeout(function() {
        const categoryToggles = document.querySelectorAll('#sidebar .nav-link.category-toggle.toggleable');
        categoryToggles.forEach(function(toggle) {
          if (toggle.dataset.toggleInitialized !== 'true') {
            toggle.addEventListener('click', handleCategoryClick);
            toggle.dataset.toggleInitialized = 'true';
          }
        });
      }, 100);
    });
  }

  startInit();
})();

