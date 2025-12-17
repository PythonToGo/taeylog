(function() {
  let currentSlide = 0;
  let slides, totalSlides, wrapper, indicatorsContainer, prevBtn, nextBtn;

  function initSlider() {
    slides = document.querySelectorAll('.about-slide');
    totalSlides = slides.length;
    wrapper = document.getElementById('sliderWrapper');
    indicatorsContainer = document.getElementById('sliderIndicators');
    prevBtn = document.querySelector('.about-slider-nav.prev');
    nextBtn = document.querySelector('.about-slider-nav.next');

    if (!slides.length || !wrapper || !indicatorsContainer || !prevBtn || !nextBtn) {
      console.error('Slider elements not found');
      return;
    }

    // Create indicators
    indicatorsContainer.innerHTML = '';
    slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = 'about-slider-indicator' + (index === 0 ? ' active' : '');
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
      indicator.onclick = () => goToSlide(index);
      indicatorsContainer.appendChild(indicator);
    });

    // Initialize first slide
    updateSlider();
  }

  function updateSlider() {
    if (!wrapper || !slides) return;
    
    wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active slide
    slides.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
    
    // Update indicators
    const indicators = document.querySelectorAll('.about-slider-indicator');
    indicators.forEach((indicator, index) => {
      if (index === currentSlide) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
    
    // Update button states
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
  }

  function changeSlide(direction) {
    const newSlide = currentSlide + direction;
    if (newSlide >= 0 && newSlide < totalSlides) {
      currentSlide = newSlide;
      updateSlider();
    }
  }

  function goToSlide(index) {
    if (index >= 0 && index < totalSlides) {
      currentSlide = index;
      updateSlider();
    }
  }

  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSlider();
    });
  } else {
    // DOM already loaded
    initSlider();
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      changeSlide(-1);
    } else if (e.key === 'ArrowRight') {
      changeSlide(1);
    }
  });

  // Touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  document.addEventListener('touchstart', (e) => {
    if (e.target.closest('.about-slider-container')) {
      touchStartX = e.changedTouches[0].screenX;
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (e.target.closest('.about-slider-container')) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        changeSlide(1);
      } else {
        // Swipe right - previous slide
        changeSlide(-1);
      }
    }
  }

  // Make functions globally available
  window.changeSlide = changeSlide;
  window.goToSlide = goToSlide;
})();

