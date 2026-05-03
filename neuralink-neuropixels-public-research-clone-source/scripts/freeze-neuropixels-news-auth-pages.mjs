import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const inventoryPath = path.join(root, 'docs', 'reports', 'public-interaction-inventory.json');

const targets = [
  {
    slug: 'news',
    originalUrl: 'https://www.neuropixels.org/news',
    output: 'downloaded-sites/neuropixels/www.neuropixels.org/news.html',
    desktopShot: '/public-clone/sites/neuropixels/news/assets/desktop.png',
    mobileShot: '/public-clone/sites/neuropixels/news/assets/mobile.png',
  },
  {
    slug: 'news-categories-imec-news',
    originalUrl: 'https://www.neuropixels.org/news/categories/imec-news',
    output: 'downloaded-sites/neuropixels/www.neuropixels.org/news/categories/imec-news.html',
    desktopShot: '/public-clone/sites/neuropixels/news-categories-imec-news/assets/desktop.png',
    mobileShot: '/public-clone/sites/neuropixels/news-categories-imec-news/assets/mobile.png',
  },
  {
    slug: 'news-categories-publications',
    originalUrl: 'https://www.neuropixels.org/news/categories/publications',
    output: 'downloaded-sites/neuropixels/www.neuropixels.org/news/categories/publications.html',
    desktopShot: '/public-clone/sites/neuropixels/news-categories-publications/assets/desktop.png',
    mobileShot: '/public-clone/sites/neuropixels/news-categories-publications/assets/mobile.png',
  },
];

const htmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
const neuropixelsPages = inventory.pages
  .filter((page) => page.site === 'neuropixels')
  .sort((a, b) => a.slug.localeCompare(b.slug));

const branchLinks = neuropixelsPages.map((page) => {
  const href = encodeURI(`/${page.downloaded_path}`);
  return `          <li><a href="${htmlEscape(href)}">${htmlEscape(page.slug)}</a></li>`;
}).join('\n');

const renderPage = (target) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>News | Neuropixels</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${target.originalUrl}">
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #fff;
        font-family: Arial, Helvetica, sans-serif;
      }

      .auth-shot {
        position: relative;
        width: 100%;
        max-width: 1440px;
        margin: 0 auto;
      }

      .auth-shot img {
        display: block;
        width: 100%;
        height: auto;
      }

      .hit {
        position: absolute;
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: transparent;
        cursor: pointer;
        appearance: none;
      }

      .hit:focus-visible {
        outline: 2px solid #116dff;
        outline-offset: 2px;
      }

      .close-hit {
        left: 96.9%;
        top: 1.1%;
        width: 2.4%;
        height: 3.4%;
      }

      .login-hit {
        left: 53.8%;
        top: 38.5%;
        width: 4.9%;
        height: 2.7%;
      }

      .google-hit {
        left: 38.85%;
        top: 43.95%;
        width: 22.35%;
        height: 4.95%;
      }

      .facebook-hit {
        left: 38.85%;
        top: 50.35%;
        width: 22.35%;
        height: 5.05%;
      }

      .email-hit {
        left: 38.85%;
        top: 60.35%;
        width: 22.35%;
        height: 4.25%;
      }

      .profile-hit {
        left: 36.45%;
        top: 71.25%;
        width: 1.25%;
        height: 1.7%;
      }

      .read-more-hit {
        left: 58.0%;
        top: 71.25%;
        width: 5.7%;
        height: 2.5%;
      }

      .local-email-panel {
        position: fixed;
        inset: 0;
        display: none;
        place-items: center;
        background: rgba(255, 255, 255, 0.96);
        color: #111;
        z-index: 10;
      }

      .local-email-panel[data-open="true"] {
        display: grid;
      }

      .local-email-panel form {
        width: min(320px, calc(100vw - 48px));
        display: grid;
        gap: 14px;
        font-size: 16px;
      }

      .local-email-panel input,
      .local-email-panel button {
        min-height: 40px;
        font: inherit;
      }

      .visually-hidden-tree {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
      }

      @media (max-width: 700px) {
        .auth-shot {
          max-width: 390px;
        }

        .close-hit {
          left: 95.8%;
          top: 1.2%;
          width: 3.8%;
          height: 3.8%;
        }

        .login-hit {
          left: 54.5%;
          top: 45.6%;
          width: 13.4%;
          height: 2.8%;
        }

        .google-hit,
        .facebook-hit,
        .email-hit {
          left: 14.4%;
          width: 72%;
          height: 5.7%;
        }

        .google-hit {
          top: 52.1%;
        }

        .facebook-hit {
          top: 59.6%;
        }

        .email-hit {
          top: 71.3%;
        }

        .profile-hit {
          left: 7.4%;
          top: 84.45%;
          width: 4.2%;
          height: 2.2%;
        }

        .read-more-hit {
          left: 69.2%;
          top: 84.25%;
          width: 19.2%;
          height: 2.8%;
        }
      }
    </style>
  </head>
  <body data-original-public-url="${target.originalUrl}" data-public-clone-auth-fallback="neuropixels-news">
    <main class="auth-shot" aria-label="Sign Up">
      <picture>
        <source media="(max-width: 700px)" srcset="${target.mobileShot}">
        <img src="${target.desktopShot}" alt="News | Neuropixels Sign Up">
      </picture>

      <button class="hit close-hit" type="button" data-local-action="close">Close sign up</button>
      <button class="hit login-hit" type="button" data-local-action="login">Log In</button>
      <a class="hit google-hit" href="https://accounts.google.com/" rel="noopener">Sign up with Google</a>
      <a class="hit facebook-hit" href="https://www.facebook.com/" rel="noopener">Sign up with Facebook</a>
      <button class="hit email-hit" type="button" data-local-action="email">Sign up with email</button>
      <input class="hit profile-hit" type="checkbox" checked aria-label="Sign up to this site with a public profile">
      <a class="hit read-more-hit" href="https://support.wix.com/en/article/site-members-signing-up-and-logging-in-to-your-site" rel="noopener">Read more</a>

      <section class="local-email-panel" aria-label="Local email sign up" data-email-panel>
        <form action="#" data-public-clone-local-form="true">
          <label>
            Email
            <input type="email" name="email" autocomplete="email" value="">
          </label>
          <label>
            Password
            <input type="password" name="password" autocomplete="new-password" value="">
          </label>
          <button type="submit">Continue</button>
          <button type="button" data-local-action="email-close">Back</button>
        </form>
      </section>

      <nav class="visually-hidden-tree" aria-label="Neuropixels public branch map">
        <ol>
${branchLinks}
        </ol>
      </nav>
    </main>
    <script>
      (function () {
        var panel = document.querySelector('[data-email-panel]');
        document.addEventListener('click', function (event) {
          var action = event.target && event.target.getAttribute ? event.target.getAttribute('data-local-action') : '';
          if (!action) return;
          if (action === 'email') panel.setAttribute('data-open', 'true');
          if (action === 'email-close') panel.setAttribute('data-open', 'false');
          if (action === 'close' || action === 'login') document.body.setAttribute('data-last-local-action', action);
        });
        document.addEventListener('submit', function (event) {
          event.preventDefault();
          event.target.setAttribute('data-public-clone-submit-prevented', 'true');
        }, true);
      }());
    </script>
  </body>
</html>
`;

for (const target of targets) {
  const outputPath = path.join(root, target.output);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, renderPage(target));
  console.log(target.output);
}
