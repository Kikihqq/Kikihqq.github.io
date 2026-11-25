(function () {
  const posts = [...document.querySelectorAll('.blog-entry')];
  const topicButtons = [...document.querySelectorAll('[data-topic-filter]')];
  const yearButtons = [...document.querySelectorAll('[data-year-filter]')];
  const noteButtons = [...document.querySelectorAll('[data-note-filter]')];
  let noteType = 'All';
  let topic = 'All';
  let year = 'All';

  // Read the generated article metadata so the calendar stays in sync with builds.
  const byDate = new Map();
  posts.forEach(post => {
    const date = post.querySelector('time').dateTime;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(post.querySelector('h2 a'));
  });
  const dates = [...byDate.keys()].sort();
  const months = [...new Set(dates.map(date => date.slice(0, 7)))];
  if (months.length) {
    let monthIndex = months.length - 1;
    let selected = dates[dates.length - 1];
    const calendar = document.createElement('section');
    calendar.className = 'publication-calendar';
    calendar.setAttribute('aria-label', 'Publication calendar');
    calendar.innerHTML = `<div class="calendar-month"><div class="calendar-heading"><div><p class="calendar-eyebrow">PUBLICATION CALENDAR</p><h2 id="calendarMonth"></h2></div><div class="calendar-navigation"><button type="button" data-prev-month aria-label="Previous month with posts">←</button><button type="button" data-next-month aria-label="Next month with posts">→</button></div></div><div class="calendar-week" aria-hidden="true">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-days" aria-labelledby="calendarMonth"></div><p class="calendar-legend">Pink circles mark publishing days · larger circles mean more posts.</p></div><div class="calendar-selection" aria-live="polite" aria-atomic="true"></div>`;
    document.querySelector('.blog-filters').before(calendar);
    const grid = calendar.querySelector('.calendar-days');
    const detail = calendar.querySelector('.calendar-selection');
    const prev = calendar.querySelector('[data-prev-month]');
    const next = calendar.querySelector('[data-next-month]');
    let overviewYear = Number(selected.slice(0,4));
    const firstYear = Number(dates[0].slice(0,4));
    const lastYear = Number(dates[dates.length-1].slice(0,4));
    const right = document.createElement('div');
    right.className = 'calendar-right';
    const overview = document.createElement('section');
    overview.className = 'calendar-overview';
    overview.setAttribute('aria-label', 'Yearly publication activity');
    right.append(overview, detail);
    calendar.append(right);
    function renderYear() {
      overview.innerHTML = `<div class="calendar-heading"><div><p class="calendar-eyebrow">YEAR IN NOTES</p><h2>${overviewYear}</h2></div><div class="calendar-navigation"><button type="button" data-year-prev aria-label="Previous year">←</button><button type="button" data-year-next aria-label="Next year">→</button></div></div><div class="activity-scroll" tabindex="0" role="region" aria-label="Yearly publication heatmap"><div class="activity-months"></div><div class="activity-grid"></div></div><p class="activity-caption"></p>`;
      const start = new Date(Date.UTC(overviewYear,0,1));
      const offset = (start.getUTCDay()+6)%7;
      const totalDays = (Date.UTC(overviewYear+1,0,1)-start.getTime())/86400000;
      const weeks = Math.ceil((offset+totalDays)/7);
      const heatmap = overview.querySelector('.activity-grid');
      const labels = overview.querySelector('.activity-months');
      heatmap.style.setProperty('--weeks',weeks);
      labels.style.setProperty('--weeks',weeks);
      for(let m=0;m<12;m++) {
        const label = document.createElement('span');
        label.textContent = new Date(overviewYear,m,1).toLocaleDateString('en-US',{month:'short'});
        label.style.gridColumn = `${Math.floor((offset+(Date.UTC(overviewYear,m,1)-start.getTime())/86400000)/7)+1} / span 4`;
        labels.append(label);
      }
      let total = 0;
      for(let i=0;i<weeks*7;i++) {
        const valid = i>=offset && i<offset+totalDays;
        const date = new Date(start.getTime()+(i-offset)*86400000).toISOString().slice(0,10);
        const count = valid ? (byDate.get(date)?.length || 0) : 0;
        total += count;
        const cell = document.createElement(count ? 'button' : 'span');
        cell.className = 'activity-cell';
        cell.dataset.level = Math.min(count,5);
        if (!valid) cell.style.visibility = 'hidden';
        else cell.title = `${date}: ${count} posts`;
        if(count) {
          cell.type = 'button';
          cell.dataset.date = date;
          cell.setAttribute('aria-label',`${date}: ${count} posts`);
          cell.setAttribute('aria-pressed',String(date===selected));
          cell.addEventListener('click',()=> { selected=date; monthIndex=months.indexOf(date.slice(0,7)); renderMonth(); });
        }
        heatmap.append(cell);
      }
      overview.querySelector('.activity-caption').textContent = `${total} posts in ${overviewYear} · Mon–Sun, top to bottom · Deeper pink = more posts`;
      const previous = overview.querySelector('[data-year-prev]');
      const following = overview.querySelector('[data-year-next]');
      previous.disabled = overviewYear<=firstYear;
      following.disabled = overviewYear>=lastYear;
      previous.addEventListener('click',()=> {overviewYear--;renderYear();});
      following.addEventListener('click',()=> {overviewYear++;renderYear();});
    }
    function selectDay(date) {
      selected = date;
      grid.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.date === date)));
      detail.replaceChildren();
      const label = document.createElement('p');
      label.className = 'calendar-eyebrow';
      label.textContent = 'ON THIS DAY';
      const heading = document.createElement('h3');
      const [y,m,d] = date.split('-').map(Number);
      heading.textContent = new Date(y,m-1,d).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
      const count = document.createElement('p');
      count.className = 'calendar-count';
      count.textContent = `${byDate.get(date).length} post${byDate.get(date).length === 1 ? '' : 's'}`;
      const list = document.createElement('ul');
      byDate.get(date).forEach(source => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.getAttribute('href');
        link.textContent = source.textContent;
        item.append(link);
        list.append(item);
      });
      const summary = document.createElement('div');
      summary.className = 'calendar-day-summary';
      summary.append(label, heading, count);
      detail.append(summary, list);
      overviewYear = Number(date.slice(0,4));
      renderYear();
    }
    function renderMonth() {
      const month = months[monthIndex];
      const [y,m] = month.split('-').map(Number);
      calendar.querySelector('#calendarMonth').textContent = new Date(y,m-1,1).toLocaleDateString('en-US', {month:'long',year:'numeric'});
      prev.disabled = monthIndex === 0;
      next.disabled = monthIndex === months.length - 1;
      grid.replaceChildren();
      const offset = (new Date(y,m-1,1).getDay()+6)%7;
      for (let i=0;i<offset;i++) grid.append(document.createElement('span'));
      for (let d=1;d<=new Date(y,m,0).getDate();d++) {
        const date = `${month}-${String(d).padStart(2,'0')}`;
        const count = byDate.get(date)?.length || 0;
        const cell = document.createElement(count ? 'button' : 'span');
        cell.className = 'calendar-day';
        cell.textContent = d;
        if (count) {
          cell.type = 'button';
          cell.dataset.date = date;
          cell.style.setProperty('--circle-size', `${22 + (Math.min(count,5)-1)*2}px`);
          cell.setAttribute('aria-label', `${date}: ${count} post${count === 1 ? '' : 's'}`);
          cell.title = `${count} post${count === 1 ? '' : 's'}`;
          cell.addEventListener('click', () => selectDay(date));
        }
        grid.append(cell);
      }
      if (!selected.startsWith(month)) selected = dates.filter(date => date.startsWith(month)).pop();
      selectDay(selected);
    }
    prev.addEventListener('click', () => { if (monthIndex>0) { monthIndex--; renderMonth(); } });
    next.addEventListener('click', () => { if (monthIndex<months.length-1) { monthIndex++; renderMonth(); } });
    renderMonth();
  }

  function update() {
    posts.forEach(post => {
      const matchesTopic = topic === 'All' || post.dataset.topic === topic;
      const matchesYear = year === 'All' || post.dataset.year === year;
      const matchesNote = noteType === 'All' || post.dataset.noteType === noteType;
      post.hidden = !(matchesTopic && matchesYear && matchesNote);
    });
    document.getElementById('blogEmpty').hidden = posts.some(post => !post.hidden);
    document.querySelectorAll('.filter-button').forEach(button => {
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    });
  }

  noteButtons.forEach(button => button.addEventListener('click', () => {
    noteType = button.dataset.noteFilter;
    noteButtons.forEach(item => item.classList.toggle('active', item === button));
    update();
  }));

  topicButtons.forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.topicFilter;
    topicButtons.forEach(item => item.classList.toggle('active', item === button));
    update();
  }));
  yearButtons.forEach(button => button.addEventListener('click', () => {
    year = button.dataset.yearFilter;
    yearButtons.forEach(item => item.classList.toggle('active', item === button));
    update();
  }));
  update();
})();
