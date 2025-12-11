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
  let retryCount = 0;
  const maxRetries = 50;
  let initialized = false;
  let eventListenerAttached = false;
  
  function initProjectFilters() {
    // 중복 실행 방지
    if (initialized) {
      return;
    }
    
    // Collect all unique tags from project cards
    const projectCards = document.querySelectorAll('.project-card');
    const tagMap = new Map(); // normalized tag -> original tag
    const filterContainer = document.getElementById('filter-buttons');
    
    // retry
    if (projectCards.length === 0 || !filterContainer) {
      retryCount++;
      if (retryCount < maxRetries) {
        setTimeout(initProjectFilters, 100);
        return;
      }
      if (!filterContainer) {
        return;
      }
    }
    
    // Prevent duplicate creation if filter buttons already exist
    const existingButtons = filterContainer.querySelectorAll('.filter-btn');
    if (existingButtons.length > 1) {
      initialized = true;
      attachEventListener();
      return;
    }
    
    projectCards.forEach(card => {
      const normalizedTags = card.getAttribute('data-tags');
      const originalTags = card.getAttribute('data-tags-original');
      if (normalizedTags && originalTags) {
        const normalizedArray = normalizedTags.split(',');
        const originalArray = originalTags.split(',');
        normalizedArray.forEach((normTag, index) => {
          const trimmed = normTag.trim();
          if (trimmed && !tagMap.has(trimmed)) {
            tagMap.set(trimmed, originalArray[index] ? originalArray[index].trim() : trimmed);
          }
        });
      }
    });
    
    // Create filter buttons for each tag
    const sortedTags = Array.from(tagMap.keys()).sort();
    
    sortedTags.forEach(normalizedTag => {
      const button = document.createElement('button');
      button.className = 'btn btn-sm btn-outline-primary filter-btn';
      button.setAttribute('data-filter', normalizedTag);
      button.style.margin = '2px';
      button.textContent = tagMap.get(normalizedTag);
      filterContainer.appendChild(button);
    });
    
    // Use event delegation so that dynamically added buttons also work
    attachEventListener();
    
    initialized = true;
  }
  
  function attachEventListener() {
    if (eventListenerAttached) {
      return;
    }
    
    const filterContainer = document.getElementById('filter-buttons');
    if (!filterContainer) {
      return;
    }
    
    // Event delegation
    filterContainer.addEventListener('click', function(e) {
      const target = e.target;
      if (target && target.classList.contains('filter-btn')) {
        const filter = target.getAttribute('data-filter');
        const allProjectCards = document.querySelectorAll('.project-card');
        const allFilterButtons = document.querySelectorAll('.filter-btn');
        
        // Update active button
        allFilterButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-outline-primary');
        });
        target.classList.add('active');
        target.classList.remove('btn-outline-primary');
        target.classList.add('btn-primary');
        
        // Filter cards with animation
        allProjectCards.forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
            setTimeout(() => {
              card.style.opacity = '1';
            }, 10);
          } else {
            const cardTags = card.getAttribute('data-tags');
            if (cardTags && cardTags.split(',').map(t => t.trim()).includes(filter)) {
              card.style.display = '';
              setTimeout(() => {
                card.style.opacity = '1';
              }, 10);
            } else {
              card.style.opacity = '0';
              setTimeout(() => {
                card.style.display = 'none';
              }, 200);
            }
          }
        });
      }
    });
    
    eventListenerAttached = true;
  }
  
  function startInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initProjectFilters, 200);
      });
    } else if (document.readyState === 'interactive') {
      setTimeout(initProjectFilters, 200);
    } else {

      setTimeout(initProjectFilters, 200);
    }
    
    window.addEventListener('load', function() {
      setTimeout(initProjectFilters, 100);
    });
  }
  
  startInit();
})();
</script>
