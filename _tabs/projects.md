---
layout: page
icon: fas fa-project-diagram
order: 2
---

## Projects

<!-- Tag Filter Buttons -->
<div class="mb-4" id="filter-buttons">
  <button class="btn btn-sm btn-primary filter-btn active" data-filter="all" style="margin: 2px;">
    All
  </button>
</div>

<!-- Project Cards -->
<div class="row row-cols-1 row-cols-md-2 mb-4" id="projects-container">
{% for project in site.data.projects %}
  {% assign project_tags = "" %}
  {% assign project_tags_original = "" %}
  {% if project.tags %}
    {% for tag in project.tags %}
      {% assign normalized_tag = tag | replace: ' ', '-' | replace: '/', '-' | downcase %}
      {% if project_tags == "" %}
        {% assign project_tags = normalized_tag %}
        {% assign project_tags_original = tag %}
      {% else %}
        {% assign project_tags = project_tags | append: ',' | append: normalized_tag %}
        {% assign project_tags_original = project_tags_original | append: ',' | append: tag %}
      {% endif %}
    {% endfor %}
  {% endif %}
  <div class="col mb-4 project-card" data-tags="{{ project_tags }}" data-tags-original="{{ project_tags_original }}">
    <div class="card h-100" style="background-color: #fff3e0; border: 1px solid #ff9800; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 4px 8px rgba(255,152,0,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">
          <i class="{{ project.icon }}"></i> {{ project.name }}
        </h5>
        <p class="card-text flex-grow-1">{{ project.description }}</p>
        {% if project.tags %}
        <div class="mb-2">
          {% for tag in project.tags %}
            <span class="badge badge-primary mr-1" style="background-color: #007bff; color: white;">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
        {% if project.badge %}
        <div class="mb-2">
          <span class="badge badge-info" style="background-color: #17a2b8; color: white;">{{ project.badge }}</span>
        </div>
        {% endif %}
        {% if project.period %}
        <small class="text-muted mb-2 d-block">{{ project.period }}</small>
        {% endif %}
        <div class="mt-auto">
          {% if project.github %}
          <a href="{{ project.github }}" class="btn btn-sm btn-outline-primary mr-2" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-github"></i> GitHub
          </a>
          {% endif %}
          {% if project.url %}
          <a href="{{ project.url }}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-external-link-alt"></i> Visit
          </a>
          {% endif %}
        </div>
      </div>
    </div>
  </div>
{% endfor %}
</div>

<script>
(function() {
  'use strict';
  
  let initialized = false;
  let buttonsCreated = false;
  let eventDelegationAttached = false;
  
  function normalizeTag(tag) {
    return tag.replace(/\s+/g, '-').replace(/\//g, '-').toLowerCase().trim();
  }
  
  function applyFilter(filter) {
    const allProjectCards = document.querySelectorAll('.project-card');
    const allFilterButtons = document.querySelectorAll('.filter-btn');
    
    // Update active button
    allFilterButtons.forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
    });
    
    const activeButton = Array.from(allFilterButtons).find(btn => 
      btn.getAttribute('data-filter') === filter
    );
    if (activeButton) {
      activeButton.classList.add('active', 'btn-primary');
      activeButton.classList.remove('btn-outline-primary');
    }
    
    // Filter cards with animation
    allProjectCards.forEach(card => {
      if (filter === 'all') {
        card.style.display = '';
        card.style.opacity = '1';
      } else {
        const cardTags = card.getAttribute('data-tags');
        if (cardTags) {
          const tagArray = cardTags.split(',').map(t => t.trim());
          if (tagArray.includes(filter)) {
            card.style.display = '';
            card.style.opacity = '1';
          } else {
            card.style.opacity = '0';
            setTimeout(() => {
              card.style.display = 'none';
            }, 200);
          }
        } else {
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      }
    });
  }
  
  function createFilterButtons() {
    if (buttonsCreated) {
      return;
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
    
    const tagMap = new Map();
    
    // Collect all unique tags
    projectCards.forEach(card => {
      const normalizedTags = card.getAttribute('data-tags');
      const originalTags = card.getAttribute('data-tags-original');
      if (normalizedTags && originalTags) {
        const normalizedArray = normalizedTags.split(',').map(t => t.trim());
        const originalArray = originalTags.split(',').map(t => t.trim());
        normalizedArray.forEach((normTag, index) => {
          if (normTag && !tagMap.has(normTag)) {
            tagMap.set(normTag, originalArray[index] || normTag);
          }
        });
      }
    });
    
    // Create filter buttons
    const sortedTags = Array.from(tagMap.keys()).sort();
    sortedTags.forEach(normalizedTag => {
      const button = document.createElement('button');
      button.className = 'btn btn-sm btn-outline-primary filter-btn';
      button.setAttribute('data-filter', normalizedTag);
      button.style.margin = '2px';
      button.textContent = tagMap.get(normalizedTag);
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
    
    // Event delegation for filter buttons (한 번만 등록)
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
    projectCards.forEach(card => {
      const badges = card.querySelectorAll('.badge-primary');
      badges.forEach(badge => {
        if (!badge.hasAttribute('data-filter-attached')) {
          badge.style.cursor = 'pointer';
          badge.setAttribute('data-filter-attached', 'true');
          badge.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const tagText = this.textContent.trim();
            const normalizedTag = normalizeTag(tagText);
            
            // Find and click the corresponding filter button
            const filterButton = Array.from(document.querySelectorAll('.filter-btn')).find(btn => 
              btn.getAttribute('data-filter') === normalizedTag
            );
            if (filterButton) {
              filterButton.click();
            } else {
              // 버튼이 아직 생성되지 않았으면 직접 필터 적용
              applyFilter(normalizedTag);
            }
          });
        }
      });
    });
  }
  
  function initProjectFilters() {
    if (initialized) {
      return;
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
  
  // 강력한 초기화 전략
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
    
    // Strategy 1: 즉시 시도
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
    
    // Strategy 5: 최종 fallback
    setTimeout(function() {
      if (!initialized) {
        tryInit();
      }
    }, 2000);
  }
  
  startInit();
})();
</script>
