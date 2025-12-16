(function() {
  'use strict';
  
  let initialized = false;
  let buttonsCreated = false;
  let eventDelegationAttached = false;
  
  function normalizeTag(tag) {
    if (!tag) return '';
    return tag.replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase().trim();
  }
  
  function applyFilter(filter) {
    const allProjectCards = document.querySelectorAll('.project-card');
    const allFilterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active button
    allFilterButtons.forEach(function(btn) {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
      btn.style.cssText = 'margin: 2px; padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1.5; border-radius: 0.25rem; border: 1px solid #0d6efd; color: #0d6efd; background-color: transparent; cursor: pointer;';
    });
    
    const activeButton = Array.from(allFilterButtons).find(function(btn) {
      return btn.getAttribute('data-filter') === filter;
    });
    if (activeButton) {
      activeButton.classList.add('active', 'btn-primary');
      activeButton.classList.remove('btn-outline-primary');
      activeButton.style.cssText = 'margin: 2px; padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1.5; border-radius: 0.25rem; border: 1px solid #0d6efd; color: #fff; background-color: #0d6efd; cursor: pointer;';
    }
    
    // Filter cards with animation
    allProjectCards.forEach(function(card) {
      if (filter === 'all') {
        card.style.display = '';
        card.style.opacity = '1';
      } else {
        const cardTags = card.getAttribute('data-tags');
        if (cardTags) {
          const tagArray = cardTags.split(',').map(function(t) {
            return t.trim();
          });
          if (tagArray.indexOf(filter) !== -1) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.opacity = '0';
            setTimeout(function() {
              card.style.display = 'none';
            }, 200);
          }
        } else {
          card.style.opacity = '0';
          setTimeout(function() {
            card.style.display = 'none';
          }, 200);
        }
      }
    });
  }
  
  function createFilterButtons() {
    if (buttonsCreated) {
      return true;
    }
    
    const filterContainer = document.getElementById('filter-buttons');
    if (!filterContainer) {
      return false;
    }
    
    // Check if buttons already exist (except "All" button)
    const existingButtons = filterContainer.querySelectorAll('.filter-btn');
    if (existingButtons.length > 1) {
      buttonsCreated = true;
      return true;
    }
    
    const projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length === 0) {
      return false;
    }
    
    const tagMap = {};
    
    // Collect all unique tags
    projectCards.forEach(function(card) {
      const normalizedTags = card.getAttribute('data-tags');
      const originalTags = card.getAttribute('data-tags-original');
      if (normalizedTags && originalTags) {
        const normalizedArray = normalizedTags.split(',').map(function(t) {
          return t.trim();
        });
        const originalArray = originalTags.split(',').map(function(t) {
          return t.trim();
        });
        normalizedArray.forEach(function(normTag, index) {
          if (normTag && !tagMap.hasOwnProperty(normTag)) {
            tagMap[normTag] = originalArray[index] || normTag;
          }
        });
      }
    });
    
    // Create filter buttons
    const sortedTags = Object.keys(tagMap).sort();
    sortedTags.forEach(function(normalizedTag) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-sm btn-outline-primary filter-btn';
      button.setAttribute('data-filter', normalizedTag);
      button.style.cssText = 'margin: 2px; padding: 0.25rem 0.5rem; font-size: 0.875rem; line-height: 1.5; border-radius: 0.25rem; border: 1px solid #0d6efd; color: #0d6efd; background-color: transparent; cursor: pointer;';
      button.textContent = tagMap[normalizedTag];
      filterContainer.appendChild(button);
    });
    
    buttonsCreated = true;
    return true;
  }
  
  function attachEventListeners() {
    const filterContainer = document.getElementById('filter-buttons');
    if (!filterContainer) {
      return;
    }
    
    // Event delegation for filter buttons
    if (!eventDelegationAttached) {
      filterContainer.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.classList.contains('filter-btn')) {
          const filter = target.getAttribute('data-filter');
          if (filter) {
            applyFilter(filter);
          }
        }
      });
      eventDelegationAttached = true;
    }
    
    // Make badge tags clickable for filtering
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(function(card) {
      const badges = card.querySelectorAll('.badge-primary, .bg-primary');
      badges.forEach(function(badge) {
        if (!badge.hasAttribute('data-filter-attached')) {
          badge.style.cursor = 'pointer';
          badge.style.transition = 'opacity 0.2s';
          badge.setAttribute('data-filter-attached', 'true');
          badge.addEventListener('mouseenter', function() {
            this.style.opacity = '0.8';
          });
          badge.addEventListener('mouseleave', function() {
            this.style.opacity = '1';
          });
          badge.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tagText = this.textContent.trim();
            const normalizedTag = normalizeTag(tagText);
            
            // Find and click the corresponding filter button
            const allButtons = document.querySelectorAll('.filter-btn');
            let filterButton = null;
            for (let i = 0; i < allButtons.length; i++) {
              if (allButtons[i].getAttribute('data-filter') === normalizedTag) {
                filterButton = allButtons[i];
                break;
              }
            }
            if (filterButton) {
              filterButton.click();
            } else {
              applyFilter(normalizedTag);
            }
          });
        }
      });
    });
  }
  
  function initProjectFilters() {
    if (initialized) {
      return true;
    }
    
    const filterContainer = document.getElementById('filter-buttons');
    const projectCards = document.querySelectorAll('.project-card');
    
    if (!filterContainer || projectCards.length === 0) {
      return false;
    }
    
    const buttonsCreated = createFilterButtons();
    if (buttonsCreated) {
      attachEventListeners();
      initialized = true;
      return true;
    }
    
    return false;
  }
  
  // Initialize when DOM is ready
  function startInit() {
    let retryCount = 0;
    const maxRetries = 20;
    
    function tryInit() {
      if (initProjectFilters()) {
        return true;
      }
      
      retryCount++;
      if (retryCount < maxRetries) {
        setTimeout(tryInit, 200);
      }
      return false;
    }
    
    // Strategy 1: Try immediately
    tryInit();
    
    // Strategy 2: DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(tryInit, 100);
      });
    } else {
      setTimeout(tryInit, 100);
    }
    
    // Strategy 3: window.load
    window.addEventListener('load', function() {
      setTimeout(tryInit, 200);
    });
    
    // Strategy 4: MutationObserver
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(function() {
        if (!initialized) {
          tryInit();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(function() {
        observer.disconnect();
      }, 15000);
    }
    
    // Strategy 5: Final fallback
    setTimeout(function() {
      if (!initialized) {
        tryInit();
      }
    }, 2000);
  }
  
  startInit();
})();

