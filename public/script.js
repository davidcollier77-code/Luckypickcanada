document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('oracle-form');
  const input = document.getElementById('oracle-input');
  const submitBtn = document.getElementById('oracle-submit');
  const display = document.getElementById('oracle-display');
  const sessionLog = document.getElementById('session-log');
  const auroraGlow = document.getElementById('aurora-glow');

  let cooldownTimer = null;
  const COOLDOWN_SECONDS = 10;
  checkCooldownStatus();

  function checkCooldownStatus() {
    const lastRequest = localStorage.getItem('lastFortuneRequestTime');
    if (lastRequest) {
      const elapsed = (Date.now() - parseInt(lastRequest, 10)) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        startCooldown(Math.ceil(COOLDOWN_SECONDS - elapsed));
      }
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function resetCooldown() {
    if (cooldownTimer) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
    submitBtn.disabled = false;
    input.disabled = false;
    submitBtn.textContent = 'Seek Fortune';
  }

  function startCooldown(overrideSeconds) {
    let secondsLeft = overrideSeconds || COOLDOWN_SECONDS;
    if (!overrideSeconds) {
      localStorage.setItem('lastFortuneRequestTime', Date.now().toString());
    }
    submitBtn.disabled = true;
    input.disabled = true;

    const updateBtnText = () => {
      submitBtn.textContent = `Wait (${secondsLeft}s)`;
    };

    updateBtnText();

    cooldownTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(cooldownTimer);
        submitBtn.disabled = false;
        input.disabled = false;
        submitBtn.textContent = 'Seek Fortune';
        input.focus();
      } else {
        updateBtnText();
      }
    }, 1000);
  }

  function appendToLog(question, answer) {
    const li = document.createElement('li');

    const qDiv = document.createElement('div');
    qDiv.className = 'log-q';
    qDiv.textContent = `Q: ${question}`;
    qDiv.innerHTML = `Q: ${escapeHtml(question)}`;
    const aDiv = document.createElement('div');
    aDiv.className = 'log-a';
    aDiv.textContent = answer;
    aDiv.innerHTML = escapeHtml(answer);
    li.appendChild(qDiv);
    li.appendChild(aDiv);

    sessionLog.insertBefore(li, sessionLog.firstChild);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    // Start reading phase
    display.textContent = 'Reading the mists...';
    startCooldown();
    if (auroraGlow) {
      auroraGlow.classList.add('active');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('/api/oracle', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      clearTimeout(timeoutId);
      if (response.status === 429) {
        display.textContent = 'The mists are tired! Please wait a moment before asking again.';
        resetCooldown();
        if (auroraGlow) auroraGlow.classList.remove('active');
        return;
      }

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();

      if (data.error) {
        display.textContent = data.error;
      } else {
        resetCooldown();
        const fortune = data.fortune || "The mists remain clouded. Try again later.";
        display.textContent = fortune;
        appendToLog(question, fortune);
        input.value = '';
      }

    } catch (error) {
      console.error('Oracle fetch error:', error);
      if (error.name === 'AbortError') {
        display.textContent = "The connection to the ethereal realm was lost. Please try again.";
      } else {
        display.textContent = "The connection to the ethereal realm was lost. Please try again.";
      }
    }
      resetCooldown();
      if (auroraGlow) {
        auroraGlow.classList.remove('active');
      }
  });
});
