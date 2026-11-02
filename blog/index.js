(function () {
  const posts = [...document.querySelectorAll('.blog-entry')];
  const topicButtons = [...document.querySelectorAll('[data-topic-filter]')];
  const yearButtons = [...document.querySelectorAll('[data-year-filter]')];
  let topic = 'All';
  let year = 'All';

  function update() {
    posts.forEach(post => {
      const matchesTopic = topic === 'All' || post.dataset.topic === topic;
      const matchesYear = year === 'All' || post.dataset.year === year;
      post.hidden = !(matchesTopic && matchesYear);
    });
  }

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
})();
