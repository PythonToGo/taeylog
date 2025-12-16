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
            <span class="badge bg-primary me-1" style="background-color: #007bff !important; color: white; padding: 0.35em 0.65em; border-radius: 0.25rem;">{{ tag }}</span>
          {% endfor %}
        </div>
        {% endif %}
        {% if project.badge %}
        <div class="mb-2">
          <span class="badge bg-info" style="background-color: #17a2b8 !important; color: white; padding: 0.35em 0.65em; border-radius: 0.25rem;">{{ project.badge }}</span>
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

<script src="{{ '/assets/js/projects-filter.js' | relative_url }}" defer></script>
