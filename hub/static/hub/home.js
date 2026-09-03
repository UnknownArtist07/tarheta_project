function initNav() {
	const toggle = document.getElementById('navToggle');
	const links = document.getElementById('navLinks');
	const scrim = document.getElementById('navScrim');
	if (!toggle || !links || !scrim) return;
	const close = () => { toggle.classList.remove('open'); links.classList.remove('open'); scrim.classList.remove('open'); };
	toggle.addEventListener('click', () => { const opening = !toggle.classList.contains('open'); toggle.classList.toggle('open', opening); links.classList.toggle('open', opening); scrim.classList.toggle('open', opening); });
	scrim.addEventListener('click', close);
	links.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
}

function initReveal() {
	const targets = document.querySelectorAll('.reveal, .reveal-scale');
	if (!('IntersectionObserver' in window)) { targets.forEach(target => target.classList.add('visible')); return; }
	const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.15 });
	targets.forEach(target => observer.observe(target));
}

function animateCount(element, target, duration) {
	const start = performance.now();
	const suffix = element.dataset.suffix || '';
	function step(now) { const progress = Math.min((now - start) / duration, 1); const eased = 1 - Math.pow(1 - progress, 3); element.textContent = Math.round(eased * target).toLocaleString() + suffix; if (progress < 1) requestAnimationFrame(step); }
	requestAnimationFrame(step);
}

function initStats() {
	const stats = document.querySelectorAll('.stat-num[data-target]');
	if (!stats.length || !('IntersectionObserver' in window)) return;
	const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { animateCount(entry.target, parseInt(entry.target.dataset.target, 10), 1400); observer.unobserve(entry.target); } }), { threshold: 0.5 });
	stats.forEach(stat => observer.observe(stat));
}

function initAccordion() {
	document.querySelectorAll('.acc-item').forEach(item => {
		const trigger = item.querySelector('.acc-trigger');
		const panel = item.querySelector('.acc-panel');
		trigger.addEventListener('click', () => { const opening = !item.classList.contains('open'); document.querySelectorAll('.acc-item.open').forEach(other => { if (other !== item) { other.classList.remove('open'); other.querySelector('.acc-panel').style.maxHeight = null; } }); item.classList.toggle('open', opening); panel.style.maxHeight = opening ? panel.scrollHeight + 'px' : null; });
	});
}

function initStickyNav() {
	const bar = document.getElementById('topbar');
	if (bar) window.addEventListener('scroll', () => bar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
}

function initToTop() {
	const button = document.getElementById('toTop');
	if (!button) return;
	window.addEventListener('scroll', () => button.classList.toggle('show', window.scrollY > 500), { passive: true });
	button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

document.addEventListener('DOMContentLoaded', () => { initNav(); initStickyNav(); initReveal(); initStats(); initAccordion(); initToTop(); });
