(() => {
  function typesetMath(element) {
    // Match existing site scripts' MathJax behavior
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([element]).catch(function (err) {
        console.error('MathJax rendering error:', err);
      });
    } else if (window.MathJax && window.MathJax.Hub) {
      window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub, element]);
    }
  }

  function normalize(text) {
    return (text ?? '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('data-')) node.setAttribute(k, v);
      else if (k === 'type') node.type = v;
      else if (k === 'value') node.value = v;
      else if (k === 'disabled') node.disabled = Boolean(v);
      else if (k === 'tabindex') node.tabIndex = Number(v);
      else node.setAttribute(k, v);
    }
    for (const child of children) node.appendChild(child);
    return node;
  }

  function buildQuiz(widget) {
    const dataScript = widget.querySelector(
      'script[type="application/json"][data-quiz-data]'
    );
    if (!dataScript) return;

    let items;
    try {
      items = JSON.parse(dataScript.textContent || '[]');
    } catch {
      return;
    }

    if (!Array.isArray(items) || items.length === 0) return;

    const title = widget.getAttribute('data-quiz-title') || 'Quiz';
    widget.setAttribute('tabindex', '0');

    const titleEl = el('p', { class: 'quiz-title', text: title });
    const progressEl = el('div', { class: 'quiz-progress', text: '' });

    const header = el('div', { class: 'quiz-header' }, [titleEl, progressEl]);

    const questionEl = el('p', { class: 'quiz-question', text: '' });
    const inputEl = el('input', {
      class: 'quiz-input',
      type: 'text',
      value: '',
      placeholder: 'Input',
      autocomplete: 'off',
      spellcheck: 'false',
    });

    const checkBtn = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: 'Check the answer',
    });
    const revealBtn = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: 'View the answer',
    });

    const prevBtn = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: '← Previous',
    });
    const nextBtn = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: 'Next →',
    });

    const prevBtnBack = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: '← Previous',
    });
    const backToQuestionBtn = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: 'Back to the question',
    });
    const nextBtnBack = el('button', {
      class: 'quiz-btn',
      type: 'button',
      text: 'Next →',
    });

    const feedbackEl = el('div', { class: 'quiz-feedback', text: '' });

    const answerTitleEl = el('div', {
      class: 'quiz-solution-title',
      text: 'Answer',
    });
    const answerEl = el('pre', { class: 'quiz-answer' });
    const explainTitleEl = el('div', {
      class: 'quiz-solution-title',
      text: 'Explanation',
    });
    const explainEl = el('pre', { class: 'quiz-explain' });

    const hintEl = el('div', {
      class: 'quiz-hint',
      text: 'Enter(Check), Shift+Enter(Full Answer), ←/→(Previous/Next)',
    });

    const inputRow = el('div', { class: 'quiz-input-row' }, [
      inputEl,
      checkBtn,
      revealBtn,
    ]);
    const actions = el('div', { class: 'quiz-actions' }, [
      el('div', { class: 'quiz-actions-left' }, [prevBtn, nextBtn]),
    ]);

    const front = el('div', { class: 'quiz-face quiz-face-front' }, [
      questionEl,
      inputRow,
      feedbackEl,
      actions,
      hintEl,
    ]);

    const backActions = el('div', { class: 'quiz-actions quiz-actions-back' }, [
      el('div', { class: 'quiz-actions-left' }, [
        prevBtnBack,
        backToQuestionBtn,
        nextBtnBack,
      ]),
    ]);

    const back = el('div', { class: 'quiz-face quiz-face-back' }, [
      answerTitleEl,
      answerEl,
      explainTitleEl,
      explainEl,
      backActions,
    ]);

    const inner = el('div', { class: 'quiz-card-inner' }, [front, back]);
    const card = el('div', { class: 'quiz-card' }, [inner]);

    // Clear existing content except the JSON script
    widget.innerHTML = '';
    widget.appendChild(dataScript);
    widget.appendChild(header);
    widget.appendChild(card);

    let idx = 0;
    let revealed = false;

    function getItem(i) {
      const item = items[i] || {};
      const q = item.q ?? '';
      const ans = item.ans ?? '';
      const explain = item.explain ?? '';
      const accepted = Array.isArray(item.accepted) ? item.accepted : null;
      return { q, ans, explain, accepted };
    }

    function setRevealed(nextRevealed) {
      revealed = nextRevealed;
      card.classList.toggle('is-revealed', revealed);
      if (revealed) {
        // Ensure math is rendered after the answer becomes visible
        requestAnimationFrame(() => typesetMath(widget));
      }
    }

    function setFeedback(kind, text) {
      feedbackEl.classList.remove('ok', 'bad');
      if (!text) {
        feedbackEl.textContent = '';
        return;
      }
      feedbackEl.textContent = text;
      if (kind) feedbackEl.classList.add(kind);
    }

    function render() {
      const { q, ans, explain } = getItem(idx);
      progressEl.textContent = `${idx + 1} / ${items.length}`;
      questionEl.textContent = q;
      answerEl.textContent = ans;

      const hasExplain = Boolean(explain);
      explainTitleEl.style.display = hasExplain ? '' : 'none';
      explainEl.style.display = hasExplain ? '' : 'none';
      explainEl.textContent = hasExplain ? explain : '';

      inputEl.value = '';
      setFeedback(null, '');
      setRevealed(false);
      const isFirst = idx === 0;
      const isLast = idx === items.length - 1;
      prevBtn.disabled = isFirst;
      prevBtnBack.disabled = isFirst;
      nextBtn.disabled = isLast;
      nextBtnBack.disabled = isLast;
      requestAnimationFrame(() => typesetMath(widget));
    }

    function check() {
      const { ans, accepted } = getItem(idx);
      const user = normalize(inputEl.value);
      if (!user) {
        setFeedback(
          null,
          'Please enter the answer or click "Answer" to check.'
        );
        return;
      }

      const answers = accepted && accepted.length ? accepted : [ans];
      const ok = answers.some((candidate) => normalize(candidate) === user);

      if (ok) setFeedback('ok', 'Correct answer.');
      else
        setFeedback(
          'bad',
          'Incorrect answer. Please check the answer and explanation.'
        );

      setRevealed(true);
    }

    function reveal() {
      setFeedback(null, '');
      setRevealed(true);
    }

    function next() {
      if (idx < items.length - 1) {
        idx += 1;
        render();
        inputEl.focus();
      }
    }

    function prev() {
      if (idx > 0) {
        idx -= 1;
        render();
        inputEl.focus();
      }
    }

    checkBtn.addEventListener('click', check);
    revealBtn.addEventListener('click', reveal);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    nextBtnBack.addEventListener('click', next);
    prevBtnBack.addEventListener('click', prev);
    backToQuestionBtn.addEventListener('click', () => {
      setRevealed(false);
      inputEl.focus();
    });

    // When the solution side is shown, clicking it flips back to the question
    back.addEventListener('click', (e) => {
      if (!revealed) return;
      const target = e.target;
      if (target && target.closest && target.closest('button')) return;
      setRevealed(false);
      inputEl.focus();
    });

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        check();
      } else if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        reveal();
      }
    });

    widget.addEventListener('keydown', (e) => {
      const activeInside = widget.contains(document.activeElement);
      if (!activeInside) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    });

    render();
  }

  function init() {
    document.querySelectorAll('.quiz-widget').forEach((w) => buildQuiz(w));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
