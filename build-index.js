const fs = require('fs');
const path = require('path');

const root = __dirname;

function extractSection(content, id) {
  const re = new RegExp(`<section[^>]*id=["']${id}["'][\\s\\S]*?</section>`, 'i');
  const m = content.match(re);
  return m ? m[0] : '';
}

function extractStyles(content) {
  const styles = [];
  const re = /<style>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    styles.push(m[1].trim());
  }
  return styles.join('\n\n');
}

function extractScripts(content) {
  const scripts = [];
  const re = /<script>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    scripts.push(m[1].trim());
  }
  return scripts;
}

function extractDivById(content, id) {
  const startRe = new RegExp(`<div[^>]*id=["']${id}["'][^>]*>`, 'i');
  const startMatch = content.match(startRe);
  if (!startMatch) return '';
  const startIdx = content.indexOf(startMatch[0]);
  const tagRe = /<div[^>]*>|<\/div>/gi;
  tagRe.lastIndex = startIdx;
  let depth = 0;
  let match;
  while ((match = tagRe.exec(content)) !== null) {
    if (match[0].startsWith('</div')) {
      depth--;
      if (depth === 0) return content.slice(startIdx, tagRe.lastIndex);
    } else {
      depth++;
    }
  }
  return '';
}

/** Remove only the repeated per-section * reset and body boilerplate (not footer body). */
function stripSectionBoilerplate(css) {
  return css
    .replace(
      /\*\s*\{\s*margin:\s*0;\s*padding:\s*0;\s*box-sizing:\s*border-box;\s*\}/g,
      ''
    )
    .replace(
      /body\s*\{\s*background:\s*#[0-9A-Fa-f]{3,8};\s*font-family:\s*'Raleway',\s*sans-serif;[\s\S]*?-webkit-font-smoothing:\s*antialiased;\s*\}/g,
      ''
    )
    .replace(
      /body\s*\{\s*font-family:\s*'Raleway',\s*sans-serif;[\s\S]*?font-weight:\s*400;[\s\S]*?-webkit-font-smoothing:\s*antialiased;[\s\S]*?\}/g,
      ''
    );
}

function readFile(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

const hero = readFile('Hero.html');
const about = readFile('AboutMe.html');
const services = readFile('Skills&Services.html');
const experience = readFile('Experience.html');
const projects = readFile('Projects.html');
const education = readFile('Education.html');
const recognitions = readFile('Recommendations.html');
const funfacts = readFile('Fun Facts.html');
const contact = readFile('Contact.html');
const footer = readFile('Footer.html');

let heroSection = extractSection(hero, 'hero');
heroSection = heroSection.replace(
  /src="assets\/branding\/haiderali-hero\.png"/,
  'src="assets/images/haiderali.png"'
);
if (!heroSection.includes('data-fallbacks')) {
  heroSection = heroSection.replace(
    /class="profile-img"[^>]*>/,
    'class="profile-img" data-fallbacks="assets/branding/haiderali-about.png,assets/branding/haiderali-hero.png,assets/images/haiderali.svg">'
  );
}
heroSection = heroSection.replace('id="resumeBtn"', 'id="heroResumeBtn"');
heroSection = heroSection.replace('id="portraitWrapper"', 'id="heroPortraitWrapper"');

let aboutSection = extractSection(about, 'about');
aboutSection = aboutSection.replace('id="portraitWrapper"', 'id="aboutPortraitWrapper"');

const servicesSection = extractSection(services, 'services').replace(
  'id="resumeBtn"',
  'id="servicesResumeBtn"'
);
const serviceOverlay = extractDivById(services, 'serviceOverlay');
const experienceSection = extractSection(experience, 'experience');
const projectsSection = extractSection(projects, 'projects');
const projectModal = extractDivById(projects, 'projectModal');
const educationSection = extractSection(education, 'education');
const recognitionsSection = extractSection(recognitions, 'recognitions');
const funfactsSection = extractSection(funfacts, 'funfacts');
const contactSection = extractSection(contact, 'contact');

const globalNav = footer.match(/<nav id="globalNav">[\s\S]*?<\/nav>/)[0];
const sideNav = footer.match(/<nav class="side-nav"[\s\S]*?<\/nav>/)[0];
const socialFloat = footer.match(/<div class="social-float">[\s\S]*?<\/div>/)[0];
const siteFooter = footer.match(/<footer id="siteFooter">[\s\S]*?<\/footer>/)[0];

// CSS order: footer/nav first, then sections in page order
const sectionCss = [
  extractStyles(footer),
  extractStyles(hero),
  extractStyles(about),
  extractStyles(services),
  extractStyles(experience),
  extractStyles(projects),
  extractStyles(education),
  extractStyles(recognitions),
  extractStyles(funfacts),
  extractStyles(contact),
]
  .map(stripSectionBoilerplate)
  .join('\n\n');

const globalCss = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      background: #F4F6F9;
      font-family: 'Raleway', sans-serif;
      color: #101A31;
      line-height: 1.6;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      padding-top: 64px;
    }

    section[id] {
      scroll-margin-top: 72px;
    }

    .social-float a svg,
    .icon-circle svg,
    .footer-contact-icon svg,
    .nav-logo img {
      max-width: none;
    }

    #services .neural-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }

    #services {
      position: relative;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      body { padding-top: 56px; }
    }
`;

let heroScript = extractScripts(hero)[0]
  .replace(/portraitWrapper/g, 'heroPortraitWrapper')
  .replace(/getElementById\('resumeBtn'\)/g, "getElementById('heroResumeBtn')");

// Ensure hero image fallback chain runs in merged file
if (!heroScript.includes('data-fallbacks')) {
  heroScript = heroScript.replace(
    "window.addEventListener('load', function() {",
    `window.addEventListener('load', function() {
      document.querySelectorAll('.profile-img[data-fallbacks]').forEach(function(img) {
        var fallbacks = (img.getAttribute('data-fallbacks') || '').split(',');
        var idx = 0;
        img.addEventListener('error', function onErr() {
          if (idx < fallbacks.length) { img.src = fallbacks[idx++]; }
          else { img.removeEventListener('error', onErr); }
        });
      });`
  );
}

let aboutScript = extractScripts(about)[0].replace(/portraitWrapper/g, 'aboutPortraitWrapper');

const servicesScript = extractScripts(services)[0].replace(
  /getElementById\('resumeBtn'\)/g,
  "getElementById('servicesResumeBtn')"
);

let projectsScript = extractScripts(projects)[0].replace(
  'currentProjectsList = allProjects.filter(p => p.category === category);',
  `currentProjectsList = allProjects.filter(p => {
      if (category === "Real Estate & Construction") {
        return ["Real Estate", "Construction & Real Estate Development", "Hospitality & Entertainment"].includes(p.category);
      }
      if (category === "Business Services & Professional Networking") {
        return ["Business Services & Professional Networking", "Human Resources & Recruitment", "Accounting & Financial Services"].includes(p.category);
      }
      return p.category === category;
    });`
);

const experienceScript = extractScripts(experience)[0];
const educationScript = extractScripts(education)[0];
const recognitionsScript = extractScripts(recognitions)[0];
const funfactsScript = extractScripts(funfacts)[0];
const contactScript = extractScripts(contact)[0];
const footerScript = extractScripts(footer)[0];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>Haider Ali | Social Media & Performance Marketing Portfolio</title>
  <meta name="description" content="Haider Ali — Sr. Social Media Lead & Performance Marketer. Performance marketing, social media strategy, and data-driven growth." />
  <link rel="icon" href="assets/branding/favicon.png" type="image/png" />
  <link rel="icon" href="assets/branding/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>
  <style>
${globalCss}
${sectionCss}
  </style>
</head>
<body>

${globalNav}

${sideNav}

${socialFloat}

${heroSection}

${aboutSection}

${servicesSection}

${serviceOverlay}

${experienceSection}

${projectsSection}

${projectModal}

${educationSection}

${recognitionsSection}

${funfactsSection}

${contactSection}

${siteFooter}

<script>
  gsap.registerPlugin(ScrollTrigger);
</script>

<script>
${heroScript}
</script>

<script>
${aboutScript}
</script>

<script>
${servicesScript}
</script>

<script>
${experienceScript}
</script>

<script>
${projectsScript}
</script>

<script>
${educationScript}
</script>

<script>
${recognitionsScript}
</script>

<script>
${funfactsScript}
</script>

<script>
${contactScript}
</script>

<script>
${footerScript}
</script>

</body>
</html>
`;

fs.writeFileSync(path.join(root, 'index.html'), html, 'utf8');
const kb = (fs.statSync(path.join(root, 'index.html')).size / 1024).toFixed(1);
const hasNav = html.includes('#globalNav');
const hasSocial = html.includes('.social-float a');
console.log(`Created index.html — ${kb} KB | nav CSS: ${hasNav} | social CSS: ${hasSocial}`);
