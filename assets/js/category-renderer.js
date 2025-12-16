(function() {
  'use strict';

  function renderCategories() {
    const categoriesDataEl = document.getElementById('categories-data');
    if (!categoriesDataEl) {
      return;
    }

    let categoriesData;
    try {
      categoriesData = JSON.parse(categoriesDataEl.textContent);
    } catch (e) {
      console.error('Failed to parse categories data:', e);
      return;
    }

    const categoriesList = document.getElementById('categories-list');
    const categoriesWrapper = document.querySelector('.all-categories-wrapper');
    
    if (!categoriesList) {
      return;
    }
    
    if (!categoriesData.categories || categoriesData.categories.length === 0) {
      if (categoriesWrapper) {
        categoriesWrapper.style.display = 'none';
      }
      // Dispatch event even if no categories to allow toggle initialization
      const event = new CustomEvent('categoriesRendered');
      document.dispatchEvent(event);
      return;
    }

    // Show wrapper if categories exist
    if (categoriesWrapper) {
      categoriesWrapper.style.display = 'block';
    }

    // Clear existing content
    categoriesList.innerHTML = '';

    // Render each category
    categoriesData.categories.forEach(function(category) {
      const hasChildren = category.children && category.children.length > 0;
      const isActive = categoriesData.currentUrl === category.path;
      
      // Create parent category item
      const categoryLi = document.createElement('li');
      categoryLi.className = 'nav-item category-sub' + 
        (isActive ? ' active' : '') + 
        (hasChildren ? ' has-children' : '');
      
      const categoryLink = document.createElement('a');
      categoryLink.href = category.path;
      categoryLink.className = 'nav-link category-toggle' + (hasChildren ? ' toggleable' : '');
      
      const folderIcon = document.createElement('i');
      folderIcon.className = 'fa-fw fas fa-folder' + (hasChildren ? ' category-icon' : '');
      categoryLink.appendChild(folderIcon);
      
      const categorySpan = document.createElement('span');
      categorySpan.textContent = category.name.toUpperCase();
      categoryLink.appendChild(categorySpan);
      
      if (hasChildren) {
        const chevronIcon = document.createElement('i');
        chevronIcon.className = 'fa-fw fas fa-chevron-right category-chevron';
        categoryLink.appendChild(chevronIcon);
      }
      
      categoryLi.appendChild(categoryLink);
      
      // Create children list if exists
      if (hasChildren) {
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'category-children';
        childrenUl.style.display = 'none';
        
        category.children.forEach(function(child) {
          const childIsActive = categoriesData.currentUrl === child.path;
          
          const childLi = document.createElement('li');
          childLi.className = 'nav-item category-sub-sub' + (childIsActive ? ' active' : '');
          
          const childLink = document.createElement('a');
          childLink.href = child.path;
          childLink.className = 'nav-link';
          
          const childFolderIcon = document.createElement('i');
          childFolderIcon.className = 'fa-fw fas fa-folder-open';
          childLink.appendChild(childFolderIcon);
          
          const childSpan = document.createElement('span');
          childSpan.textContent = child.name.toUpperCase();
          childLink.appendChild(childSpan);
          
          childLi.appendChild(childLink);
          childrenUl.appendChild(childLi);
        });
        
        categoryLi.appendChild(childrenUl);
      }
      
      categoriesList.appendChild(categoryLi);
    });
    
    // Dispatch custom event to notify that categories are rendered
    const event = new CustomEvent('categoriesRendered');
    document.dispatchEvent(event);
  }

  function renderSubcategories() {
    const subcategoriesDataEl = document.getElementById('subcategories-data');
    if (!subcategoriesDataEl) {
      return;
    }

    let subcategoriesData;
    try {
      subcategoriesData = JSON.parse(subcategoriesDataEl.textContent);
    } catch (e) {
      console.error('Failed to parse subcategories data:', e);
      return;
    }

    const subcategoriesList = document.getElementById('subcategories-list');
    const subcategoriesContainer = document.getElementById('subcategories-container');
    
    if (!subcategoriesList || !subcategoriesData.subcategories || subcategoriesData.subcategories.length === 0) {
      if (subcategoriesContainer) {
        subcategoriesContainer.style.display = 'none';
      }
      return;
    }

    // Show container if subcategories exist
    if (subcategoriesContainer) {
      subcategoriesContainer.style.display = 'block';
    }

    // Clear existing content
    subcategoriesList.innerHTML = '';

    // Render each subcategory
    subcategoriesData.subcategories.forEach(function(subcat) {
      const subcatLink = document.createElement('a');
      subcatLink.href = subcat.path;
      subcatLink.className = 'btn btn-sm btn-outline-primary';
      
      const subcatIcon = document.createElement('i');
      subcatIcon.className = 'fas fa-folder-open fa-fw';
      subcatLink.appendChild(subcatIcon);
      
      subcatLink.appendChild(document.createTextNode(' ' + subcat.name));
      
      subcategoriesList.appendChild(subcatLink);
    });
  }

  // Initialize when DOM is ready
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        renderCategories();
        renderSubcategories();
      });
    } else {
      renderCategories();
      renderSubcategories();
    }
  }

  init();
})();

