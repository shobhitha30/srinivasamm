const jsdom = require('jsdom');
const { JSDOM } = jsdom;
async function scrape() {
  const res = await fetch('https://srinivasam.org/');
  const html = await res.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const faqs = [];
  document.querySelectorAll('h3:has(button)').forEach(h3 => {
    const q = h3.textContent;
    const btn = h3.querySelector('button');
    const contentId = btn.getAttribute('aria-controls');
    const contentDiv = document.getElementById(contentId);
    if(contentDiv) {
      faqs.push({ q, a: contentDiv.textContent || contentDiv.innerHTML });
    }
  });
  console.log('FAQs:', JSON.stringify(faqs, null, 2));

  const trustees = [];
  const trusteeImages = document.querySelectorAll('img[alt="Giri Devanur"], img[alt="Nivedita Candade"], img[alt="Nagesh Srini"]');
  trusteeImages.forEach(img => {
    const container = img.closest('.hover-lift');
    if(container) {
      const name = container.querySelector('h3').textContent;
      const role = Array.from(container.querySelectorAll('span')).map(s => s.textContent).join(', ');
      trustees.push({ name, role, image: img.src });
    }
  });
  console.log('Trustees:', JSON.stringify(trustees, null, 2));

  const res2 = await fetch('https://srinivasam.org/blogs');
  const html2 = await res2.text();
  const dom2 = new JSDOM(html2);
  const doc2 = dom2.window.document;
  
  const blogs = [];
  doc2.querySelectorAll('a[href^="/blogs/"]').forEach(a => {
    const titleEl = a.querySelector('h2, h3');
    if(titleEl) {
      const title = titleEl.textContent;
      const img = a.querySelector('img');
      const desc = a.querySelector('p')?.textContent || '';
      const date = a.querySelector('time, .text-sm')?.textContent || '';
      // We only want the unique ones, and not double counting
      if (!blogs.some(b => b.link === a.href)) {
        blogs.push({ title, link: a.href, image: img?.src, desc, date });
      }
    }
  });
  console.log('Blogs:', JSON.stringify(blogs, null, 2));
}
scrape();
