#!/usr/bin/env python3
"""Emit public HTML, portfolio JSON, robots and sitemap. Not used at runtime."""
from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path("/workspace")
SITE = "https://dubanicreatives.tech"
PHONE_DISPLAY = "073 346 4805"
PHONE_INTL = "+27 73 346 4805"
WA = "https://wa.me/27733464805"

CLIENTS = [
    "FCI Community Housing Services",
    "Khayelitsha Community Trust",
    "KCT Mall",
    "CashWave",
    "Regimed Health",
    "Festa M",
    "Mellows Lounge",
    "Gugulethu Sports Council",
    "Makinzi Building Solutions",
    "Zuma&Malila Holdings",
    "JikaJika Media",
    "Time For Musique",
    "TAEI",
    "Val'z Boutique",
    "Asham Foto",
    "Alunje Carpentry",
    "Langa Life Bible Church",
    "Makaula Foundation",
]

NAV = [
    ("/portfolio.html", "Work", "work"),
    ("/services.html", "Services", "services"),
    ("/packages.html", "Packages", "packages"),
    ("/about.html", "About", "about"),
    ("/contact.html", "Contact", "contact"),
]

SAME_AS = [
    "https://www.behance.net/dubanicreatives1",
    "https://www.behance.net/DubaniCreatives",
    "https://www.linkedin.com/company/dubani-creatives",
    "https://www.instagram.com/dubanicreatives/",
    "https://www.facebook.com/dubanicreativespage/",
    "https://x.com/Dubanicreative2",
    "https://www.tiktok.com/@dubanicreatives",
]


def business_ld():
    return {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "Dubani Creatives",
        "url": SITE + "/",
        "image": SITE + "/images/og.jpg",
        "logo": SITE + "/images/dubanicreatives_logo.png",
        "telephone": "+27733464805",
        "email": "dubanicreatives@gmail.com",
        "description": "Cape Town graphic design studio led by Silulamele Dubani. Brand identity, print, social media and websites for South African organisations.",
        "foundingDate": "2020",
        "founder": {"@type": "Person", "name": "Silulamele Dubani"},
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Cape Town",
            "addressRegion": "Western Cape",
            "addressCountry": "ZA",
        },
        "areaServed": {"@type": "Country", "name": "South Africa"},
        "priceRange": "R4500+",
        "sameAs": SAME_AS,
    }


def head(title, description, path):
    url = SITE + path
    ld = json.dumps(business_ld(), ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#0c0d10">
  <meta name="geo.region" content="ZA-WC">
  <meta name="geo.placename" content="Cape Town">
  <meta property="og:site_name" content="Dubani Creatives">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{SITE}/images/og.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_ZA">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{SITE}/images/og.jpg">
  <link rel="icon" href="/images/favicon.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&amp;family=Syne:wght@600;700;800&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/css/site.css">
  <script type="application/ld+json">{ld}</script>
</head>
"""


def header(current):
    links = []
    for href, label, key in NAV:
        current_attr = ' aria-current="page"' if key == current else ""
        links.append(f'<a href="{href}"{current_attr}>{label}</a>')
    return f"""<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="header-bar">
    <a class="logo" href="/">
      <img src="/images/dubanicreatives_logo.png" alt="Dubani Creatives" width="1024" height="153">
    </a>
    <input class="nav-toggle" type="checkbox" id="nav-toggle" aria-controls="site-nav" aria-expanded="false">
    <label class="nav-burger" for="nav-toggle"><span class="burger-icon"></span><span class="sr-only">Menu</span></label>
    <nav class="site-nav" id="site-nav" aria-label="Primary">
      {''.join(links)}
      <a class="btn btn-primary nav-cta" href="/brief.html">Book a free consultation</a>
    </nav>
    <a class="header-cta" href="/brief.html"><span class="cta-long">Book a consultation</span><span class="cta-short">Book</span></a>
  </div>
</header>
"""


def clients_html():
    items = "".join(f"<li>{name}</li>" for name in CLIENTS)
    return f'<ul class="client-list">{items}</ul>'


def footer():
    return f"""<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="footer-brand" href="/">Dubani Creatives</a>
      <p class="fine" style="margin-top:0.6rem">A Cape Town studio led by Silulamele Dubani. Founded in 2020.</p>
      <p class="fine"><a href="tel:+27733464805">{PHONE_DISPLAY}</a><br><a href="mailto:dubanicreatives@gmail.com">dubanicreatives@gmail.com</a></p>
    </div>
    <nav aria-label="Footer">
      <a href="/portfolio.html">Work</a>
      <a href="/services.html">Services</a>
      <a href="/packages.html">Packages</a>
      <a href="/about.html">About</a>
      <a href="/work/fci.html">FCI case study</a>
      <a href="/contact.html">Contact</a>
      <a href="/brief.html">Book a free consultation</a>
    </nav>
    <nav aria-label="Social">
      <a href="https://www.instagram.com/dubanicreatives/" rel="noopener">Instagram</a>
      <a href="https://www.facebook.com/dubanicreativespage/" rel="noopener">Facebook</a>
      <a href="https://www.linkedin.com/company/dubani-creatives" rel="noopener">LinkedIn</a>
      <a href="https://www.behance.net/dubanicreatives1" rel="noopener">Behance</a>
      <a href="https://www.behance.net/DubaniCreatives" rel="noopener">Behance archive</a>
      <a href="https://x.com/Dubanicreative2" rel="noopener">X</a>
      <a href="https://www.tiktok.com/@dubanicreatives" rel="noopener">TikTok</a>
    </nav>
  </div>
  <div class="wrap"><p class="fine" style="margin-top:1.5rem">© <span id="year">2026</span> Dubani Creatives. Cape Town, South Africa.</p></div>
</footer>
<a class="wa-float" href="{WA}" rel="noopener" target="_blank">
  <span class="sr-only">WhatsApp {PHONE_DISPLAY}</span>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5zM12 20.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.8.6.6-3.7-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.1-.3a.5.5 0 0 0 0-.4c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.4a.8.8 0 0 0-.6.3 2.4 2.4 0 0 0-.8 1.8 4.2 4.2 0 0 0 .9 2.2 9.6 9.6 0 0 0 3.6 3.2 4 4 0 0 0 2.5.7 2.1 2.1 0 0 0 1.4-.6 1.7 1.7 0 0 0 .4-1.2c0-.1-.1-.2-.3-.2z"/></svg>
</a>
<script src="/js/site.js" defer></script>
"""


def write_page(rel, title, description, current, main):
    path = "/" if rel == "index.html" else "/" + rel
    html = head(title, description, path) + "<body>\n" + header(current) + main + footer() + "</body>\n</html>\n"
    dest = ROOT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(html, encoding="utf-8")
    print("wrote", rel)


def client_band():
    return f"""<section class="client-band" aria-label="Selected clients">
  <div class="wrap">
    <p>Selected clients</p>
    {clients_html()}
  </div>
</section>"""


def build_pages():
    write_page(
        "index.html",
        "Dubani Creatives | Cape Town Design Studio",
        "Dubani Creatives is a Cape Town studio led by Silulamele Dubani. Brand identity, print, social media and websites for South African businesses, NGOs, trusts and events.",
        "home",
        f"""<main id="main">
  <section class="hero">
    <div class="wrap hero-grid">
      <div>
        <p class="eyebrow">Cape Town · Est. 2020</p>
        <h1>Brand, print and websites for organisations that people rely on.</h1>
        <p class="lede">Dubani Creatives is a graphic design studio led by Silulamele Dubani. We work with South African businesses, NGOs, community trusts, housing organisations and events.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
          <a class="btn btn-ghost" href="{WA}" rel="noopener" target="_blank">WhatsApp {PHONE_DISPLAY}</a>
        </div>
        <ul class="facts">
          <li><strong>Silulamele Dubani</strong><span>Founder and studio lead</span></li>
          <li><strong>Cape Town</strong><span>South Africa</span></li>
          <li><strong>Since 2020</strong><span>Identity, print, social and web</span></li>
        </ul>
      </div>
      <figure class="hero-figure">
        <img src="/images/Portfolio/Brochure/KCT%20Annual%20report%201_1771002891340.jpg" alt="Cover of an annual report designed for Khayelitsha Community Trust" width="1000" height="700" fetchpriority="high">
        <figcaption><strong>Khayelitsha Community Trust</strong> — annual reports, 2022 to 2025</figcaption>
      </figure>
    </div>
  </section>
  {client_band()}
  <section class="section" aria-labelledby="work-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Selected work</p>
        <h2 id="work-title">Recent projects, shown plainly.</h2>
        <p class="lede">A few pieces from the studio archive. The rest of the grid is on the work page.</p>
      </div>
      <div class="work-grid">
        <a class="work-card lead" href="/work/fci.html">
          <img src="/images/Portfolio/Brochure/FCI%20Company%20Profile_1771002467429.webp" alt="Company profile cover for FCI Community Housing Services" width="1600" height="1200" loading="lazy">
          <div>
            <small>Case study</small>
            <h3>FCI Community Housing Services</h3>
            <p>A full rebrand from DCI to FCI: new name and domain, website, brand pack, company profile, forms, and ongoing management.</p>
          </div>
        </a>
        <a class="work-card" href="/portfolio.html">
          <img src="/images/Portfolio/Branding/5/CashWave%20Branding%203_1771002250185.webp" alt="CashWave branded collateral" width="1600" height="1080" loading="lazy">
          <div>
            <small>Brand and print</small>
            <h3>CashWave</h3>
            <p>Logo, letterhead, gazebo, flags, banners, a trailer banner and calendars.</p>
          </div>
        </a>
        <a class="work-card" href="/portfolio.html">
          <img src="/images/Portfolio/Web%20Design/Regimed/510031467_1275716064561901_6212627077468128073_n.jpg" alt="Regimed Health website shown on a laptop" width="1000" height="750" loading="lazy">
          <div>
            <small>Website</small>
            <h3>Regimed Health</h3>
            <p>Group brand architecture across sub-brands, and a website.</p>
          </div>
        </a>
      </div>
      <p style="margin-top:1.25rem"><a class="btn btn-ghost" href="/portfolio.html">View the work</a></p>
    </div>
  </section>
  <section class="section" style="padding-top:0" aria-labelledby="services-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">Services</p>
        <h2 id="services-title">What the studio is hired to do.</h2>
      </div>
      <div class="service-list">
        <a class="service-item" href="/services.html#identity"><span>01</span><div><h3>Brand identity and logos</h3><p>Names, marks, colour, type and the files an organisation needs to look like itself.</p></div></a>
        <a class="service-item" href="/services.html#print"><span>02</span><div><h3>Print and marketing collateral</h3><p>Annual reports, company profiles, signage, banners, hoardings, stationery and calendars.</p></div></a>
        <a class="service-item" href="/services.html#social"><span>03</span><div><h3>Social media content and management</h3><p>Posts, campaigns and ongoing social media management, including monthly retainers.</p></div></a>
        <a class="service-item" href="/services.html#web"><span>04</span><div><h3>Custom websites</h3><p>Design, build, hosting and maintenance. We also repair sites after they have been compromised.</p></div></a>
        <a class="service-item" href="/services.html#direction"><span>05</span><div><h3>Creative direction</h3><p>A clear point of view across brand, print, events and digital, so the work holds together.</p></div></a>
      </div>
    </div>
  </section>
  <section class="section" style="padding-top:0" aria-labelledby="process-title">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow">How a project runs</p>
        <h2 id="process-title">A short path from brief to files.</h2>
      </div>
      <div class="steps">
        <article class="step"><strong>1. Listen</strong><p>We start with a free consultation and a written brief: who the work is for, what must change, and what already exists.</p></article>
        <article class="step"><strong>2. Make</strong><p>We design, revise with you, and prepare the print, social or website files the project needs.</p></article>
        <article class="step"><strong>3. Stay</strong><p>Some projects end with a handover. Others continue as a monthly retainer for the website, social media, or both.</p></article>
      </div>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <figure class="quote-panel">
        <p>Fezile Calana, CEO of FCI Community Housing Services, said he was thoroughly impressed.</p>
      </figure>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band">
        <div>
          <p class="eyebrow" style="color:#9a3412">Start a project</p>
          <h2>Tell us what you need. We will reply.</h2>
          <p>Book a free consultation, send a brief, or message us on WhatsApp at {PHONE_DISPLAY}.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
          <a class="btn btn-ghost" href="/contact.html">Contact the studio</a>
        </div>
      </div>
    </div>
  </section>
</main>
""",
    )

    write_page(
        "about.html",
        "About | Dubani Creatives",
        "Dubani Creatives is a Cape Town graphic design studio founded in 2020 and led by Silulamele Dubani. We work with South African businesses, NGOs, trusts and events.",
        "about",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap about-grid">
      <div>
        <p class="eyebrow">The studio</p>
        <h1>Led by Silulamele Dubani, from Cape Town.</h1>
      </div>
      <div class="prose">
        <p>Dubani Creatives is a graphic design studio. Silulamele Dubani founded it in 2020 and still leads the work. We speak as a studio because projects are delivered that way: one clear lead, and the collaborators a job needs.</p>
        <p>The organisations we design for include businesses, NGOs, community trusts, property and housing groups, churches and events. Much of the work is identity, print and websites that have to be used by staff, not only admired in a presentation.</p>
        <p><strong>Cape Town, South Africa.</strong> {PHONE_DISPLAY}. dubanicreatives@gmail.com.</p>
        <div class="btn-row">
          <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
          <a class="btn btn-ghost" href="/portfolio.html">See the work</a>
        </div>
      </div>
    </div>
  </section>
  {client_band()}
  <section class="section">
    <div class="wrap split">
      <article class="panel">
        <h2>What we take responsibility for</h2>
        <ul>
          <li>Brand identity and logos</li>
          <li>Print: reports, profiles, signage, banners, stationery, calendars</li>
          <li>Social media content and management</li>
          <li>Websites: design, build, hosting, maintenance</li>
          <li>Creative direction</li>
          <li>Monthly retainers</li>
        </ul>
      </article>
      <article class="panel">
        <h2>A project we can talk about</h2>
        <p>FCI Community Housing Services came to the studio as DCI. We renamed and rebranded the organisation as FCI, set up the domain and website at fcichs.co.za, produced the brand pack, company profile, email signatures and application forms, cleaned up the site after it was hacked, moved the hosting, and stayed on as the monthly team for the website and social media.</p>
        <p style="margin-top:0.8rem"><a href="/work/fci.html">Read the FCI case study</a></p>
      </article>
    </div>
  </section>
</main>
""",
    )

    write_page(
        "services.html",
        "Services | Dubani Creatives",
        "Brand identity, print and marketing collateral, social media, custom websites and creative direction from Dubani Creatives in Cape Town. Monthly retainers available.",
        "services",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Services</p>
      <h1>Design that staff can actually use.</h1>
      <p class="lede">Five kinds of work, plus monthly retainers when a brand needs someone to keep showing up. Every engagement starts with a conversation, not a template.</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap service-list">
      <article class="service-item" id="identity">
        <span>01</span>
        <div>
          <h2>Brand identity and logos</h2>
          <p>A name, a mark, colours, type and a small set of rules. For FCI this was a full rebrand from DCI, including the new name. For Regimed Health it was brand architecture across a group of sub-brands. For CashWave and Makinzi Building Solutions it started with the logo and the stationery around it.</p>
        </div>
      </article>
      <article class="service-item" id="print">
        <span>02</span>
        <div>
          <h2>Print and marketing collateral</h2>
          <p>Annual reports, company profiles, signage, banners, hoardings, stationery and calendars. Khayelitsha Community Trust’s annual reports from 2022 to 2025, the KCT Mall brand refresh, signage master plan, hoardings and stationery, and the Social Impact report sit in this work. CashWave’s gazebo, flags, banners, trailer banner and calendars do too.</p>
        </div>
      </article>
      <article class="service-item" id="social">
        <span>03</span>
        <div>
          <h2>Social media content and management</h2>
          <p>Campaign graphics, event posters and menus, and ongoing management. Festa M’s EP cover, EPK and concert posters, Mellows Lounge’s menus and event posters, and Gugulethu Sports Council’s banners and posters are examples. FCI’s social media is managed monthly.</p>
        </div>
      </article>
      <article class="service-item" id="web">
        <span>04</span>
        <div>
          <h2>Custom websites</h2>
          <p>Design, build, hosting and maintenance. We have built and cared for sites including fcichs.co.za, Regimed Health and Langa Life Bible Church. When FCI’s site was hacked, the work included security cleanup and a hosting migration, then the forms people use to apply.</p>
        </div>
      </article>
      <article class="service-item" id="direction">
        <span>05</span>
        <div>
          <h2>Creative direction</h2>
          <p>Deciding what a brand should look like across print, events and digital before the individual files are made, and keeping later work inside that decision.</p>
        </div>
      </article>
      <article class="service-item" id="retainers">
        <span>06</span>
        <div>
          <h2>Monthly retainers</h2>
          <p>A standing arrangement for website care, social media, or both. FCI Community Housing Services is on a monthly retainer for website and social media management. Retainers are scoped to the organisation. They are not a fixed public price.</p>
        </div>
      </article>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap">
      <div class="cta-band">
        <div>
          <h2>Not sure which of these you need?</h2>
          <p>Book a free consultation. Bring the problem, not the jargon.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
          <a class="btn btn-ghost" href="/packages.html">See packages</a>
        </div>
      </div>
    </div>
  </section>
</main>
""",
    )

    write_page(
        "packages.html",
        "Packages | Dubani Creatives",
        "Dubani Creatives packages: Kickstart at R4,500, Brand Builder at R9,500, Full Suite from R18,000, plus custom monthly retainers. Cape Town.",
        "packages",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Packages</p>
      <h1>Three ways to start. A retainer if you stay.</h1>
      <p class="lede">Prices are in South African rand. A project that does not fit a package is quoted on its own. Monthly retainers are scoped after a conversation.</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap price-grid">
      <article class="price-card">
        <h2>Kickstart</h2>
        <p class="price">R4,500</p>
        <p class="who">Essential branding for a new organisation.</p>
        <ul>
          <li>Custom logo design concepts</li>
          <li>Brand colours and typography</li>
          <li>Basic brand guideline (PDF)</li>
          <li>Two rounds of revisions</li>
          <li>Print and web vector files</li>
        </ul>
        <a class="btn btn-ghost" href="/brief.html?package=Kickstart">Start with Kickstart</a>
      </article>
      <article class="price-card featured">
        <p class="badge">Full identity</p>
        <h2>Brand Builder</h2>
        <p class="price">R9,500</p>
        <p class="who">A full identity for an organisation ready to use it everywhere.</p>
        <ul>
          <li>Identity system with primary and secondary marks</li>
          <li>Six social media templates</li>
          <li>Stationery or a pitch deck</li>
          <li>Brand book of 20 or more pages</li>
          <li>Five revision rounds and priority turnaround</li>
        </ul>
        <a class="btn btn-primary" href="/brief.html?package=Brand%20Builder">Start with Brand Builder</a>
      </article>
      <article class="price-card">
        <h2>Full Suite</h2>
        <p class="price">R18,000+</p>
        <p class="who">Launches, established brands, and work that includes a website.</p>
        <ul>
          <li>Brand strategy workshop and positioning</li>
          <li>Full visual identity and asset library</li>
          <li>Campaign design and art direction</li>
          <li>Custom web design and development</li>
          <li>Access to a monthly creative retainer</li>
        </ul>
        <a class="btn btn-ghost" href="/brief.html?package=Full%20Suite">Talk about Full Suite</a>
      </article>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap split">
      <article class="panel">
        <h2>Custom retainers</h2>
        <p>Website care, social media management, or a mix of both, billed monthly. The scope is written down before it starts. FCI Community Housing Services is an example: website and social media, ongoing.</p>
      </article>
      <article class="panel">
        <h2>What happens after you enquire</h2>
        <ol>
          <li>We read the brief and reply.</li>
          <li>A free consultation confirms the fit.</li>
          <li>You receive a scope. Work starts when you accept it.</li>
        </ol>
        <p style="margin-top:1rem"><a class="btn btn-primary" href="/brief.html">Book a free consultation</a></p>
      </article>
    </div>
  </section>
</main>
""",
    )

    form_fields_contact = """
      <label>Your name<input name="name" autocomplete="name" required></label>
      <label>Email<input type="email" name="email" autocomplete="email" required></label>
      <label>Phone<input type="tel" name="phone" autocomplete="tel" placeholder="073 346 4805"></label>
      <label>Organisation<input name="organisation" autocomplete="organization"></label>
      <label>What do you need?
        <select name="service" required>
          <option value="">Select a service</option>
          <option>Brand identity and logos</option>
          <option>Print and marketing collateral</option>
          <option>Social media content and management</option>
          <option>Custom website</option>
          <option>Creative direction</option>
          <option>Monthly retainer</option>
          <option>Not sure yet</option>
        </select>
      </label>
      <label>About the project<textarea name="message" required></textarea></label>
    """

    write_page(
        "contact.html",
        "Contact | Dubani Creatives",
        "Contact Dubani Creatives in Cape Town. Call or WhatsApp 073 346 4805, email dubanicreatives@gmail.com, or send a project enquiry.",
        "contact",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap contact-grid">
      <div>
        <p class="eyebrow">Contact</p>
        <h1>Write, call, or send a WhatsApp.</h1>
        <p class="lede">Silulamele Dubani leads the studio. Enquiries come to one phone number and one email.</p>
        <div class="detail-list">
          <p><span>Phone and WhatsApp</span><a href="tel:+27733464805">{PHONE_DISPLAY}</a><br><a href="{WA}" rel="noopener" target="_blank">{PHONE_INTL}</a></p>
          <p><span>Email</span><a href="mailto:dubanicreatives@gmail.com">dubanicreatives@gmail.com</a></p>
          <p><span>Studio</span>Cape Town, South Africa</p>
        </div>
        <div class="socials">
          <a href="https://www.instagram.com/dubanicreatives/" rel="noopener">Instagram</a>
          <a href="https://www.facebook.com/dubanicreativespage/" rel="noopener">Facebook</a>
          <a href="https://www.linkedin.com/company/dubani-creatives" rel="noopener">LinkedIn</a>
          <a href="https://www.behance.net/dubanicreatives1" rel="noopener">Behance</a>
          <a href="https://www.behance.net/DubaniCreatives" rel="noopener">Behance archive</a>
          <a href="https://x.com/Dubanicreative2" rel="noopener">X</a>
          <a href="https://www.tiktok.com/@dubanicreatives" rel="noopener">TikTok</a>
        </div>
      </div>
      <form data-whatsapp="contact" novalidate>
        <h2 style="font-size:1.6rem">Project enquiry</h2>
        <p class="form-note">This form opens WhatsApp with your message filled in. Nothing is stored on this website.</p>
        <div class="hp" aria-hidden="true"><label>Company website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        {form_fields_contact}
        <button class="btn btn-primary" type="submit">Send on WhatsApp</button>
        <p class="form-error" data-status role="status"></p>
        <p class="form-note">Prefer email? Write to <a href="mailto:dubanicreatives@gmail.com">dubanicreatives@gmail.com</a>, or <a href="/brief.html">book a free consultation</a>.</p>
      </form>
    </div>
  </section>
</main>
""",
    )

    write_page(
        "brief.html",
        "Book a free consultation | Dubani Creatives",
        "Book a free consultation with Dubani Creatives in Cape Town. Share your organisation, timing and what you need. We reply by WhatsApp or email.",
        "brief",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap brief-grid">
      <div>
        <p class="eyebrow">Free consultation</p>
        <h1>Tell us the job. We will tell you if we are the right studio.</h1>
        <div class="prose">
          <p>The consultation is a conversation, not a pitch deck. Use this brief if you already know the outlines: organisation, what you need, timing and budget.</p>
          <p>You can also WhatsApp {PHONE_DISPLAY} or email dubanicreatives@gmail.com.</p>
        </div>
        <ol class="steps" style="margin-top:1.5rem">
          <li class="step"><strong>You send this</strong><p>It opens in WhatsApp so we see it on a phone, which is how most enquiries arrive.</p></li>
          <li class="step"><strong>We reply</strong><p>If a call is useful, we arrange it. If the work is not a fit, we say so.</p></li>
        </ol>
      </div>
      <form data-whatsapp="brief" novalidate>
        <h2 style="font-size:1.6rem">Consultation brief</h2>
        <div class="hp" aria-hidden="true"><label>Company website<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <label>Your name<input name="name" autocomplete="name" required></label>
        <label>Email<input type="email" name="email" autocomplete="email" required></label>
        <label>Phone<input type="tel" name="phone" autocomplete="tel" required></label>
        <label>Organisation<input name="organisation" autocomplete="organization" required></label>
        <label>What do you need?
          <select name="service" id="service" required>
            <option value="">Select a service</option>
            <option>Brand identity and logos</option>
            <option>Print and marketing collateral</option>
            <option>Social media content and management</option>
            <option>Custom website</option>
            <option>Creative direction</option>
            <option>Monthly retainer</option>
            <option>Kickstart package</option>
            <option>Brand Builder package</option>
            <option>Full Suite package</option>
            <option>Not sure yet</option>
          </select>
        </label>
        <label>Timing
          <select name="timing">
            <option value="">When do you need to begin?</option>
            <option>As soon as we can</option>
            <option>This month</option>
            <option>This quarter</option>
            <option>Flexible</option>
          </select>
        </label>
        <label>Budget
          <select name="budget" id="budget">
            <option value="">Select a range if you have one</option>
            <option>Kickstart — R4,500</option>
            <option>Brand Builder — R9,500</option>
            <option>Full Suite — R18,000+</option>
            <option>Monthly retainer</option>
            <option>Not sure yet</option>
          </select>
        </label>
        <label>Anything we should know<textarea name="message" required placeholder="Who the work is for, and what has to change."></textarea></label>
        <button class="btn btn-primary" type="submit">Book on WhatsApp</button>
        <p class="form-error" data-status role="status"></p>
      </form>
    </div>
  </section>
</main>
<script>
document.addEventListener("DOMContentLoaded", function () {{
  var params = new URLSearchParams(location.search);
  var pack = params.get("package");
  if (!pack) return;
  var budget = document.getElementById("budget");
  var service = document.getElementById("service");
  var map = {{
    "Kickstart": ["Kickstart — R4,500", "Kickstart package"],
    "Brand Builder": ["Brand Builder — R9,500", "Brand Builder package"],
    "Full Suite": ["Full Suite — R18,000+", "Full Suite package"]
  }};
  if (map[pack] && budget && service) {{
    budget.value = map[pack][0];
    service.value = map[pack][1];
  }}
}});
</script>
""",
    )

    write_page(
        "portfolio.html",
        "Work | Dubani Creatives",
        "Selected brand, print, web and campaign work by Dubani Creatives, the Cape Town studio led by Silulamele Dubani.",
        "work",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">Work</p>
      <h1>Projects from the studio archive.</h1>
      <p class="lede">Real client work. Open a piece to see it larger. The FCI rebrand has its own case study.</p>
      <div class="filters" id="folio-filters">
        <button type="button" data-filter="all" aria-pressed="true">All</button>
        <button type="button" data-filter="branding" aria-pressed="false">Branding</button>
        <button type="button" data-filter="print" aria-pressed="false">Print</button>
        <button type="button" data-filter="web" aria-pressed="false">Web</button>
        <button type="button" data-filter="campaigns" aria-pressed="false">Campaigns</button>
      </div>
      <p class="status" id="folio-status"></p>
      <div class="folio-grid" id="folio-grid"></div>
      <noscript>
        <p class="lede" style="margin-top:1rem">This grid needs JavaScript. You can browse the same studio on <a href="https://www.behance.net/dubanicreatives1">Behance</a> or <a href="/work/fci.html">read the FCI case study</a>.</p>
      </noscript>
    </div>
  </section>
  {client_band()}
  <section class="section" style="padding-top:1rem">
    <div class="wrap">
      <div class="cta-band">
        <div>
          <h2>Have a project in this lane?</h2>
          <p>Book a free consultation or send a WhatsApp.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
          <a class="btn btn-ghost" href="{WA}" rel="noopener">WhatsApp us</a>
        </div>
      </div>
    </div>
  </section>
  <dialog class="lightbox" id="lightbox" aria-label="Project image">
    <img class="lb-img" id="lb-img" alt="">
    <div class="lb-bar">
      <p id="lb-caption"></p>
      <div class="lb-actions">
        <button type="button" id="lb-prev" aria-label="Previous image">←</button>
        <button type="button" id="lb-next" aria-label="Next image">→</button>
        <button type="button" id="lb-close" aria-label="Close">✕</button>
      </div>
    </div>
  </dialog>
</main>
""",
    )

    write_page(
        "work/fci.html",
        "FCI Community Housing Services | Dubani Creatives",
        "How Dubani Creatives rebranded DCI as FCI Community Housing Services: new name and domain, website, security cleanup, hosting migration, forms and a monthly retainer.",
        "work",
        f"""<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow"><a href="/portfolio.html">Work</a> · Case study</p>
      <h1>FCI Community Housing Services</h1>
      <p class="lede">A rebrand from DCI to FCI, a new website, and the documents and care the organisation needed afterwards.</p>
    </div>
  </section>
  <section class="section" style="padding-top:0">
    <div class="wrap study-layout">
      <div class="study-copy">
        <figure class="study-hero">
          <img src="/images/Portfolio/Brochure/FCI%20Company%20Profile_1771002467429.webp" alt="Company profile cover for FCI Community Housing Services" width="1600" height="1200">
        </figure>
        <div>
          <h2>The situation</h2>
          <p>FCI Community Housing Services needed to leave the DCI name behind. The organisation required a new name, a new domain, and a public identity that could carry a website, a company profile, email signatures and application forms.</p>
          <p style="margin-top:0.8rem">The website was also hacked. It needed a security cleanup, a move to new hosting, and working forms before it could be handed back as a site staff could rely on.</p>
        </div>
        <div>
          <h2>What we did</h2>
          <ul>
            <li>Rebranded the organisation from DCI to FCI, including the new name</li>
            <li>Set up the new domain and website at <a href="https://fcichs.co.za" rel="noopener">fcichs.co.za</a></li>
            <li>Produced the brand pack and company profile</li>
            <li>Designed email signatures and application forms</li>
            <li>Cleaned up the website after the hack and migrated the hosting</li>
            <li>Continued with website and social media management on a monthly retainer</li>
          </ul>
        </div>
        <div>
          <h2>Where it stands</h2>
          <p>The FCI name is in use and the website is live at fcichs.co.za. The brand pack, company profile, email signatures and application forms were part of the rebrand. Website and social media management continues on a monthly retainer.</p>
          <p style="margin-top:0.8rem">Fezile Calana, CEO of FCI Community Housing Services, said he was thoroughly impressed.</p>
        </div>
        <div class="gallery">
          <figure>
            <img src="/images/Portfolio/Branding/4/FCI%20Logo%201_1770150999351.jpg" alt="FCI wordmark" width="1000" height="707" loading="lazy">
            <figcaption>FCI wordmark</figcaption>
          </figure>
          <figure>
            <img src="/images/Portfolio/Branding/4/FCI%20Company%20Profile_1771002561943.jpg" alt="Interior of the FCI company profile" width="1000" height="800" loading="lazy">
            <figcaption>Company profile</figcaption>
          </figure>
        </div>
      </div>
      <aside class="meta-card">
        <dl>
          <div><dt>Client</dt><dd>FCI Community Housing Services</dd></div>
          <div><dt>Studio lead</dt><dd>Silulamele Dubani</dd></div>
          <div><dt>Website</dt><dd><a href="https://fcichs.co.za" rel="noopener">fcichs.co.za</a></dd></div>
          <div><dt>Work</dt><dd>Rebrand, website, print, security cleanup, retainer</dd></div>
        </dl>
        <a class="btn btn-primary" href="/brief.html">Book a free consultation</a>
        <a class="btn btn-ghost" href="{WA}" rel="noopener">WhatsApp {PHONE_DISPLAY}</a>
      </aside>
    </div>
  </section>
</main>
""",
    )

    write_page(
        "404.html",
        "Page not found | Dubani Creatives",
        "This page is not on the Dubani Creatives website. Visit the studio homepage or the work page.",
        "",
        """<main id="main">
  <section class="page-hero">
    <div class="wrap">
      <p class="eyebrow">404</p>
      <h1>That page is not here.</h1>
      <p class="lede">The link may be old. The work, services and contact pages are the current site.</p>
      <div class="btn-row">
        <a class="btn btn-primary" href="/">Back to the homepage</a>
        <a class="btn btn-ghost" href="/portfolio.html">View the work</a>
      </div>
    </div>
  </section>
</main>
""",
    )


def redirect(rel, target, title):
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <link rel="canonical" href="{SITE}/{target}">
  <meta name="robots" content="noindex">
  <meta http-equiv="refresh" content="0; url=/{target}">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body>
  <main id="main" class="page-hero"><div class="wrap">
    <h1>This page has moved.</h1>
    <p class="lede"><a href="/{target}">Continue to {target}</a></p>
  </div></main>
</body>
</html>
"""
    (ROOT / rel).write_text(html, encoding="utf-8")
    print("redirect", rel)


def portfolio_json():
    items = json.loads((ROOT / "portfolio_data.json").read_text()) if False else None
    # written separately
    return items


def write_robots_sitemap():
    (ROOT / "robots.txt").write_text(
        """User-agent: *
Allow: /

Disallow: /invoice.html
Disallow: /my-apps.html
Disallow: /cv.html
Disallow: /handscribe/
Disallow: /patternforge/
Disallow: /_build_tools/

Sitemap: https://dubanicreatives.tech/sitemap.xml
""",
        encoding="utf-8",
    )
    urls = [
        ("/", "weekly", "1.0"),
        ("/portfolio.html", "monthly", "0.9"),
        ("/work/fci.html", "monthly", "0.9"),
        ("/services.html", "monthly", "0.8"),
        ("/packages.html", "monthly", "0.8"),
        ("/about.html", "monthly", "0.7"),
        ("/contact.html", "monthly", "0.8"),
        ("/brief.html", "monthly", "0.7"),
    ]
    body = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, freq, pri in urls:
        body.append("  <url>")
        body.append(f"    <loc>{SITE}{loc}</loc>")
        body.append("    <lastmod>2026-10-20</lastmod>")
        body.append(f"    <changefreq>{freq}</changefreq>")
        body.append(f"    <priority>{pri}</priority>")
        body.append("  </url>")
    body.append("</urlset>\n")
    (ROOT / "sitemap.xml").write_text("\n".join(body), encoding="utf-8")
    print("robots+sitemap")


def ensure_og():
    path = ROOT / "images" / "og.jpg"
    if path.exists() and path.stat().st_size > 1000:
        return
    raise SystemExit("missing og")


def resize_heavy_and_write_json():
    # The JSON content is written by the caller script if missing.
    pass


if __name__ == "__main__":
    ensure_og()
    build_pages()
    redirect("projects.html", "portfolio.html", "Work | Dubani Creatives")
    redirect("promotions.html", "packages.html", "Packages | Dubani Creatives")
    redirect("skills.html", "about.html", "About | Dubani Creatives")
    write_robots_sitemap()
