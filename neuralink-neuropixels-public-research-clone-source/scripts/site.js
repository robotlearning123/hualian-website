document.querySelectorAll('[data-dismiss]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector(button.dataset.dismiss)?.setAttribute('hidden', '');
  });
});

document.querySelectorAll('[data-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.querySelector(button.dataset.toggle);
    if (!target) return;
    const willOpen = target.hasAttribute('hidden');
    target.toggleAttribute('hidden');
    button.setAttribute('aria-expanded', String(willOpen));
  });
});

const pioneerData = [
  {
    quote: '"It\'s given me the ability to do things on my own again"',
    name: 'Noland',
    condition: 'Spinal cord injury',
    date: 'Jan. 2024'
  },
  {
    quote: '"It allows me to be creative"',
    name: 'Alex',
    condition: 'Spinal cord injury',
    date: 'Jul. 2024'
  },
  {
    quote: '"I wrote this with my brain!"',
    name: 'Brad',
    condition: 'Amyotrophic lateral sclerosis',
    date: 'Nov. 2024'
  },
  {
    quote: '"Game changer"',
    name: 'RJ',
    condition: 'Spinal cord injury',
    date: 'Apr. 2025'
  },
  {
    quote: '"It gives me the ability to keep working"',
    name: 'Mike',
    condition: 'Amyotrophic lateral sclerosis',
    date: 'Feb. 2025'
  }
];

document.querySelectorAll('[data-pioneer-carousel]').forEach((carousel) => {
  let index = 0;
  const quote = carousel.querySelector('[data-pioneer-quote]');
  const name = carousel.querySelector('[data-pioneer-name]');
  const condition = carousel.querySelector('[data-pioneer-condition]');
  const date = carousel.querySelector('[data-pioneer-date]');
  const bars = [...carousel.querySelectorAll('[data-pioneer-bar]')];

  const render = () => {
    const item = pioneerData[index];
    quote.textContent = item.quote;
    name.textContent = item.name;
    condition.textContent = item.condition;
    date.textContent = item.date;
    bars.forEach((bar, barIndex) => {
      bar.classList.toggle('is-active', barIndex === index);
    });
  };

  carousel.querySelectorAll('[data-pioneer-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const direction = Number(button.dataset.pioneerStep);
      index = (index + direction + pioneerData.length) % pioneerData.length;
      render();
    });
  });
});

document.querySelectorAll('[data-skip-target]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.dataset.skipTarget);
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus();
  });
});
