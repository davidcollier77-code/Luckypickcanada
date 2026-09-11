








<!doctype html>
<html
      lang="en"
      dir="ltr">
  <head>
    <meta name="google-signin-client-id" content="157101835696-ooapojlodmuabs2do2vuhhnf90bccmoi.apps.googleusercontent.com"><meta name="google-signin-scope"
          content="profile email https://www.googleapis.com/auth/developerprofiles https://www.googleapis.com/auth/developerprofiles.award https://www.googleapis.com/auth/devprofiles.full_control.firstparty"><meta property="og:site_name" content="Chrome for Developers">
    <meta property="og:type" content="website"><meta name="theme-color" content="#1a73e8"><meta charset="utf-8">
    <meta content="IE=Edge" http-equiv="X-UA-Compatible">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <link rel="manifest" href="/_pwa/chrome/manifest.json"
          crossorigin="use-credentials">
    <link rel="preconnect" href="//www.gstatic.com" crossorigin>
    <link rel="preconnect" href="//fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="//www.google-analytics.com" crossorigin><link rel="stylesheet" href="//fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap">
      <link rel="stylesheet"
            href="//fonts.googleapis.com/css2?family=Material+Icons&family=Material+Symbols+Outlined&display=block"><link rel="stylesheet" href="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/css/app.css">

        <link rel="stylesheet" href="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/css/dark-theme.css" disabled>
      <link rel="shortcut icon" href="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/favicon.png">
    <link rel="apple-touch-icon" href="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/touchicon-180.png"><link rel="canonical" href="https://developer.chrome.com/docs/extensions/reference/api/offscreen"><link rel="search" type="application/opensearchdescription+xml"
            title="Chrome for Developers" href="https://developer.chrome.com/s/opensearch.xml">
      <link rel="alternate" hreflang="en"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen" /><link rel="alternate" hreflang="x-default" href="https://developer.chrome.com/docs/extensions/reference/api/offscreen" /><link rel="alternate" hreflang="ar"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=ar" /><link rel="alternate" hreflang="bn"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=bn" /><link rel="alternate" hreflang="zh-Hans"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=zh-cn" /><link rel="alternate" hreflang="zh-Hant"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=zh-tw" /><link rel="alternate" hreflang="nl"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=nl" /><link rel="alternate" hreflang="fa"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=fa" /><link rel="alternate" hreflang="fr"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=fr" /><link rel="alternate" hreflang="de"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=de" /><link rel="alternate" hreflang="he"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=he" /><link rel="alternate" hreflang="hi"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=hi" /><link rel="alternate" hreflang="id"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=id" /><link rel="alternate" hreflang="it"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=it" /><link rel="alternate" hreflang="ja"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=ja" /><link rel="alternate" hreflang="ko"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=ko" /><link rel="alternate" hreflang="pl"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=pl" /><link rel="alternate" hreflang="pt-BR"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=pt-br" /><link rel="alternate" hreflang="ru"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=ru" /><link rel="alternate" hreflang="es-419"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=es-419" /><link rel="alternate" hreflang="th"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=th" /><link rel="alternate" hreflang="tr"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=tr" /><link rel="alternate" hreflang="vi"
          href="https://developer.chrome.com/docs/extensions/reference/api/offscreen?hl=vi" /><link rel="alternate" hreflang="en-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen" /><link rel="alternate" hreflang="x-default" href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen" /><link rel="alternate" hreflang="ar-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=ar" /><link rel="alternate" hreflang="bn-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=bn" /><link rel="alternate" hreflang="zh-Hans-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=zh-cn" /><link rel="alternate" hreflang="zh-Hant-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=zh-tw" /><link rel="alternate" hreflang="nl-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=nl" /><link rel="alternate" hreflang="fa-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=fa" /><link rel="alternate" hreflang="fr-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=fr" /><link rel="alternate" hreflang="de-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=de" /><link rel="alternate" hreflang="he-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=he" /><link rel="alternate" hreflang="hi-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=hi" /><link rel="alternate" hreflang="id-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=id" /><link rel="alternate" hreflang="it-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=it" /><link rel="alternate" hreflang="ja-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=ja" /><link rel="alternate" hreflang="ko-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=ko" /><link rel="alternate" hreflang="pl-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=pl" /><link rel="alternate" hreflang="pt-BR-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=pt-br" /><link rel="alternate" hreflang="ru-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=ru" /><link rel="alternate" hreflang="es-419-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=es-419" /><link rel="alternate" hreflang="th-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=th" /><link rel="alternate" hreflang="tr-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=tr" /><link rel="alternate" hreflang="vi-cn"
          href="https://developer.chrome.google.cn/docs/extensions/reference/api/offscreen?hl=vi" /><title>chrome.offscreen &nbsp;|&nbsp; API &nbsp;|&nbsp; Chrome for Developers</title>

<meta property="og:title" content="chrome.offscreen &nbsp;|&nbsp; API &nbsp;|&nbsp; Chrome for Developers"><meta property="og:url" content="https://developer.chrome.com/docs/extensions/reference/api/offscreen"><meta property="og:locale" content="en"><script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",

    "headline": "chrome.offscreen"
  }
</script><script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Docs",
      "item": "https://developer.chrome.com/docs"
    },{
      "@type": "ListItem",
      "position": 2,
      "name": "Chrome Extensions",
      "item": "https://developer.chrome.com/docs/extensions"
    },{
      "@type": "ListItem",
      "position": 3,
      "name": "Reference",
      "item": "https://developer.chrome.com/docs/extensions/reference"
    },{
      "@type": "ListItem",
      "position": 4,
      "name": "API",
      "item": "https://developer.chrome.com/docs/extensions/reference/api"
    },{
      "@type": "ListItem",
      "position": 5,
      "name": "chrome.offscreen",
      "item": "https://developer.chrome.com/docs/extensions/reference/api/offscreen"
    }]
  }
  </script>







    </head>
  <body class="color-scheme--light"
        template="page"
        theme="chrome-theme"
        type="article"

        appearance

        layout="docs"





        display-toc
        pending>

    <devsite-progress type="indeterminate" id="app-progress"></devsite-progress>


    <a href="#main-content" class="skip-link button">

      Skip to main content
    </a>
    <section class="devsite-wrapper">
      <devsite-cookie-notification-bar></devsite-cookie-notification-bar>
        <devsite-header role="banner">























<div class="devsite-header--inner" data-nosnippet>
  <div class="devsite-top-logo-row-wrapper-wrapper">
    <div class="devsite-top-logo-row-wrapper">
      <div class="devsite-top-logo-row">
        <button type="button" id="devsite-hamburger-menu"
          class="devsite-header-icon-button button-flat material-icons gc-analytics-event"
          data-category="Site-Wide Custom Events"
          data-label="Navigation menu button"
          visually-hidden
          aria-label="Open menu">
        </button>

<div class="devsite-product-name-wrapper">

  <a href="/" class="devsite-site-logo-link gc-analytics-event"
   data-category="Site-Wide Custom Events" data-label="Site logo" track-type="globalNav"
   track-name="chromeForDevelopers" track-metadata-position="nav"
   track-metadata-eventDetail="nav">

  <picture>

    <source srcset="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/lockup-dark-theme.svg"
            media="(prefers-color-scheme: dark)"
            class="devsite-dark-theme">

    <img src="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/lockup.svg" class="devsite-site-logo" alt="Chrome for Developers">
  </picture>

</a>



</div>
        <div class="devsite-top-logo-row-middle">
          <div class="devsite-header-upper-tabs">



  <devsite-tabs class="upper-tabs">

    <nav class="devsite-tabs-wrapper" aria-label="Upper tabs">


          <tab class="devsite-dropdown
    devsite-dropdown-full
    devsite-active

    ">

    <a href="https://developer.chrome.com/docs"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs"

       track-type="nav"
       track-metadata-position="nav - docs"
       track-metadata-module="primary nav"
       aria-label="Docs, selected"


           data-category="Site-Wide Custom Events"

           data-label="Tab: Docs"

           track-name="docs"

       >
    Docs

    </a>

      <button
         aria-haspopup="menu"
         aria-expanded="false"
         aria-label="Dropdown menu for Docs"
         track-type="nav"
         track-metadata-eventdetail="https://developer.chrome.com/docs"
         track-metadata-position="nav - docs"
         track-metadata-module="primary nav"


            data-category="Site-Wide Custom Events"

            data-label="Tab: Docs"

            track-name="docs"


         class="devsite-tabs-dropdown-toggle devsite-icon devsite-icon-arrow-drop-down"></button>


  <div class="devsite-tabs-dropdown" role="menu" aria-label="submenu" hidden>
    <div class="devsite-tabs-dropdown-content">


        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       build-icon dcc-subnav">

                <li class="devsite-nav-title" role="heading" tooltip>Build with Chrome</li>


                <li class="devsite-nav-description">Learn how Chrome works, participate in origin trials, and build with Chrome everywhere.
</li>


                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/web-platform"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/web-platform"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Web Platform
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/iwa"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/iwa"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Isolated Web Apps (IWA)
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/capabilities"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/capabilities"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Capabilities
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/automation-and-testing"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/automation-and-testing"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Automation and testing
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/chromedriver"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/chromedriver"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      ChromeDriver
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/extensions"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/extensions"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Extensions
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/webstore"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/webstore"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Chrome Web Store
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/chromium"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/chromium"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Chromium
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/android"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/android"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Web on Android
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/origintrials/"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/origintrials/"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Origin trials
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/release-notes"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/release-notes"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="build with chrome"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Release notes
                    </div>

                  </a>
                </li>

            </ul>

        </div>

        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       productivity-icon dcc-subnav">

                <li class="devsite-nav-title" role="heading" tooltip>Productivity</li>


                <li class="devsite-nav-description">Create the best experience for your users with the web&#39;s best tools.</li>


                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/devtools"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/devtools"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      DevTools
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/lighthouse"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/lighthouse"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Lighthouse
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/crux"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/crux"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Chrome UX Report
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/accessibility"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/accessibility"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Accessibility
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/modern-web-guidance"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/modern-web-guidance"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Modern Web Guidance
                    </div>

                  </a>
                </li>

            </ul>

            <ul class="devsite-tabs-dropdown-section
                       dcc-subnav second-column-list">


                <li class="devsite-nav-description">Get things done quicker and neater, with our ready-made libraries.
</li>


                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/workbox"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/workbox"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Workbox
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/puppeteer"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/puppeteer"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="productivity"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Puppeteer
                    </div>

                  </a>
                </li>

            </ul>

        </div>

        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       experience-icon dcc-subnav">

                <li class="devsite-nav-title" role="heading" tooltip>Experience</li>


                <li class="devsite-nav-description">Design a beautiful and performant web with Chrome.
</li>


                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/ai"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/ai"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      AI
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/performance"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/performance"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Performance
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/css-ui"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/css-ui"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      CSS and UI
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/identity"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/identity"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Identity
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/payments"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/payments"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Payments
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/privacy-security"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/privacy-security"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="experience"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Privacy and security
                    </div>

                  </a>
                </li>

            </ul>

        </div>

        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       resources-icon dcc-subnav">

                <li class="devsite-nav-title" role="heading" tooltip>Resources</li>


                <li class="devsite-nav-description">More from Chrome and Google.
</li>


                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="resources"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      All documentation
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://web.dev/baseline"

                     track-type="nav"
                     track-metadata-eventdetail="https://web.dev/baseline"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="resources"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Baseline <span class="material-icons" style="font-size: 12px;" aria-hidden="true" translate="no">open_in_new</span>
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://web.dev"

                     track-type="nav"
                     track-metadata-eventdetail="https://web.dev"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="resources"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      web.dev <span class="material-icons" style="font-size: 12px;" aria-hidden="true" translate="no">open_in_new</span>
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://pagespeed.web.dev"

                     track-type="nav"
                     track-metadata-eventdetail="https://pagespeed.web.dev"
                     track-metadata-position="nav - docs"
                     track-metadata-module="tertiary nav"

                       track-metadata-module_headline="resources"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      PageSpeed Insights audit <span class="material-icons" style="font-size: 12px;" aria-hidden="true" translate="no">open_in_new</span>
                    </div>

                  </a>
                </li>

            </ul>

        </div>

    </div>
  </div>
</tab>



          <tab  >

    <a href="https://developer.chrome.com/case-studies"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/case-studies"

       track-type="nav"
       track-metadata-position="nav - case studies"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Case studies"

           track-name="case studies"

       >
    Case studies

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/blog"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/blog"

       track-type="nav"
       track-metadata-position="nav - blog"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Blog"

           track-name="blog"

       >
    Blog

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/new"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/new"

       track-type="nav"
       track-metadata-position="nav - new in chrome"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: New in Chrome"

           track-name="new in chrome"

       >
    New in Chrome

    </a>


          </tab>


    </nav>

  </devsite-tabs>


           </div>

<devsite-search
    enable-signin
    enable-search
    enable-suggestions
      enable-query-completion

    enable-search-summaries
    project-name="API"
    tenant-name="Chrome for Developers"





    >
  <form class="devsite-search-form" action="https://developer.chrome.com/s/results" method="GET">
    <div class="devsite-search-container">
      <button type="button"
              search-open
              class="devsite-search-button devsite-header-icon-button button-flat material-icons"

              aria-label="Open search"></button>
      <div class="devsite-searchbox">
        <input
          aria-activedescendant=""
          aria-autocomplete="list"

          aria-label="Search"
          aria-expanded="false"
          aria-haspopup="listbox"
          autocomplete="off"
          class="devsite-search-field devsite-search-query"
          name="q"

          placeholder="Search"
          role="combobox"
          type="text"
          value=""
          >
          <div class="devsite-search-image material-icons" aria-hidden="true">

              <svg class="devsite-search-ai-image" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_6641_386)">
                    <path d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.14167 15.375 4.875 14.125C3.625 12.8583 3 11.3167 3 9.5C3 7.68333 3.625 6.15 4.875 4.9C6.14167 3.63333 7.68333 3 9.5 3C10.0167 3 10.5167 3.05833 11 3.175C11.4833 3.275 11.9417 3.43333 12.375 3.65L10.825 5.2C10.6083 5.13333 10.3917 5.08333 10.175 5.05C9.95833 5.01667 9.73333 5 9.5 5C8.25 5 7.18333 5.44167 6.3 6.325C5.43333 7.19167 5 8.25 5 9.5C5 10.75 5.43333 11.8167 6.3 12.7C7.18333 13.5667 8.25 14 9.5 14C10.6667 14 11.6667 13.625 12.5 12.875C13.35 12.1083 13.8417 11.15 13.975 10H15.975C15.925 10.6333 15.7833 11.2333 15.55 11.8C15.3333 12.3667 15.05 12.8667 14.7 13.3L21 19.6L19.6 21ZM17.5 12C17.5 10.4667 16.9667 9.16667 15.9 8.1C14.8333 7.03333 13.5333 6.5 12 6.5C13.5333 6.5 14.8333 5.96667 15.9 4.9C16.9667 3.83333 17.5 2.53333 17.5 0.999999C17.5 2.53333 18.0333 3.83333 19.1 4.9C20.1667 5.96667 21.4667 6.5 23 6.5C21.4667 6.5 20.1667 7.03333 19.1 8.1C18.0333 9.16667 17.5 10.4667 17.5 12Z" fill="#5F6368"/>
                  </g>
                <defs>
                <clipPath id="clip0_6641_386">
                <rect width="24" height="24" fill="white"/>
                </clipPath>
                </defs>
              </svg>

          </div>
          <div class="devsite-search-shortcut-icon-container" aria-hidden="true">
            <kbd class="devsite-search-shortcut-icon">/</kbd>
          </div>
      </div>
    </div>
  </form>
  <button type="button"
          search-close
          class="devsite-search-button devsite-header-icon-button button-flat material-icons"

          aria-label="Close search"></button>
</devsite-search>

        </div>









          <devsite-appearance-selector></devsite-appearance-selector>


<devsite-language-selector>
  <ul role="presentation">


    <li role="presentation">
      <a role="menuitem" lang="en"
        >English</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="de"
        >Deutsch</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="es_419"
        >Español – América Latina</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="fr"
        >Fran��ais</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="id"
        >Indonesia</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="it"
        >Italiano</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="nl"
        >Nederlands</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="pl"
        >Polski</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="pt_br"
        >Português – Brasil</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="vi"
        >Tiếng Việt</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="tr"
        >Türkçe</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ru"
        >Русский</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="he"
        >עברית</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ar"
        >العربيّة</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="fa"
        >فارسی</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="hi"
        >हिंदी</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="bn"
        >বাংলা</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="th"
        >ภาษาไทย</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_cn"
        >中文 – 简体</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_tw"
        >中文 – 繁體</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ja"
        >日本語</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ko"
        >한국어</a>
    </li>

  </ul>
</devsite-language-selector>







          <devsite-user


                          enable-profiles


                        id="devsite-user">


              <span class="button devsite-top-button" aria-hidden="true" visually-hidden>Sign in</span>

          </devsite-user>



      </div>
    </div>
  </div>



  <div class="devsite-collapsible-section
    ">
    <div class="devsite-header-background">


          <div class="devsite-product-id-row"
           >
            <div class="devsite-product-description-row">


                <div class="devsite-product-id">



                    <ul class="devsite-breadcrumb-list"

    aria-label="Lower header breadcrumb">

  <li class="devsite-breadcrumb-item
             ">





  <a href="https://developer.chrome.com/docs"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Lower Header"

        data-value="1"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="1"

        track-metadata-eventdetail="Docs"

    >

          Docs

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Lower Header"

        data-value="2"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="2"

        track-metadata-eventdetail="Chrome Extensions"

    >

          Chrome Extensions

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions/reference"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Lower Header"

        data-value="3"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="3"

        track-metadata-eventdetail="Reference"

    >

          Reference

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions/reference/api"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Lower Header"

        data-value="4"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="4"

        track-metadata-eventdetail="API"

    >

          API

  </a>



  </li>

</ul>
                </div>



            </div>

          </div>




        <div class="devsite-doc-set-nav-row">




  <devsite-tabs class="lower-tabs">

    <nav class="devsite-tabs-wrapper" aria-label="Lower tabs">


          <tab  >

    <a href="https://developer.chrome.com/docs/extensions"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions"

       track-type="nav"
       track-metadata-position="nav - overview"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Overview"

           track-name="overview"

       >
    Overview

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/docs/extensions/get-started"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/get-started"

       track-type="nav"
       track-metadata-position="nav - get started"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Get Started"

           track-name="get started"

       >
    Get Started

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/docs/extensions/develop"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/develop"

       track-type="nav"
       track-metadata-position="nav - develop"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Develop"

           track-name="develop"

       >
    Develop

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/docs/extensions/how-to"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/how-to"

       track-type="nav"
       track-metadata-position="nav - how to"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: How To"

           track-name="how to"

       >
    How To

    </a>


          </tab>



          <tab  >

    <a href="https://developer.chrome.com/docs/extensions/ai"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/ai"

       track-type="nav"
       track-metadata-position="nav - ai"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: AI"

           track-name="ai"

       >
    AI

    </a>


          </tab>



          <tab class="devsite-dropdown

    devsite-active

    ">

    <a href="https://developer.chrome.com/docs/extensions/reference"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/reference"

       track-type="nav"
       track-metadata-position="nav - reference"
       track-metadata-module="primary nav"
       aria-label="Reference, selected"


           data-category="Site-Wide Custom Events"

           data-label="Tab: Reference"

           track-name="reference"

       >
    Reference

    </a>

      <button
         aria-haspopup="menu"
         aria-expanded="false"
         aria-label="Dropdown menu for Reference"
         track-type="nav"
         track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/reference"
         track-metadata-position="nav - reference"
         track-metadata-module="primary nav"


            data-category="Site-Wide Custom Events"

            data-label="Tab: Reference"

            track-name="reference"


         class="devsite-tabs-dropdown-toggle devsite-icon devsite-icon-arrow-drop-down"></button>


  <div class="devsite-tabs-dropdown" role="menu" aria-label="submenu" hidden>
    <div class="devsite-tabs-dropdown-content">


        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       ">



                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/extensions/reference/api"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/reference/api"
                     track-metadata-position="nav - reference"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      API
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/extensions/reference/permissions-list"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/reference/permissions-list"
                     track-metadata-position="nav - reference"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Permissions
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/extensions/reference/manifest"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/reference/manifest"
                     track-metadata-position="nav - reference"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Manifest
                    </div>

                  </a>
                </li>

            </ul>

        </div>

    </div>
  </div>
</tab>



          <tab  >

    <a href="https://developer.chrome.com/docs/extensions/samples"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/extensions/samples"

       track-type="nav"
       track-metadata-position="nav - samples"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Samples"

           track-name="samples"

       >
    Samples

    </a>


          </tab>



          <tab class="devsite-dropdown



    ">

    <a href="https://developer.chrome.com/docs/webstore"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developer.chrome.com/docs/webstore"

       track-type="nav"
       track-metadata-position="nav - chrome web store"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Chrome Web Store"

           track-name="chrome web store"

       >
    Chrome Web Store

    </a>

      <button
         aria-haspopup="menu"
         aria-expanded="false"
         aria-label="Dropdown menu for Chrome Web Store"
         track-type="nav"
         track-metadata-eventdetail="https://developer.chrome.com/docs/webstore"
         track-metadata-position="nav - chrome web store"
         track-metadata-module="primary nav"


            data-category="Site-Wide Custom Events"

            data-label="Tab: Chrome Web Store"

            track-name="chrome web store"


         class="devsite-tabs-dropdown-toggle devsite-icon devsite-icon-arrow-drop-down"></button>


  <div class="devsite-tabs-dropdown" role="menu" aria-label="submenu" hidden>
    <div class="devsite-tabs-dropdown-content">


        <div class="devsite-tabs-dropdown-column
                    ">

            <ul class="devsite-tabs-dropdown-section
                       ">



                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/webstore/prepare"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/webstore/prepare"
                     track-metadata-position="nav - chrome web store"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Prepare your Extension
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/webstore/publish"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/webstore/publish"
                     track-metadata-position="nav - chrome web store"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Publish in the Chrome Web Store
                    </div>

                  </a>
                </li>

                <li class="devsite-nav-item">
                  <a href="https://developer.chrome.com/docs/webstore/program-policies"

                     track-type="nav"
                     track-metadata-eventdetail="https://developer.chrome.com/docs/webstore/program-policies"
                     track-metadata-position="nav - chrome web store"
                     track-metadata-module="tertiary nav"

                     tooltip
                  >

                    <div class="devsite-nav-item-title">
                      Program Policies
                    </div>

                  </a>
                </li>

            </ul>

        </div>

    </div>
  </div>
</tab>


    </nav>

  </devsite-tabs>



        </div>

    </div>
  </div>

</div>






</devsite-header>
        <devsite-book-nav scrollbars >























<div class="devsite-book-nav-filter"
     >
  <span class="filter-list-icon material-icons" aria-hidden="true"></span>
  <input type="text"
         placeholder="Filter"

         aria-label="Type to filter"
         role="searchbox">

  <span class="filter-clear-button hidden"
        data-title="Clear filter"
        aria-label="Clear filter"
        role="button"
        tabindex="0"></span>
</div>

<nav class="devsite-book-nav devsite-nav nocontent" data-nosnippet
     aria-label="Side menu">
  <div class="devsite-mobile-header">
    <button type="button"
            id="devsite-close-nav"
            class="devsite-header-icon-button button-flat material-icons gc-analytics-event"
            data-category="Site-Wide Custom Events"
            data-label="Close navigation"
            aria-label="Close navigation">
    </button>
    <div class="devsite-product-name-wrapper">

  <a href="/" class="devsite-site-logo-link gc-analytics-event"
   data-category="Site-Wide Custom Events" data-label="Site logo" track-type="globalNav"
   track-name="chromeForDevelopers" track-metadata-position="nav"
   track-metadata-eventDetail="nav">

  <picture>

    <source srcset="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/lockup-dark-theme.svg"
            media="(prefers-color-scheme: dark)"
            class="devsite-dark-theme">

    <img src="https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/lockup.svg" class="devsite-site-logo" alt="Chrome for Developers">
  </picture>

</a>


</div>
  </div>

  <div class="devsite-book-nav-wrapper">
    <div class="devsite-mobile-nav-top">

        <ul class="devsite-nav-list">

            <li class="devsite-nav-item">


  <a href="/docs"

       class="devsite-nav-title gc-analytics-event

              devsite-nav-active"




        data-category="Site-Wide Custom Events"

        data-label="Tab: Docs"

        track-name="docs"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Docs"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Docs
   </span>


  </a>



    <ul class="devsite-nav-responsive-tabs devsite-nav-has-menu
               ">

<li class="devsite-nav-item">


  <span

       class="devsite-nav-title"
       tooltip



        data-category="Site-Wide Custom Events"

        data-label="Tab: Docs"

        track-name="docs"

    >

    <span class="devsite-nav-text" tooltip menu="Docs">
      More
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          menu="Docs">
    </span>


  </span>


</li>

    </ul>


                <ul class="devsite-nav-responsive-tabs">




                    <li class="devsite-nav-item">


  <a href="/docs/extensions"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Overview"

        track-name="overview"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Overview"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Overview
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/get-started"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Get Started"

        track-name="get started"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Get Started"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Get Started
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/develop"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Develop"

        track-name="develop"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Develop"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Develop
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/how-to"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: How To"

        track-name="how to"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: How To"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      How To
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/ai"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: AI"

        track-name="ai"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: AI"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      AI
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/reference"

       class="devsite-nav-title gc-analytics-event
              devsite-nav-has-children
              devsite-nav-active"




        data-category="Site-Wide Custom Events"

        data-label="Tab: Reference"

        track-name="reference"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Reference"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip menu="_book">
      Reference
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          menu="_book">
    </span>


  </a>



    <ul class="devsite-nav-responsive-tabs devsite-nav-has-menu
                devsite-lower-tab-item">

<li class="devsite-nav-item">


  <span

       class="devsite-nav-title"
       tooltip



        data-category="Site-Wide Custom Events"

        data-label="Tab: Reference"

        track-name="reference"

    >

    <span class="devsite-nav-text" tooltip menu="Reference">
      More
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          menu="Reference">
    </span>


  </span>


</li>

    </ul>

                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/extensions/samples"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Samples"

        track-name="samples"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Samples"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Samples
   </span>


  </a>



                    </li>




                    <li class="devsite-nav-item">


  <a href="/docs/webstore"

       class="devsite-nav-title gc-analytics-event
              devsite-nav-has-children
              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Chrome Web Store"

        track-name="chrome web store"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Chrome Web Store"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Chrome Web Store
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          >
    </span>


  </a>



    <ul class="devsite-nav-responsive-tabs devsite-nav-has-menu
                devsite-lower-tab-item">

<li class="devsite-nav-item">


  <span

       class="devsite-nav-title"
       tooltip



        data-category="Site-Wide Custom Events"

        data-label="Tab: Chrome Web Store"

        track-name="chrome web store"

    >

    <span class="devsite-nav-text" tooltip menu="Chrome Web Store">
      More
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          menu="Chrome Web Store">
    </span>


  </span>


</li>

    </ul>

                    </li>

                </ul>

            </li>

            <li class="devsite-nav-item">


  <a href="/case-studies"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Case studies"

        track-name="case studies"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Case studies"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Case studies
   </span>


  </a>




            </li>

            <li class="devsite-nav-item">


  <a href="/blog"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Blog"

        track-name="blog"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Blog"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Blog
   </span>


  </a>




            </li>

            <li class="devsite-nav-item">


  <a href="/new"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: New in Chrome"

        track-name="new in chrome"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: New in Chrome"
     track-type="globalNav"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      New in Chrome
   </span>


  </a>




            </li>



        </ul>

    </div>

      <div class="devsite-mobile-nav-bottom">


          <ul class="devsite-nav-list" menu="_book">
            <li class="devsite-nav-item
           devsite-nav-heading"><div class="devsite-nav-title devsite-nav-title-no-path">
        <span class="devsite-nav-text" tooltip>Manifest V3</span>
      </div></li>

  <li class="devsite-nav-item
           devsite-nav-deprecated"><a href="/docs/extensions/mv2/reference"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>➡ Manifest V2</span><span class="devsite-nav-icon material-icons"
        data-icon="deprecated"
        data-title="Deprecated"
        aria-hidden="true"></span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/accessibilityFeatures"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>accessibilityFeatures</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/action"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>action</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/alarms"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>alarms</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/audio"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>audio</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/bookmarks"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>bookmarks</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/browsingData"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>browsingData</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/certificateProvider"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>certificateProvider</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/commands"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>commands</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/contentSettings"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>contentSettings</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/contextMenus"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>contextMenus</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/cookies"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>cookies</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/debugger"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>debugger</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/declarativeContent"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>declarativeContent</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/declarativeNetRequest"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>declarativeNetRequest</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/desktopCapture"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>desktopCapture</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/devtools/inspectedWindow"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>devtools.inspectedWindow</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/devtools/network"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>devtools.network</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/devtools/panels"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>devtools.panels</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/devtools/performance"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>devtools.performance</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/devtools/recorder"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>devtools.recorder</span></a></li>

  <li class="devsite-nav-item
           devsite-nav-nightly"><a href="/docs/extensions/reference/api/dns"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>dns</span><span class="devsite-nav-icon material-icons"
        data-icon="nightly"
        data-title="Nightly build only"
        aria-hidden="true"></span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/documentScan"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>documentScan</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/dom"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>dom</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/downloads"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>downloads</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/enterprise/deviceAttributes"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>enterprise.deviceAttributes</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/enterprise/hardwarePlatform"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>enterprise.hardwarePlatform</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/enterprise/login"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>enterprise.login</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/enterprise/networkingAttributes"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>enterprise.networkingAttributes</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/enterprise/platformKeys"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>enterprise.platformKeys</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/events"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>events</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/extension"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>extension</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/extensionTypes"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>extensionTypes</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/fileBrowserHandler"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>fileBrowserHandler</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/fileSystemProvider"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>fileSystemProvider</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/fontSettings"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>fontSettings</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/gcm"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>gcm</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/history"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>history</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/i18n"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>i18n</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/identity"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>identity</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/idle"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>idle</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/input/ime"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>input.ime</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/instanceID"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>instanceID</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/loginState"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>loginState</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/management"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>management</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/mimeHandler"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>mimeHandler</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/notifications"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>notifications</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/offscreen"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>offscreen</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/omnibox"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>omnibox</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/pageCapture"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>pageCapture</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/permissions"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>permissions</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/platformKeys"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>platformKeys</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/power"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>power</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/printerProvider"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>printerProvider</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/printing"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>printing</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/printingMetrics"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>printingMetrics</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/privacy"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>privacy</span></a></li>

  <li class="devsite-nav-item
           devsite-nav-nightly"><a href="/docs/extensions/reference/api/processes"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>processes</span><span class="devsite-nav-icon material-icons"
        data-icon="nightly"
        data-title="Nightly build only"
        aria-hidden="true"></span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/proxy"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>proxy</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/publicSuffix"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>publicSuffix</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/readingList"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>readingList</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/runtime"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>runtime</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/scripting"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>scripting</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/search"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>search</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/sessions"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>sessions</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/sidePanel"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>sidePanel</span></a></li>

  <li class="devsite-nav-item
           devsite-nav-expandable"><div class="devsite-expandable-nav">
      <a class="devsite-nav-toggle" aria-hidden="true"></a><div class="devsite-nav-title devsite-nav-title-no-path" tabindex="0" role="button">
        <span class="devsite-nav-text" tooltip>storage</span>
      </div><ul class="devsite-nav-section"><li class="devsite-nav-item"><a href="/docs/extensions/reference/api/storage"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>Overview</span></a></li><li class="devsite-nav-item"><a href="/docs/extensions/reference/api/storage/StorageArea"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>StorageArea</span></a></li></ul></div></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/system/cpu"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>system.cpu</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/system/display"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>system.display</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/system/memory"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>system.memory</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/system/storage"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>system.storage</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/systemLog"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>systemLog</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/tabCapture"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>tabCapture</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/tabGroups"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>tabGroups</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/tabs"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>tabs</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/topSites"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>topSites</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/tts"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>tts</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/ttsEngine"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>ttsEngine</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/types"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>types</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/userScripts"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>userScripts</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/vpnProvider"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>vpnProvider</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/wallpaper"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>wallpaper</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/webAuthenticationProxy"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>webAuthenticationProxy</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/webNavigation"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>webNavigation</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/webRequest"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>webRequest</span></a></li>

  <li class="devsite-nav-item"><a href="/docs/extensions/reference/api/windows"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>windows</span></a></li>
          </ul>





      <ul class="devsite-nav-list" menu="Docs"
          aria-label="Side menu" hidden>




<li class="devsite-nav-item devsite-nav-heading">


  <span

       class="devsite-nav-title"
       tooltip

    >

    <span class="devsite-nav-text" tooltip >
      Build with Chrome
   </span>


  </span>


</li>




<li class="devsite-nav-item">


  <a href="/docs/web-platform"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Web Platform"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Web Platform
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/iwa"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Isolated Web Apps (IWA)"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Isolated Web Apps (IWA)
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/capabilities"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Capabilities"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Capabilities
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/automation-and-testing"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Automation and testing"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Automation and testing
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/chromedriver"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: ChromeDriver"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      ChromeDriver
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/extensions"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Extensions"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Extensions
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/webstore"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Chrome Web Store"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Chrome Web Store
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/chromium"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Chromium"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Chromium
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/android"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Web on Android"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Web on Android
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="https://developer.chrome.com/origintrials/"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Origin trials"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Origin trials
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/release-notes"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Release notes"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Release notes
   </span>


  </a>


</li>







<li class="devsite-nav-item devsite-nav-heading">


  <span

       class="devsite-nav-title"
       tooltip

    >

    <span class="devsite-nav-text" tooltip >
      Productivity
   </span>


  </span>


</li>




<li class="devsite-nav-item">


  <a href="/docs/devtools"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: DevTools"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      DevTools
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/lighthouse"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Lighthouse"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Lighthouse
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/crux"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Chrome UX Report"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Chrome UX Report
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/accessibility"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Accessibility"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Accessibility
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/modern-web-guidance"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Modern Web Guidance"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Modern Web Guidance
   </span>


  </a>


</li>






<li class="devsite-nav-item">


  <a href="/docs/workbox"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Workbox"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Workbox
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/puppeteer"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Puppeteer"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Puppeteer
   </span>


  </a>


</li>







<li class="devsite-nav-item devsite-nav-heading">


  <span

       class="devsite-nav-title"
       tooltip

    >

    <span class="devsite-nav-text" tooltip >
      Experience
   </span>


  </span>


</li>




<li class="devsite-nav-item">


  <a href="/docs/ai"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: AI"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      AI
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/performance"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Performance"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Performance
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/css-ui"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: CSS and UI"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      CSS and UI
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/identity"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Identity"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Identity
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/payments"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Payments"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Payments
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/privacy-security"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Privacy and security"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Privacy and security
   </span>


  </a>


</li>







<li class="devsite-nav-item devsite-nav-heading">


  <span

       class="devsite-nav-title"
       tooltip

    >

    <span class="devsite-nav-text" tooltip >
      Resources
   </span>


  </span>


</li>




<li class="devsite-nav-item">


  <a href="/docs"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: All documentation"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      All documentation
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="https://web.dev/baseline"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Baseline &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Baseline &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="https://web.dev"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: web.dev &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      web.dev &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="https://pagespeed.web.dev"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: PageSpeed Insights audit &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      PageSpeed Insights audit &lt;span class=&#34;material-icons&#34; style=&#34;font-size: 12px;&#34; aria-hidden=&#34;true&#34; translate=&#34;no&#34;&gt;open_in_new&lt;/span&gt;
   </span>


  </a>


</li>




      </ul>























      <ul class="devsite-nav-list" menu="Reference"
          aria-label="Side menu" hidden>





<li class="devsite-nav-item">


  <a href="/docs/extensions/reference/api"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: API"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      API
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/extensions/reference/permissions-list"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Permissions"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Permissions
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/extensions/reference/manifest"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Manifest"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Manifest
   </span>


  </a>


</li>




      </ul>






      <ul class="devsite-nav-list" menu="Chrome Web Store"
          aria-label="Side menu" hidden>





<li class="devsite-nav-item">


  <a href="/docs/webstore/prepare"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Prepare your Extension"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Prepare your Extension
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/webstore/publish"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Publish in the Chrome Web Store"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Publish in the Chrome Web Store
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/docs/webstore/program-policies"

       class="devsite-nav-title gc-analytics-event

              "



     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Program Policies"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Program Policies
   </span>


  </a>


</li>




      </ul>



      </div>

  </div>
</nav>

        </devsite-book-nav>

      <section id="gc-wrapper">
        <main role="main" id="main-content" class="devsite-main-content"

              has-book-nav
              has-sidebar
            >
          <div class="devsite-sidebar">
            <div class="devsite-sidebar-content">

                <devsite-toc class="devsite-nav"
                            role="navigation"
                            aria-label="On this page"
                            depth="2"
                            scrollbars
                            data-nosnippet
                  ></devsite-toc>
                <devsite-recommendations-sidebar class="nocontent devsite-nav" data-nosnippet>
                </devsite-recommendations-sidebar>
            </div>
          </div>
          <devsite-content>












<article class="devsite-article">



    <div class="devsite-banner devsite-banner-announcement nocontent" data-nosnippet


      >
      <div class="devsite-banner-message">
        <div class="devsite-banner-message-text">
          Chrome now supports the standardized <code translate="no" dir="ltr">browser.*</code> namespace (available from Chrome 148). We are gradually updating the documentation. Read more in our <a href="https://developer.chrome.com/docs/extensions/develop/concepts/browser-namespace">transition guide</a>.
        </div>
      </div>
    </div>




  <div class="devsite-article-meta nocontent" role="navigation" data-nosnippet>


    <ul class="devsite-breadcrumb-list"

    aria-label="Breadcrumb">

  <li class="devsite-breadcrumb-item
             ">





  <a href="https://developer.chrome.com/"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="1"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="1"

        track-metadata-eventdetail=""

    >

          Home

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="2"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="2"

        track-metadata-eventdetail="Docs"

    >

          Docs

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="3"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="3"

        track-metadata-eventdetail="Chrome Extensions"

    >

          Chrome Extensions

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions/reference"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="4"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="4"

        track-metadata-eventdetail="Reference"

    >

          Reference

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developer.chrome.com/docs/extensions/reference/api"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="5"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="5"

        track-metadata-eventdetail="API"

    >

          API

  </a>



  </li>

</ul>


    <devsite-thumb-rating position="header">
    </devsite-thumb-rating>


  </div>

    <h1 class="devsite-page-title" tabindex="-1">
      chrome.offscreen<devsite-actions hidden data-nosnippet><devsite-feature-tooltip
      ack-key="AckCollectionsBookmarkTooltipDismiss"
      analytics-category="Site-Wide Custom Events"
      analytics-action-show="Callout Profile displayed"
      analytics-action-close="Callout Profile dismissed"
      analytics-label="Create Collection Callout"
      class="devsite-page-bookmark-tooltip nocontent"
      data-nosnippet
      dismiss-button="true"
      id="devsite-collections-dropdown"

      dismiss-button-text="Dismiss"


      close-button-text="Got it">



      <devsite-bookmark></devsite-bookmark>


    <span slot="popout-heading">

      Stay organized with collections
    </span>
    <span slot="popout-contents">

      Save and categorize content based on your preferences.
    </span>
  </devsite-feature-tooltip>
    <devsite-llm-tools></devsite-llm-tools></devsite-actions>


    </h1>
  <div class="devsite-page-title-meta"><devsite-view-release-notes></devsite-view-release-notes></div>


  <devsite-toc class="devsite-nav"
    depth="2"
    devsite-toc-embedded
    >
  </devsite-toc>


  <div class="devsite-article-body clearfix
  ">




<style>.dcc-reference{--color-hairline: #dadce0;--color-blue-lightest: rgba(232, 240, 254, 0.4);--color-blue-lighter: #d2e3fc;--color-blue-medium: #1967d2;--color-blue-darkest: #174ea6;--rgb-blue-darkest: 23, 78, 166;--color-yellow-lightest: rgba(254, 247, 224, 0.3);--color-yellow-lighter: #feefc3;--color-yellow-medium: #f29900;--color-yellow-darkest: #de7100;--rgb-yellow-darkest: 227, 117, 0;--color-red-lightest: rgba(252, 232, 230, 0.4);--color-red-lighter: rgba(252, 232, 230, 0.5);--color-red-medium: #c5221f;--color-red-darkest: #9f0e0e;--rgb-red-darkest: 165, 14, 14;--color-green-lightest: rgba(230, 244, 234, 0.4);--color-green-lighter: #ceead6;--color-green-medium: #188038;--color-green-darkest: #0d652d;--rgb-green-darkest: 13, 101, 45;--color-purple-lightest: rgba(243, 232, 253, 0.4);--color-purple-lighter: rgba(243, 232, 253, 0.5);--color-purple-medium: #8430ce;--color-purple-darkest: #681da8;--rgb-purple-darkest: 104, 29, 168;--color-pink-lightest: rgba(253, 231, 243, 0.4);--color-pink-lighter: rgba(253, 231, 243, 0.5);--color-pink-medium: #d01884;--color-pink-darkest: #9c166b;--rgb-pink-darkest: 156, 22, 107}.dcc-type--label{font-weight:500;font-size:.75rem;line-height:1.3333333333}.dcc-type--xsmall{font-size:.75rem;line-height:1.6666666667}h2.dcc-api-title{display:none}.dcc-code-sections ul{padding-left:0}.dcc-code-sections .dcc-code-sections{border:1px solid var(--color-hairline);padding:calc(1rem - 1px)}.dcc-code-sections .dcc-code-sections ul>li:first-child{border-top:0;padding-top:0}.dcc-code-sections .dcc-code-sections devsite-code{margin-left:calc(-1rem + 1px);margin-right:calc(-1rem + 1px)}.dcc-code-sections .dcc-type--small{font-size:.875em;line-height:2em}.dcc-code-sections__label{font-size:.875rem;line-height:2}.dcc-code-sections__type>:not(:last-child){margin-right:.5ch}.dcc-code-sections__enum{margin-bottom:1rem}.dcc-code-sections__icon::before{background:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcuNzc2MzkgMS41NTI3OUM3LjkxNzE2IDEuNDgyNCA4LjA4Mjg0IDEuNDgyNCA4LjIyMzYxIDEuNTUyNzlMMTQuMjIzNiA0LjU1Mjc5QzE0LjM5MyA0LjYzNzQ4IDE0LjUgNC44MTA2MSAxNC41IDVWMTFDMTQuNSAxMS4xODk0IDE0LjM5MyAxMS4zNjI1IDE0LjIyMzYgMTEuNDQ3Mkw4LjIyMzYxIDE0LjQ0NzJDOC4wODI4NCAxNC41MTc2IDcuOTE3MTYgMTQuNTE3NiA3Ljc3NjM5IDE0LjQ0NzJMMS43NzYzOSAxMS40NDcyQzEuNjA3IDExLjM2MjUgMS41IDExLjE4OTQgMS41IDExVjVDMS41IDQuODEwNjEgMS42MDcgNC42Mzc0OCAxLjc3NjM5IDQuNTUyNzlMNy43NzYzOSAxLjU1Mjc5Wk0yLjUgNS44MDkwMlYxMC42OTFMNy41IDEzLjE5MVY4LjMwOTAyTDIuNSA1LjgwOTAyWk04LjUgOC4zMDkwMlYxMy4xOTFMMTMuNSAxMC42OTFWNS44MDkwMkw4LjUgOC4zMDkwMlpNMTIuODgyIDVMOCA3LjQ0MDk4TDMuMTE4MDMgNUw4IDIuNTU5MDJMMTIuODgyIDVaIiBmaWxsPSIjNUY2MzY4Ii8+Cjwvc3ZnPgo=") center/contain no-repeat;content:"";display:inline-block;height:1.25em;margin-right:.5ch;vertical-align:middle;width:1.25em}.dcc-code-sections__icon.dcc-code-sections__icon--number::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNiAyLjVINFY0LjVINlYyLjVaIiBmaWxsPSIjNUY2MzY4Ii8+CjxwYXRoIGQ9Ik02IDUuNUg0VjcuNUg2VjUuNVoiIGZpbGw9IiM1RjYzNjgiLz4KPHBhdGggZD0iTTQgOC41SDZWMTAuNUg0VjguNVoiIGZpbGw9IiM1RjYzNjgiLz4KPHBhdGggZD0iTTkgMi41SDdWNC41SDlWMi41WiIgZmlsbD0iIzVGNjM2OCIvPgo8cGF0aCBkPSJNNyA1LjVIOVY3LjVIN1Y1LjVaIiBmaWxsPSIjNUY2MzY4Ii8+CjxwYXRoIGQ9Ik05IDguNUg3VjEwLjVIOVY4LjVaIiBmaWxsPSIjNUY2MzY4Ii8+CjxwYXRoIGQ9Ik03IDExLjVIOVYxMy41SDdWMTEuNVoiIGZpbGw9IiM1RjYzNjgiLz4KPHBhdGggZD0iTTEyIDIuNUgxMFY0LjVIMTJWMi41WiIgZmlsbD0iIzVGNjM2OCIvPgo8cGF0aCBkPSJNMTAgNS41SDEyVjcuNUgxMFY1LjVaIiBmaWxsPSIjNUY2MzY4Ii8+CjxwYXRoIGQ9Ik0xMiA4LjVIMTBWMTAuNUgxMlY4LjVaIiBmaWxsPSIjNUY2MzY4Ii8+Cjwvc3ZnPgo=")}.dcc-code-sections__icon.dcc-code-sections__icon--string::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNC43MTQyOSAxMkg1Ljg1NzE0TDcuMjg1NzEgOC4yODU3MVY0LjVDNy4yODU3MSA0LjIyMzg2IDcuMDYxODYgNCA2Ljc4NTcxIDRIMy41QzMuMjIzODYgNCAzIDQuMjIzODYgMyA0LjVWNy43ODU3MUMzIDguMDYxODYgMy4yMjM4NiA4LjI4NTcxIDMuNSA4LjI4NTcxSDYuMTQyODZMNC43MTQyOSAxMlpNMTAuNDI4NiAxMkgxMS41NzE0TDEzIDguMjg1NzFWNC41QzEzIDQuMjIzODYgMTIuNzc2MSA0IDEyLjUgNEg5LjIxNDI5QzguOTM4MTQgNCA4LjcxNDI5IDQuMjIzODYgOC43MTQyOSA0LjVWNy43ODU3MUM4LjcxNDI5IDguMDYxODYgOC45MzgxNCA4LjI4NTcxIDkuMjE0MjkgOC4yODU3MUgxMS44NTcxTDEwLjQyODYgMTJaIiBmaWxsPSIjNUY2MzY4Ii8+Cjwvc3ZnPgo=")}.dcc-code-sections__icon.dcc-code-sections__icon--boolean::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTIuMzUzNiA1Ljg1MzU1TDExLjY0NjQgNS4xNDY0NUw3IDkuNzkyODlMNC44NTM1NSA3LjY0NjQ1TDQuMTQ2NDUgOC4zNTM1NUw3IDExLjIwNzFMMTIuMzUzNiA1Ljg1MzU1WiIgZmlsbD0iIzVGNjM2OCIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIgM0MyIDIuNDQ3NzIgMi40NDc3MiAyIDMgMkgxM0MxMy41NTIzIDIgMTQgMi40NDc3MiAxNCAzVjEzQzE0IDEzLjU1MjMgMTMuNTUyMyAxNCAxMyAxNEgzQzIuNDQ3NzIgMTQgMiAxMy41NTIzIDIgMTNWM1pNMyAzSDEzVjEzSDNMMyAzWiIgZmlsbD0iIzVGNjM2OCIvPgo8L3N2Zz4K")}.dcc-code-sections__icon.dcc-code-sections__icon--function::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMuNSA0QzMuNSAyLjYxOTI5IDQuNjE5MjkgMS41IDYgMS41SDYuNVYyLjVINkM1LjE3MTU3IDIuNSA0LjUgMy4xNzE1NyA0LjUgNFY1Ljc2MzkzQzQuNSA2LjcxMDg2IDMuOTY0OTkgNy41NzY1MiAzLjExODAzIDhDMy45NjQ5OSA4LjQyMzQ4IDQuNSA5LjI4OTE0IDQuNSAxMC4yMzYxVjEyQzQuNSAxMi44Mjg0IDUuMTcxNTcgMTMuNSA2IDEzLjVINi41VjE0LjVINkM0LjYxOTI5IDE0LjUgMy41IDEzLjM4MDcgMy41IDEyVjEwLjIzNjFDMy41IDkuNjY3OTEgMy4xNzkgOS4xNDg1MiAyLjY3MDgyIDguODk0NDNMMS43NzYzOSA4LjQ0NzIxQzEuNjA3IDguMzYyNTIgMS41IDguMTg5MzkgMS41IDhDMS41IDcuODEwNjEgMS42MDcgNy42Mzc0OCAxLjc3NjM5IDcuNTUyNzlMMi42NzA4MiA3LjEwNTU3QzMuMTc5IDYuODUxNDggMy41IDYuMzMyMDkgMy41IDUuNzYzOTNWNFpNMTAgMi41SDkuNVYxLjVIMTBDMTEuMzgwNyAxLjUgMTIuNSAyLjYxOTI5IDEyLjUgNFY1Ljc2MzkzQzEyLjUgNi4zMzIwOSAxMi44MjEgNi44NTE0OCAxMy4zMjkyIDcuMTA1NTdMMTQuMjIzNiA3LjU1Mjc5QzE0LjM5MyA3LjYzNzQ4IDE0LjUgNy44MTA2MSAxNC41IDhDMTQuNSA4LjE4OTM5IDE0LjM5MyA4LjM2MjUyIDE0LjIyMzYgOC40NDcyMUwxMy4zMjkyIDguODk0NDNDMTIuODIxIDkuMTQ4NTIgMTIuNSA5LjY2NzkxIDEyLjUgMTAuMjM2MVYxMkMxMi41IDEzLjM4MDcgMTEuMzgwNyAxNC41IDEwIDE0LjVIOS41VjEzLjVIMTBDMTAuODI4NCAxMy41IDExLjUgMTIuODI4NCAxMS41IDEyVjEwLjIzNjFDMTEuNSA5LjI4OTE0IDEyLjAzNSA4LjQyMzQ4IDEyLjg4MiA4QzEyLjAzNSA3LjU3NjUyIDExLjUgNi43MTA4NiAxMS41IDUuNzYzOTNWNEMxMS41IDMuMTcxNTcgMTAuODI4NCAyLjUgMTAgMi41WiIgZmlsbD0iIzVGNjM2OCIvPgo8L3N2Zz4K")}.dcc-code-sections__icon.dcc-code-sections__icon--array::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEyIDYuNUg0VjkuNUgxMlY2LjVaTTEyIDUuNUg0VjNIMTJWNS41Wk0xMyAzQzEzIDIuNDQ3NzIgMTIuNTUyMyAyIDEyIDJINEMzLjQ0NzcyIDIgMyAyLjQ0NzcyIDMgM1YxM0MzIDEzLjU1MjMgMy40NDc3MiAxNCA0IDE0SDEyQzEyLjU1MjMgMTQgMTMgMTMuNTUyMyAxMyAxM1YzWk0xMiAxMC41SDRWMTNIMTJWMTAuNVoiIGZpbGw9IiM1RjYzNjgiLz4KPC9zdmc+Cg==")}.dcc-code-sections__icon.dcc-code-sections__icon--reference::before{background-image:url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMyAySDhWM0gzTDMgMTNIMTNWOEgxNFYxM0MxNCAxMy41NTIzIDEzLjU1MjMgMTQgMTMgMTRIM0MyLjQ0NzcyIDE0IDIgMTMuNTUyMyAyIDEzVjNDMiAyLjQ0NzcyIDIuNDQ3NzIgMiAzIDJaIiBmaWxsPSIjNUY2MzY4Ii8+CjxwYXRoIGQ9Ik05LjUgM0gxMi4yOTI5TDUuNjQ2NDUgOS42NDY0NUw2LjM1MzU1IDEwLjM1MzZMMTMgMy43MDcxMVY2LjVIMTRWMkg5LjVWM1oiIGZpbGw9IiM1RjYzNjgiLz4KPC9zdmc+Cg==")}.dcc-code-sections__optional{color:var(--color-pink-medium)}.dcc-code-sections__value{color:var(--color-code-number)}.dcc-code-sections__deprecated{color:var(--color-red-medium)}.dcc-code-sections__callback{display:block}p>.dcc-code-sections__callback{margin-top:.5em}.dcc-code-sections__overline{border-top:1px solid var(--color-hairline);margin:1em 0;padding-top:get-size(300)}.dcc-code-sections__mode{color:var(--color-code-comment);text-transform:uppercase}.dcc-code-sections li{border-top:1px solid var(--color-hairline);display:flex;flex-direction:column;padding-top:get-size(300);position:relative}.dcc-code-sections li>:first-child{font-weight:500;flex:0 0 auto;flex-shrink:1;min-width:9rem;padding-right:1rem}.dcc-code-sections li>:not(:first-child){flex-grow:1}.dcc-code-sections--summary{padding-left:0}.dcc-code-sections--summary>li:first-child{border-top:0;padding-top:0}@media(min-width: 992px){.dcc-code-sections--summary>li{flex-direction:row}}.dcc-code-sections--summary>li>:first-child{min-width:6.5rem}.dcc-tag-pill{--flow-space: 0.25rem;box-sizing:border-box;border-radius:.75rem;font-weight:500;font-size:.75rem;line-height:1.3333333333;margin:calc(var(--flow-space)/2);background-color:var(--color-blue-lightest);color:var(--color-blue-darkest);margin-bottom:.5rem;padding:.25rem .75rem;cursor:help}.dcc-tag-pill--blue{background-color:var(--color-blue-lightest);color:var(--color-blue-darkest)}.dcc-tag-pill--yellow{background-color:var(--color-yellow-lightest);color:var(--color-yellow-darkest)}.dcc-tag-pill--red{background-color:var(--color-red-lightest);color:var(--color-red-darkest)}.dcc-tag-pill--green{background-color:var(--color-green-lightest);color:var(--color-green-darkest)}.dcc-tag-pill--pink{background-color:var(--color-pink-lightest);color:var(--color-pink-darkest)}.dcc-tag-pill--purple{background-color:var(--color-purple-lightest);color:var(--color-purple-darkest)}a>.dcc-tag-pill{cursor:pointer}</style>




<p></p>

<p><h2 class="dcc-api-title" data-text="Description" id="description" tabindex="-1">Description</h2>
<div class="dcc-reference"><p>Use the <code translate="no" dir="ltr">offscreen</code> API to create and manage offscreen documents.</p></div></p>

<p><h2 id="permissions" data-text="Permissions" tabindex="-1">Permissions</h2>
<div class="dcc-reference"><code translate="no" dir="ltr">offscreen</code><br /></div></p>

<p>To use the Offscreen API, declare the <code translate="no" dir="ltr">&quot;offscreen&quot;</code> permission in the <a href="/docs/extensions/reference/manifest">extension manifest</a>. For example:</p>
<div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="JSON"><code translate="no" dir="ltr"><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nt">"name"</span><span class="devsite-syntax-p">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s2">"My extension"</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-err">...</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nt">"permissions"</span><span class="devsite-syntax-p">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-s2">"offscreen"</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">],</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-err">...</span>
<span class="devsite-syntax-p">}</span>
</code></pre></devsite-code>
<p><h2 id="availability" data-text="Availability" tabindex="-1">Availability</h2>
<div class="dcc-reference"><div class="">
      <div><span class="dcc-tag-pill--blue dcc-tag-pill" title="Available from this Chrome version and higher">Chrome 109+
      </span><span class="dcc-tag-pill--purple dcc-tag-pill" title="Minimum manifest version">MV3+
      </span></div>
    </div></div></p>

<p></p>

<h2 id="concepts_and_usage" data-text="Concepts and usage" tabindex="-1">Concepts and usage</h2>

<p>Service workers don&#39;t have DOM access, and many websites have content security policies that
limit the functionality of content scripts. The Offscreen API allows the extension to use DOM
APIs in a hidden document without interrupting the user experience by opening new windows or
tabs. The <a href="/docs/extensions/reference/runtime"><code translate="no" dir="ltr">runtime</code></a> API is the only extensions API
supported by offscreen documents.</p>

<p>Pages loaded as offscreen documents are handled differently from other types of extension pages.
The extension&#39;s permissions carry over to offscreen documents, but with limits on extension API
access. For example, because the <a href="/docs/extensions/reference/api/runtime"><code translate="no" dir="ltr">chrome.runtime</code></a> API is the only
extensions API supported by offscreen documents, messaging must be handled
using members of that API.</p>

<p>The following are other ways offscreen documents behave differently from normal pages:</p>

<ul>
<li>An offscreen document&#39;s URL must be a static HTML file bundled with the extension.</li>
<li>Offscreen documents can&#39;t be focused.</li>
<li>An offscreen document is an instance of <a href="https://developer.mozilla.org/docs/Web/API/Window"><code translate="no" dir="ltr">window</code></a>, but the value of its <code translate="no" dir="ltr">opener</code> property is always <code translate="no" dir="ltr">null</code>.</li>
<li>Though an extension package can contain multiple offscreen documents, an installed extension can only
have one open at a time. If the extension is running
in split mode with an active incognito profile, the normal and incognito profiles can each
have one offscreen document.</li>
</ul>

<p>Use <a href="#method-createDocument"><code translate="no" dir="ltr">chrome.offscreen.createDocument()</code></a> and
<a href="#method-closeDocument"><code translate="no" dir="ltr">chrome.offscreen.closeDocument()</code></a> to create and close an offscreen
document. <code translate="no" dir="ltr">createDocument()</code> requires the document&#39;s <code translate="no" dir="ltr">url</code>, a reason, and a justification:</p>
<div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="JavaScript"><code translate="no" dir="ltr"><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">offscreen</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">createDocument</span><span class="devsite-syntax-p">({</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nx">url</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'off_screen.html'</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nx">reasons</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-s1">'CLIPBOARD'</span><span class="devsite-syntax-p">],</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nx">justification</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'reason for needing the document'</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-p">});</span>
</code></pre></devsite-code>
<h3 id="reasons" data-text="Reasons" tabindex="-1">Reasons</h3>

<p>For a list of valid reasons, see the <a href="/docs/extensions/reference/api/offscreen#type-Reason">Reasons</a> section. Reasons are set during
document creation to determine the document&#39;s lifespan. The <code translate="no" dir="ltr">AUDIO_PLAYBACK</code> reason sets the
document to close after 30 seconds without audio playing. All other reasons don&#39;t set lifetime limits.</p>

<h2 id="examples" data-text="Examples" tabindex="-1">Examples</h2>

<h3 id="maintain_the_lifecycle_of_an_offscreen_document" data-text="Maintain the lifecycle of an offscreen document" tabindex="-1">Maintain the lifecycle of an offscreen document</h3>

<p>The following example shows how to ensure that an offscreen document exists. The
<code translate="no" dir="ltr">setupOffscreenDocument()</code> function calls <a href="/docs/extensions/reference/api/runtime#method-getContexts"><code translate="no" dir="ltr">runtime.getContexts()</code></a> to find
an existing offscreen document, or creates the document if it doesn&#39;t already exist.</p>
<div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="JavaScript"><code translate="no" dir="ltr"><span class="devsite-syntax-kd">let</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-p">;</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-c1">// A global promise to avoid concurrency issues</span>
<span class="devsite-syntax-k">async</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-kd">function</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">setupOffscreenDocument</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">path</span><span class="devsite-syntax-p">)</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-c1">// Check all windows controlled by the service worker to see if one</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-c1">// of them is the offscreen document with the given path</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-kd">const</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">offscreenUrl</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">getURL</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">path</span><span class="devsite-syntax-p">);</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-kd">const</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">existingContexts</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">getContexts</span><span class="devsite-syntax-p">({</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">contextTypes</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-s1">'OFFSCREEN_DOCUMENT'</span><span class="devsite-syntax-p">],</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">documentUrls</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-nx">offscreenUrl</span><span class="devsite-syntax-p">]</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">});</span>

<span class="devsite-syntax-w">  </span><span class="devsite-syntax-k">if</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">existingContexts</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">length</span><span class="devsite-syntax-w"> &gt; </span><span class="devsite-syntax-mf">0</span><span class="devsite-syntax-p">)</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-k">return</span><span class="devsite-syntax-p">;</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">}</span>

<span class="devsite-syntax-w">  </span><span class="devsite-syntax-c1">// create offscreen document</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-k">if</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-p">)</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-p">;</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">}</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-k">else</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">offscreen</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">createDocument</span><span class="devsite-syntax-p">({</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-nx">url</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">path</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-nx">reasons</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-s1">'CLIPBOARD'</span><span class="devsite-syntax-p">],</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-nx">justification</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'reason for needing the document'</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-p">});</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-p">;</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">creating</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-kc">null</span><span class="devsite-syntax-p">;</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">}</span>
<span class="devsite-syntax-p">}</span>
</code></pre></devsite-code>
<p>Before sending a message to an offscreen document, call <code translate="no" dir="ltr">setupOffscreenDocument()</code> to make sure
the document exists, as demonstrated in the following example.</p>
<div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="JavaScript"><code translate="no" dir="ltr"><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">action</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">onClicked</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">addListener</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-k">async</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">()</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span>&gt;<span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">setupOffscreenDocument</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-s1">'off_screen.html'</span><span class="devsite-syntax-p">);</span>

<span class="devsite-syntax-w">  </span><span class="devsite-syntax-c1">// Send message to offscreen document</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">sendMessage</span><span class="devsite-syntax-p">({</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">type</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'...'</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">target</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'offscreen'</span><span class="devsite-syntax-p">,</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-nx">data</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-s1">'...'</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">});</span>
<span class="devsite-syntax-p">});</span>
</code></pre></devsite-code>
<p>For complete examples, see the <a href="https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/cookbook.offscreen-clipboard-write">offscreen-clipboard</a> and
<a href="https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/cookbook.offscreen-dom">offscreen-dom</a> demos on GitHub.</p>

<h3 id="before_chrome_116_check_if_an_offscreen_document_is_open" data-text="Before Chrome 116: check if an offscreen document is open" tabindex="-1">Before Chrome 116: check if an offscreen document is open</h3>

<p><a href="/docs/extensions/reference/api/runtime#method-getContexts"><code translate="no" dir="ltr">runtime.getContexts()</code></a> was added in Chrome 116. In earlier versions of
Chrome, use <a href="https://developer.mozilla.org/docs/Web/API/Clients/matchAll"><code translate="no" dir="ltr">clients.matchAll()</code></a>
to check for an existing offscreen document:</p>
<div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="JavaScript"><code translate="no" dir="ltr"><span class="devsite-syntax-k">async</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-kd">function</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">hasOffscreenDocument</span><span class="devsite-syntax-p">()</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-k">if</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-s1">'getContexts'</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-ow">in</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">)</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-kd">const</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">contexts</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">getContexts</span><span class="devsite-syntax-p">({</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-nx">contextTypes</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-s1">'OFFSCREEN_DOCUMENT'</span><span class="devsite-syntax-p">],</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-nx">documentUrls</span><span class="devsite-syntax-o">:</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">[</span><span class="devsite-syntax-nx">OFFSCREEN_DOCUMENT_PATH</span><span class="devsite-syntax-p">]</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-p">});</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-k">return</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nb">Boolean</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">contexts</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">length</span><span class="devsite-syntax-p">);</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">}</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-k">else</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-kd">const</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">matchedClients</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-k">await</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">clients</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">matchAll</span><span class="devsite-syntax-p">();</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-k">return</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">matchedClients</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">some</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">client</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-o">=</span>&gt;<span class="devsite-syntax-w"> </span><span class="devsite-syntax-p">{</span>
<span class="devsite-syntax-w">      </span><span class="devsite-syntax-k">return</span><span class="devsite-syntax-w"> </span><span class="devsite-syntax-nx">client</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">url</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">includes</span><span class="devsite-syntax-p">(</span><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">runtime</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">id</span><span class="devsite-syntax-p">);</span>
<span class="devsite-syntax-w">    </span><span class="devsite-syntax-p">});</span>
<span class="devsite-syntax-w">  </span><span class="devsite-syntax-p">}</span>
<span class="devsite-syntax-p">}</span>
</code></pre></devsite-code>
<p><div class="dcc-reference"><h2 id="type" data-text="Types" tabindex="-1">Types</h2>
  <div><div>
    <div class="notranslate">
      <h3 id="type-CreateParameters" data-text="CreateParameters" tabindex="-1">CreateParameters</h3>
    </div></div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="properties" data-text="Properties" tabindex="-1">Properties</h4><ul class="stack"><li class="stack">
    <div>
      <div class="dcc-code-sections__label" id="property-CreateParameters-justification">justification</div>
      <div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--string">string</p></div>
    </div><p>A developer-provided string that explains, in more detail, the need for the background context. The user agent _may_ use this in display to the user.</p>
</li><li class="stack">
    <div>
      <div class="dcc-code-sections__label" id="property-CreateParameters-reasons">reasons</div>
      <div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--array"><a href="#type-Reason">Reason</a>[]</p></div>
    </div><p>The reason(s) the extension is creating the offscreen document.</p>
</li><li class="stack">
    <div>
      <div class="dcc-code-sections__label" id="property-CreateParameters-url">url</div>
      <div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--string">string</p></div>
    </div><p>The (relative) URL to load in the document.</p>
</li></ul>
    </div><div>
    <div class="notranslate">
      <h3 id="type-Reason" data-text="Reason" tabindex="-1">Reason</h3>
    </div></div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="enum" data-text="Enum" tabindex="-1">Enum</h4><div class="dcc-code-sections__overline dcc-code-sections__label">
      <p><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;TESTING&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">A reason used for testing purposes only.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;AUDIO_PLAYBACK&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document is responsible for playing audio.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;IFRAME_SCRIPTING&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to embed and script an iframe in order to modify the iframe's content.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;DOM_SCRAPING&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to embed an iframe and scrape its DOM to extract information.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;BLOBS&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to interact with Blob objects (including <code translate="no" dir="ltr">URL.createObjectURL()</code>).</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;DOM_PARSER&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to use the <a href="https://developer.mozilla.org/en-US/docs/Web/API/DOMParser">DOMParser API</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;USER_MEDIA&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to interact with media streams from user media (e.g. <code translate="no" dir="ltr">getUserMedia()</code>).</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;DISPLAY_MEDIA&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to interact with media streams from display media (e.g. <code translate="no" dir="ltr">getDisplayMedia()</code>).</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;WEB_RTC&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to use <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API">WebRTC APIs</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;CLIPBOARD&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to interact with the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API">Clipboard API</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;LOCAL_STORAGE&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs access to <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage">localStorage</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;WORKERS&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to spawn workers.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;BATTERY_STATUS&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to use <a href="https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API">navigator.getBattery</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;MATCH_MEDIA&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to use <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia">window.matchMedia</a>.</span></p></span><span style="white-space: nowrap;"><p class="dcc-code-sections__icon dcc-code-sections__icon--stringdcc-code-sections__enum"><span class="dcc-code-sections__value">&quot;GEOLOCATION&quot;</span> <br> <span class="dcc-type--xsmall" style="white-space: initial">Specifies that the offscreen document needs to use <a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/geolocation">navigator.geolocation</a>.</span></p></span></p>
    </div>
  </div></div><h2 id="method" data-text="Methods" tabindex="-1">Methods</h2>
  <div><div>
    <div class="notranslate">
      <h3 id="method-closeDocument" data-text="closeDocument()" tabindex="-1">closeDocument()</h3>
    </div><span class="dcc-code-sections__callback dcc-type--xsmall">
        <div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="TypeScript"><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">offscreen</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">closeDocument</span><span class="devsite-syntax-p">()</span><span class="devsite-syntax-o">:</span>&nbsp;<span class="devsite-syntax-nx">Promise&lt;void&gt;</span></pre></devsite-code>
      </span><p>Closes the currently-open offscreen document for the extension.</p>
</div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="returns" data-text="Returns" tabindex="-1">Returns</h4><ul class="stack">
          <li class="stack">
            <div><div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--object">Promise&lt;void&gt;</p></div>
            </div><p>Promise that resolves when the offscreen document has been closed.</p>
</li>
        </ul>
      </div><div>
    <div class="notranslate">
      <h3 id="method-createDocument" data-text="createDocument()" tabindex="-1">createDocument()</h3>
    </div><span class="dcc-code-sections__callback dcc-type--xsmall">
        <div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="TypeScript"><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">offscreen</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">createDocument</span><span class="devsite-syntax-p">(</span><br />&nbsp;&nbsp;<span class="devsite-syntax-nx">parameters</span><span class="devsite-syntax-o">:</span>&nbsp;<a href="#type-CreateParameters"><span class="devsite-syntax-kt">CreateParameters</span></a><span class="devsite-syntax-p">,<br />)</span><span class="devsite-syntax-o">:</span>&nbsp;<span class="devsite-syntax-nx">Promise&lt;void&gt;</span></pre></devsite-code>
      </span><p>Creates a new offscreen document for the extension.</p>
</div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="parameters" data-text="Parameters" tabindex="-1">Parameters</h4><ul class="stack"><li class="stack">
    <div>
      <div class="dcc-code-sections__label" id="type-createDocument-parameters">parameters</div>
      <div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--object"><a href="#type-CreateParameters">CreateParameters</a></p></div>
    </div><p>The parameters describing the offscreen document to create.</p>
</li></ul>
    </div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="returns_1" data-text="Returns" tabindex="-1">Returns</h4><ul class="stack">
          <li class="stack">
            <div><div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--object">Promise&lt;void&gt;</p></div>
            </div><p>Promise that resolves when the offscreen document is created and has completed its initial page load.</p>
</li>
        </ul>
      </div><div>
    <div class="notranslate">
      <h3 id="method-hasDocument" data-text="hasDocument()" tabindex="-1">hasDocument()</h3>
    </div><div class="">
      <div><span class="dcc-tag-pill--blue dcc-tag-pill" title="Available from this Chrome version and higher">Chrome 150+
      </span></div>
    </div><span class="dcc-code-sections__callback dcc-type--xsmall">
        <div></div><devsite-code><pre class="devsite-click-to-copy" translate="no" dir="ltr" is-upgraded syntax="TypeScript"><span class="devsite-syntax-nx">chrome</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">offscreen</span><span class="devsite-syntax-p">.</span><span class="devsite-syntax-nx">hasDocument</span><span class="devsite-syntax-p">()</span><span class="devsite-syntax-o">:</span>&nbsp;<span class="devsite-syntax-nx">Promise&lt;boolean&gt;</span></pre></devsite-code>
      </span><p>Determines whether the extension has an active document.</p>
</div><div class="dcc-code-sections"><h4 class="dcc-type--label dcc-code-sections__mode" id="returns_2" data-text="Returns" tabindex="-1">Returns</h4><ul class="stack">
          <li class="stack">
            <div><div class="dcc-type--xsmall"><p class="dcc-code-sections__icon dcc-code-sections__icon--object">Promise&lt;boolean&gt;</p></div>
            </div><p>Promise that resolves with the result of whether the extension has an active offscreen document.</p>
</li>
        </ul>
      </div></div></div>
</p>




</div>





    <devsite-thumb-rating position="footer">
    </devsite-thumb-rating>






  <div class="devsite-floating-action-buttons"></div></article>


<devsite-content-footer class="nocontent" data-nosnippet>
  <p>Except as otherwise noted, the content of this page is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 License</a>, and code samples are licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0 License</a>. For details, see the <a href="https://developers.google.com/site-policies">Google Developers Site Policies</a>. Java is a registered trademark of Oracle and/or its affiliates.</p>
  <p>Last updated 2026-06-30 UTC.</p>
</devsite-content-footer>


<devsite-notification
>
</devsite-notification>



<div class="devsite-content-data">


    <template class="devsite-content-data-template">
      [[["Easy to understand","easyToUnderstand","thumb-up"],["Solved my problem","solvedMyProblem","thumb-up"],["Other","otherUp","thumb-up"]],[["Missing the information I need","missingTheInformationINeed","thumb-down"],["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"],["Out of date","outOfDate","thumb-down"],["Samples / code issue","samplesCodeIssue","thumb-down"],["Other","otherDown","thumb-down"]],["Last updated 2026-06-30 UTC."],[],[]]
    </template>

</div>

          </devsite-content>
        </main>
        <devsite-footer-promos class="devsite-footer">



        </devsite-footer-promos>
        <devsite-footer-linkboxes class="devsite-footer">


<nav class="devsite-footer-linkboxes nocontent"
     aria-label="Footer links"
     data-nosnippet>

  <ul class="devsite-footer-linkboxes-list">

    <li class="devsite-footer-linkbox ">
    <h3 class="devsite-footer-linkbox-heading no-link">Contribute</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="https://issuetracker.google.com/issues/new?component=1400036&amp;template=1897236"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            File a bug

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://issuetracker.google.com/issues?q=status:open%20componentid:1400036&amp;s=created_time:desc"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >





            See open issues

          </a>


        </li>

      </ul>
    </li>

    <li class="devsite-footer-linkbox ">
    <h3 class="devsite-footer-linkbox-heading no-link">Related content</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="https://blog.chromium.org/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            Chromium updates

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/case-studies"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >


            Case studies

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/deprecated"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 3)"
            >


            Archive

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://web.dev/shows"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 4)"
            >





            Podcasts &amp; shows

          </a>


        </li>

      </ul>
    </li>

    <li class="devsite-footer-linkbox ">
    <h3 class="devsite-footer-linkbox-heading no-link">Follow</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="https://twitter.com/ChromiumDev"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            @ChromiumDev on X

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://www.youtube.com/user/ChromeDevelopers"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >


            YouTube

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://www.linkedin.com/showcase/chrome-for-developers"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 3)"
            >


            Chrome for Developers on LinkedIn

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/static/blog/feed.xml"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 4)"
            >





            RSS

          </a>


        </li>

      </ul>
    </li>

  </ul>

</nav>

        </devsite-footer-linkboxes>
        <devsite-footer-utility class="devsite-footer">



<div class="devsite-footer-utility nocontent" data-nosnippet>



  <nav class="devsite-footer-utility-links" aria-label="Utility links">

    <ul class="devsite-footer-utility-list">

      <li class="devsite-footer-utility-item
                 ">


        <a class="devsite-footer-utility-link gc-analytics-event"
           href="//policies.google.com/terms"
           data-category="Site-Wide Custom Events"
           data-label="Footer Terms link"
         >
          Terms
        </a>

      </li>

      <li class="devsite-footer-utility-item
                 ">


        <a class="devsite-footer-utility-link gc-analytics-event"
           href="//policies.google.com/privacy"
           data-category="Site-Wide Custom Events"
           data-label="Footer Privacy link"
         >
          Privacy
        </a>

      </li>

      <li class="devsite-footer-utility-item
                 glue-cookie-notification-bar-control">


        <a class="devsite-footer-utility-link gc-analytics-event"
           href="#"
           data-category="Site-Wide Custom Events"
           data-label="Footer Manage cookies link"

           aria-hidden="true"
         >
          Manage cookies
        </a>

      </li>

    </ul>


<devsite-language-selector>
  <ul role="presentation">


    <li role="presentation">
      <a role="menuitem" lang="en"
        >English</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="de"
        >Deutsch</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="es_419"
        >Español – América Latina</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="fr"
        >Français</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="id"
        >Indonesia</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="it"
        >Italiano</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="nl"
        >Nederlands</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="pl"
        >Polski</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="pt_br"
        >Português – Brasil</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="vi"
        >Tiếng Việt</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="tr"
        >Türkçe</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ru"
        >Русский</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="he"
        >עברית</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ar"
        >العربيّة</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="fa"
        >فارسی</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="hi"
        >हिंदी</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="bn"
        >বাংলা</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="th"
        >ภาษาไทย</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_cn"
        >中文 – 简体</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_tw"
        >中文 – 繁體</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ja"
        >日本語</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ko"
        >한국어</a>
    </li>

  </ul>
</devsite-language-selector>

  </nav>
</div>

        </devsite-footer-utility>
        <devsite-panel>

        </devsite-panel>

      </section>
      </section>
    <devsite-sitemask></devsite-sitemask>
    <devsite-snackbar></devsite-snackbar>
    <devsite-tooltip ></devsite-tooltip>
    <devsite-heading-link></devsite-heading-link>
    <devsite-analytics>

        <script type="application/json" analytics>[]</script>
<script type="application/json" tag-management>{&#34;at&#34;: &#34;True&#34;, &#34;ga4&#34;: [], &#34;ga4p&#34;: [], &#34;gtm&#34;: [{&#34;id&#34;: &#34;GTM-5QF3RT2&#34;, &#34;purpose&#34;: 0}], &#34;parameters&#34;: {&#34;internalUser&#34;: &#34;False&#34;, &#34;language&#34;: {&#34;machineTranslated&#34;: &#34;False&#34;, &#34;requested&#34;: &#34;en&#34;, &#34;served&#34;: &#34;en&#34;}, &#34;pageType&#34;: &#34;article&#34;, &#34;projectName&#34;: &#34;API&#34;, &#34;signedIn&#34;: &#34;False&#34;, &#34;tenant&#34;: &#34;chrome&#34;, &#34;recommendations&#34;: {&#34;sourcePage&#34;: &#34;&#34;, &#34;sourceType&#34;: 0, &#34;sourceRank&#34;: 0, &#34;sourceIdenticalDescriptions&#34;: 0, &#34;sourceTitleWords&#34;: 0, &#34;sourceDescriptionWords&#34;: 0, &#34;experiment&#34;: &#34;&#34;}, &#34;experiment&#34;: {&#34;ids&#34;: &#34;&#34;}}}</script>

    </devsite-analytics>

      <devsite-badger></devsite-badger>




<script nonce="DZN3KK/WTKEdZ8Rg0Za1AvNlPWSbka">

  (function(d,e,v,s,i,t,E){d['GoogleDevelopersObject']=i;
    t=e.createElement(v);t.async=1;t.src=s;E=e.getElementsByTagName(v)[0];
    E.parentNode.insertBefore(t,E);})(window, document, 'script',
    'https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/js/app_loader.js', '[53,"en",null,"/js/devsite_app_module.js","https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b","https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome","https://chrome-dot-devsite-v2-prod-3p.appspot.com",null,null,["/_pwa/chrome/manifest.json","https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/images/video-placeholder.svg","https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/favicon.png","https://www.gstatic.com/devrel-devsite/prod/veec7311b6c5f99ef32994eb65aab7022195f72bfa4f3d934bdc7556da7fa7c3b/chrome/images/lockup.svg","https://fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap"],1,null,[1,6,8,12,14,17,21,25,50,52,63,70,75,76,80,87,91,92,93,97,98,100,101,102,103,104,105,107,108,109,110,112,113,117,118,120,122,124,125,126,127,129,130,131,132,133,134,135,136,138,140,141,147,148,149,151,152,156,157,158,159,161,163,164,168,169,170,179,180,182,183,186,191,193,196],"AIzaSyCNm9YxQumEXwGJgTDjxoxXK6m1F-9720Q","AIzaSyCc76DZePGtoyUjqKrLdsMGk_ry7sljLbY","developer.chrome.com","AIzaSyB9bqgQ2t11WJsOX8qNsCQ6U-w91mmqF-I","AIzaSyAdYnStPdzjcJJtQ0mvIaeaMKj7_t6J_Fg",null,null,null,["DevPro__remove_eu_tax_intake_form","Profiles__enable_targeted_hero","Cloud__enable_cloud_dlp_service","Profiles__enable_page_saving","Profiles__enable_developer_profiles_callout","MiscFeatureFlags__fix_lower_breadcrumbs","DevPro__enable_embed_profile_creation","Concierge__enable_remove_info_panel_tags","DevPro__enable_google_payments_buyflow","MiscFeatureFlags__enable_llms_txt","MiscFeatureFlags__developers_footer_image","Cloud__enable_cloud_shell_fte_user_flow","TpcFeatures__proxy_prod_host","DevPro__enable_enterprise","Profiles__enable_awarding_url","CloudShell__cloud_code_overflow_menu","BookNav__enable_tenant_cache_key","MiscFeatureFlags__enable_framebox_badge_methods","DevPro__enable_code_assist","MiscFeatureFlags__enable_variable_operator","Cloud__enable_cloud_shell","EngEduTelemetry__enable_engedu_telemetry","Cloud__enable_legacy_calculator_redirect","TpcFeatures__enable_unmirrored_page_left_nav","MiscFeatureFlags__enable_view_transitions","Search__enable_ai_eligibility_checks","Profiles__enable_callout_notifications","DevPro__enable_devpro_offers","DevPro__enable_firebase_workspaces_card","Profiles__enable_completecodelab_endpoint","Profiles__enable_profile_collections","MiscFeatureFlags__enable_project_variables","Concierge__enable_actions_menu","Concierge__enable_pushui","DevPro__enable_vertex_credit_card","MiscFeatureFlags__enable_explicit_template_dependencies","MiscFeatureFlags__enable_appearance_cookies","AIStudioInteractionsToggle__interactions_are_default","Profiles__enable_release_notes_notifications","Search__enable_ai_search_summaries_for_all","DevPro__enable_g1_integration","OnSwitch__enable","Profiles__enable_recognition_badges","Cloud__enable_free_trial_server_call","Profiles__enable_purchase_prompts","Profiles__enable_join_program_group_endpoint","DevPro__enable_google_one_card","CloudShell__cloud_shell_button","MiscFeatureFlags__enable_firebase_utm","Profiles__enable_developer_profile_pages_as_content","Search__enable_page_map","Profiles__enable_stripe_subscription_management","DevPro__enable_developer_subscriptions","Profiles__enable_complete_playlist_endpoint","DevPro__enable_free_benefits","Profiles__enable_public_developer_profiles","Profiles__enable_user_type","MiscFeatureFlags__remove_cross_domain_tracking_params","DevPro__enable_cloud_innovators_plus","SignIn__enable_l1_signup_flow","Cloud__fast_free_trial","Search__enable_suggestions_from_borg","Cloud__enable_cloudx_experiment_ids","Analytics__enable_devpro_interaction_logging","Profiles__enable_developer_profile_benefits_ui_redesign","Profiles__require_profile_eligibility_for_signin","MiscFeatureFlags__developers_footer_dark_image","Profiles__enable_auto_apply_credits","Profiles__enable_completequiz_endpoint","Concierge__enable_devsite_llm_tools","Profiles__enable_dashboard_curated_recommendations","MiscFeatureFlags__gdp_dashboard_reskin_enabled","Analytics__enable_clearcut_logging","Cloud__cache_serialized_dynamic_content","Profiles__enable_playlist_community_acl","Experiments__reqs_query_experiments","MiscFeatureFlags__enable_variable_operator_index_yaml","DevPro__enable_g1_ineligible_redirect","Search__enable_dynamic_content_confidential_banner","DevPro__enable_devsite_captcha","DevPro__enable_nvidia_credits_card","DevPro__enable_credits_banner"],null,null,"AIzaSyA58TaKli1DculwmAmbpzLVGuWc8eCQgQc","https://developerscontentserving-pa.googleapis.com","AIzaSyDWBU60w0P9hEkr29kkksYs8Z7gvZ8u_wc","https://developerscontentsearch-pa.googleapis.com",2,4,null,"https://developerprofiles-pa.googleapis.com",[53,"chrome","Chrome for Developers","developer.chrome.com",null,"chrome-dot-devsite-v2-prod-3p.appspot.com",null,null,[null,null,null,null,null,null,null,null,null,null,null,[1],null,null,null,null,null,null,[1],null,null,null,null,[1,null,1],[1,1,null,1,1],null,null,null,null,null,[1]],null,[69,null,null,null,null,null,"/images/lockup.svg","/images/touchicon-180.png",null,null,null,1,1,null,null,null,null,null,null,null,null,2,null,null,null,"/images/lockup-dark-theme.svg",[]],[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[[],[1,1]],[[null,null,null,null,null,["GTM-5QF3RT2"],null,null,null,null,null,[["GTM-5QF3RT2",1]],1]],null,4],1,null,1,null,"https://developerscontentinsights-pa.googleapis.com","AIzaSyC11xEGtFhkmSh_iF6l_itbxnFz2GrIBOg","AIzaSyAXJ10nRF73mmdSDINgkCNX5bbd2KPcWm8","https://developers.googleapis.com",null,null,"AIzaSyCjP0KOnHfv8mwe38sfzZJMOnqE3HvrD4A",null,null,"https://developers.googleapis.com"]')

</script>

    <devsite-a11y-announce></devsite-a11y-announce>
  </body>
</html>