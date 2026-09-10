








<!doctype html>
<html
      lang="en"
      dir="ltr">
  <head>
    <meta name="google-signin-client-id" content="721724668570-nbkv1cfusk7kk4eni4pjvepaus73b13t.apps.googleusercontent.com"><meta name="google-signin-scope"
          content="profile email https://www.googleapis.com/auth/developerprofiles https://www.googleapis.com/auth/developerprofiles.award https://www.googleapis.com/auth/devprofiles.full_control.firstparty"><meta property="og:site_name" content="Google for Developers">
    <meta property="og:type" content="website"><meta name="theme-color" content="#1a73e8"><meta charset="utf-8">
    <meta content="IE=Edge" http-equiv="X-UA-Compatible">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <link rel="manifest" href="/_pwa/developers/manifest.json"
          crossorigin="use-credentials">
    <link rel="preconnect" href="//www.gstatic.com" crossorigin>
    <link rel="preconnect" href="//fonts.googleapis.com" crossorigin>
    <link rel="preconnect" href="//www.google-analytics.com" crossorigin><link rel="stylesheet" href="//fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap">
      <link rel="stylesheet"
            href="//fonts.googleapis.com/css2?family=Material+Icons&family=Material+Symbols+Outlined&display=block"><link rel="stylesheet" href="https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/css/app.css">
      <link rel="shortcut icon" href="https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/images/favicon-new.png">
    <link rel="apple-touch-icon" href="https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/images/touchicon-180-new.png"><link rel="canonical" href="https://developers.google.com/jules/api/reference/rest/v1alpha/sources"><link rel="search" type="application/opensearchdescription+xml"
            title="Google for Developers" href="https://developers.google.com/s/opensearch.xml">
      <link rel="alternate" hreflang="en"
          href="https://developers.google.com/jules/api/reference/rest/v1alpha/sources" /><link rel="alternate" hreflang="x-default" href="https://developers.google.com/jules/api/reference/rest/v1alpha/sources" /><title>REST Resource: sources &nbsp;|&nbsp; Jules API &nbsp;|&nbsp; Google for Developers</title>

<meta property="og:title" content="REST Resource: sources &nbsp;|&nbsp; Jules API &nbsp;|&nbsp; Google for Developers"><meta property="og:url" content="https://developers.google.com/jules/api/reference/rest/v1alpha/sources"><meta property="og:image" content="https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/images/opengraph/google-blue.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="675"><meta property="og:locale" content="en"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Jules API",
      "item": "https://developers.google.com/jules/api"
    },{
      "@type": "ListItem",
      "position": 2,
      "name": "REST Resource: sources",
      "item": "https://developers.google.com/jules/api/reference/rest/v1alpha/sources"
    }]
  }
  </script>









    </head>
  <body class="docs color-scheme--light"
        template="page"
        theme="google-blue"
        type="reference"
        itemscope itemtype="http://developers.google.com/ReferenceObject"


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









  <span class="devsite-product-name">
    <ul class="devsite-breadcrumb-list"
  >

  <li class="devsite-breadcrumb-item
             ">






  <a href="https://developers.google.com/jules/api"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Upper Header"

        data-value="1"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="1"

        track-metadata-eventdetail="Jules API"

    >

          Jules API

  </a>



  </li>

</ul>
  </span>

</div>
        <div class="devsite-top-logo-row-middle">
          <div class="devsite-header-upper-tabs">

           </div>

<devsite-search
    enable-signin
    enable-search
    enable-suggestions
      enable-query-completion

    enable-search-summaries
    project-name="Jules API"
    tenant-name="Google for Developers"
    project-scope="/jules/api"
    url-scoped="https://developers.google.com/s/results/jules/api"



    >
  <form class="devsite-search-form" action="https://developers.google.com/s/results" method="GET">
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
      <a role="menuitem" lang="es"
        >Español</a>
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
      <a role="menuitem" lang="pt_br"
        >Português – Brasil</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ru"
        >Русский</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_cn"
        >中文 – 简体</a>
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


                          fp-auth

                        id="devsite-user">


              <span class="button devsite-top-button" aria-hidden="true" visually-hidden>Sign in</span>

          </devsite-user>



      </div>
    </div>
  </div>



  <div class="devsite-collapsible-section
    ">
    <div class="devsite-header-background">




        <div class="devsite-doc-set-nav-row">




  <devsite-tabs class="lower-tabs">

    <nav class="devsite-tabs-wrapper" aria-label="Lower tabs">


          <tab  >

    <a href="https://developers.google.com/jules/api"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developers.google.com/jules/api"

       track-type="nav"
       track-metadata-position="nav - home"
       track-metadata-module="primary nav"



           data-category="Site-Wide Custom Events"

           data-label="Tab: Home"

           track-name="home"

       >
    Home

    </a>


          </tab>



          <tab  class="devsite-active">

    <a href="https://developers.google.com/jules/api/reference/rest"
    class="devsite-tabs-content gc-analytics-event "
      track-metadata-eventdetail="https://developers.google.com/jules/api/reference/rest"

       track-type="nav"
       track-metadata-position="nav - rest reference"
       track-metadata-module="primary nav"
       aria-label="REST Reference, selected"


           data-category="Site-Wide Custom Events"

           data-label="Tab: REST Reference"

           track-name="rest reference"

       >
    REST Reference

    </a>


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







      <span class="devsite-product-name">


        <ul class="devsite-breadcrumb-list"
  >

  <li class="devsite-breadcrumb-item
             ">






  <a href="https://developers.google.com/jules/api"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Upper Header"

        data-value="1"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="1"

        track-metadata-eventdetail="Jules API"

    >

          Jules API

  </a>



  </li>

</ul>
      </span>


</div>
  </div>

  <div class="devsite-book-nav-wrapper">
    <div class="devsite-mobile-nav-top">

        <ul class="devsite-nav-list">


<li class="devsite-nav-item">


  <a href="/jules/api"

       class="devsite-nav-title gc-analytics-event

              "




        data-category="Site-Wide Custom Events"

        data-label="Tab: Home"

        track-name="home"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: Home"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      Home
   </span>


  </a>


</li>



<li class="devsite-nav-item">


  <a href="/jules/api/reference/rest"

       class="devsite-nav-title gc-analytics-event
              devsite-nav-has-children
              devsite-nav-active"




        data-category="Site-Wide Custom Events"

        data-label="Tab: REST Reference"

        track-name="rest reference"


     data-category="Site-Wide Custom Events"
     data-label="Responsive Tab: REST Reference"
     track-type="navMenu"
     track-metadata-eventDetail="globalMenu"
     track-metadata-position="nav">

    <span class="devsite-nav-text" tooltip >
      REST Reference
   </span>

    <span class="devsite-nav-icon material-icons" data-icon="forward"
          >
    </span>


  </a>


</li>




        </ul>

    </div>

      <div class="devsite-mobile-nav-bottom">


          <ul class="devsite-nav-list" menu="_book">
            <li class="devsite-nav-item"><a href="/jules/api/reference/rest"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>Overview</span></a></li>

  <li class="devsite-nav-item
           devsite-nav-expandable"><div class="devsite-expandable-nav">
      <a class="devsite-nav-toggle" aria-hidden="true"></a><div class="devsite-nav-title devsite-nav-title-no-path" tabindex="0" role="button">
        <span class="devsite-nav-text" tooltip>v1alpha</span>
      </div><ul class="devsite-nav-section"><li class="devsite-nav-item
           devsite-nav-heading"><div class="devsite-nav-title devsite-nav-title-no-path">
        <span class="devsite-nav-text" tooltip>REST Resources</span>
      </div></li><li class="devsite-nav-item
           devsite-nav-expandable"><div class="devsite-expandable-nav">
      <a class="devsite-nav-toggle" aria-hidden="true"></a><div class="devsite-nav-title devsite-nav-title-no-path" tabindex="0" role="button">
        <span class="devsite-nav-text" tooltip>sessions</span>
      </div><ul class="devsite-nav-section"><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>Overview</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions/approvePlan"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>approvePlan</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions/create"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>create</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions/get"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>get</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions/list"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>list</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions/sendMessage"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>sendMessage</span></a></li></ul></div></li><li class="devsite-nav-item
           devsite-nav-expandable"><div class="devsite-expandable-nav">
      <a class="devsite-nav-toggle" aria-hidden="true"></a><div class="devsite-nav-title devsite-nav-title-no-path" tabindex="0" role="button">
        <span class="devsite-nav-text" tooltip>sessions.activities</span>
      </div><ul class="devsite-nav-section"><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions.activities"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>Overview</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions.activities/get"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>get</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sessions.activities/list"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>list</span></a></li></ul></div></li><li class="devsite-nav-item
           devsite-nav-expandable"><div class="devsite-expandable-nav">
      <a class="devsite-nav-toggle" aria-hidden="true"></a><div class="devsite-nav-title devsite-nav-title-no-path" tabindex="0" role="button">
        <span class="devsite-nav-text" tooltip>sources</span>
      </div><ul class="devsite-nav-section"><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sources"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>Overview</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sources/get"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>get</span></a></li><li class="devsite-nav-item"><a href="/jules/api/reference/rest/v1alpha/sources/list"
        class="devsite-nav-title"
      ><span class="devsite-nav-text" tooltip>list</span></a></li></ul></div></li></ul></div></li>
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






  <div class="devsite-article-meta nocontent" role="navigation" data-nosnippet>


    <ul class="devsite-breadcrumb-list"

    aria-label="Breadcrumb">

  <li class="devsite-breadcrumb-item
             ">





  <a href="https://developers.google.com/"

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





  <a href="https://developers.google.com/products"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="2"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="2"

        track-metadata-eventdetail=""

    >

          Products

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developers.google.com/jules/api"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="3"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="3"

        track-metadata-eventdetail="Jules API"

    >

          Jules API

  </a>



  </li>

  <li class="devsite-breadcrumb-item
             ">


      <div class="devsite-breadcrumb-guillemet material-icons" aria-hidden="true"></div>





  <a href="https://developers.google.com/jules/api/reference/rest"

        class="devsite-breadcrumb-link gc-analytics-event"

        data-category="Site-Wide Custom Events"

        data-label="Breadcrumbs"

        data-value="4"

        track-type="globalNav"

        track-name="breadcrumb"

        track-metadata-position="4"

        track-metadata-eventdetail=""

    >

          REST Reference

  </a>



  </li>

</ul>


    <devsite-thumb-rating position="header">
    </devsite-thumb-rating>


  </div>

    <h1 class="devsite-page-title" tabindex="-1">
      REST Resource: sources<devsite-actions hidden data-nosnippet><devsite-feature-tooltip
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


    <devsite-recommendations-dropdown class="nocontent" data-nosnippet>
    </devsite-recommendations-dropdown>

  <div class="devsite-article-body clearfix
  ">




    <meta itemprop="name" content="sources">
    <meta itemprop="path" content="/jules/api/reference/rest/v1alpha/sources">
    <section id="/jules/api/reference/rest/v1alpha/sources">

      <ul class="toc">
        <li><a href="#Source">Resource: Source</a>
          <ul>
            <li><a href="#Source.SCHEMA_REPRESENTATION">JSON representation</a></li>

          </ul>
        </li>
        <li><a href="#GitHubRepo">GitHubRepo</a>
          <ul>
            <li><a href="#GitHubRepo.SCHEMA_REPRESENTATION">JSON representation</a></li>

          </ul>
        </li>
        <li><a href="#GitHubBranch">GitHubBranch</a>
          <ul>
            <li><a href="#GitHubBranch.SCHEMA_REPRESENTATION">JSON representation</a></li>

          </ul>
        </li>
        <li><a href="#METHODS_SUMMARY">Methods</a></li>

      </ul>
      <section id="Source">
        <h2 id="resource:-source" data-text="Resource: Source" tabindex="-1">Resource: Source</h2>

        <section id="Source.description">
          <p>An input source of data for a session.</p>
        </section>
        <section id="Source.SCHEMA_REPRESENTATION">
          <table class="properties responsive fixed">
            <thead>
              <tr>
                <th>JSON representation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="margin:0;padding:0;"><div></div><devsite-code><pre style="border: 0;margin: 0;" translate="no" dir="ltr" is-upgraded><span class="pun">{</span>
  <span class="str">"name"</span><span class="pun">: </span><span class="kwd">string</span><span class="pun">,</span>
  <span class="str">"id"</span><span class="pun">: </span><span class="kwd">string</span><span class="pun">,</span>

  <span class="com">// Union field <code translate="no" dir="ltr">source</code> can be only one of the following:</span>
  <span class="str">"githubRepo"</span><span class="pun">: </span><span class="pun">{</span>
    <span class="kwd">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubRepo">GitHubRepo</a></code>)</span>
  <span class="pun">}</span>
  <span class="com">// End of list of possible types for union field <code translate="no" dir="ltr">source</code>.</span>
<span class="pun">}</span></pre></devsite-code></td>
              </tr>
            </tbody>
          </table>
        </section>
        <section id="Source.FIELDS">
          <table class="properties responsive fixed" id="Source.FIELDS-table">
            <colgroup>
              <col width="25%">
              <col>
            </colgroup>
            <thead>
              <tr>
                <th colspan="2">Fields</th>
              </tr>
            </thead>
            <tbody>
              <tr id="Source.FIELDS.name">
                <td><code translate="no" dir="ltr">name</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">string</code></p>
                  <p>Identifier. The full resource name (e.g., "sources/{source}").</p>
                </td>
              </tr>
              <tr id="Source.FIELDS.id">
                <td><code translate="no" dir="ltr">id</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">string</code></p>
                  <p>Output only. The id of the source. This is the same as the "{source}" part of the resource name (e.g., "sources/{source}").</p>
                </td>
              </tr>
              <tr id="Source.FIELDS.oneof_source" class="alt">
                <td colspan="2">Union field <code translate="no" dir="ltr">source</code>. The input data source. <code translate="no" dir="ltr">source</code> can be only one of the following:</td>
              </tr>
              <tr id="Source.FIELDS.github_repo">
                <td><code translate="no" dir="ltr">githubRepo</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubRepo">GitHubRepo</a></code>)</code></p>
                  <p>A GitHub repo.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
      <section id="GitHubRepo">
        <h2 id="githubrepo" data-text="GitHubRepo" tabindex="-1">GitHubRepo</h2>

        <section id="GitHubRepo.description">
          <p>A GitHub repo.</p>
        </section>
        <section id="GitHubRepo.SCHEMA_REPRESENTATION">
          <table class="properties responsive fixed">
            <thead>
              <tr>
                <th>JSON representation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="margin:0;padding:0;"><div></div><devsite-code><pre style="border: 0;margin: 0;" translate="no" dir="ltr" is-upgraded><span class="pun">{</span>
  <span class="str">"owner"</span><span class="pun">: </span><span class="kwd">string</span><span class="pun">,</span>
  <span class="str">"repo"</span><span class="pun">: </span><span class="kwd">string</span><span class="pun">,</span>
  <span class="str">"isPrivate"</span><span class="pun">: </span><span class="kwd">boolean</span><span class="pun">,</span>
  <span class="str">"defaultBranch"</span><span class="pun">: </span><span class="pun">{</span>
    <span class="kwd">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubBranch">GitHubBranch</a></code>)</span>
  <span class="pun">}</span><span class="pun">,</span>
  <span class="str">"branches"</span><span class="pun">: </span><span class="pun">[</span>
    <span class="pun">{</span>
      <span class="kwd">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubBranch">GitHubBranch</a></code>)</span>
    <span class="pun">}</span>
  <span class="pun">]</span>
<span class="pun">}</span></pre></devsite-code></td>
              </tr>
            </tbody>
          </table>
        </section>
        <section id="GitHubRepo.FIELDS">
          <table class="properties responsive fixed" id="GitHubRepo.FIELDS-table">
            <colgroup>
              <col width="25%">
              <col>
            </colgroup>
            <thead>
              <tr>
                <th colspan="2">Fields</th>
              </tr>
            </thead>
            <tbody>
              <tr id="GitHubRepo.FIELDS.owner">
                <td><code translate="no" dir="ltr">owner</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">string</code></p>
                  <p>The owner of the repo; the <code translate="no" dir="ltr">&lt;owner&gt;</code> in <code translate="no" dir="ltr">https://github.com/&lt;owner&gt;/&lt;repo&gt;</code>.</p>
                </td>
              </tr>
              <tr id="GitHubRepo.FIELDS.repo">
                <td><code translate="no" dir="ltr">repo</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">string</code></p>
                  <p>The name of the repo; the <code translate="no" dir="ltr">&lt;repo&gt;</code> in <code translate="no" dir="ltr">https://github.com/&lt;owner&gt;/&lt;repo&gt;</code>.</p>
                </td>
              </tr>
              <tr id="GitHubRepo.FIELDS.is_private">
                <td><code translate="no" dir="ltr">isPrivate</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">boolean</code></p>
                  <p>Whether this repo is private.</p>
                </td>
              </tr>
              <tr id="GitHubRepo.FIELDS.default_branch">
                <td><code translate="no" dir="ltr">defaultBranch</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubBranch">GitHubBranch</a></code>)</code></p>
                  <p>The default branch for this repo.</p>
                </td>
              </tr>
              <tr id="GitHubRepo.FIELDS.branches">
                <td><code translate="no" dir="ltr">branches[]</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">object (<code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources#GitHubBranch">GitHubBranch</a></code>)</code></p>
                  <p>The list of active branches for this repo.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
      <section id="GitHubBranch">
        <h2 id="githubbranch" data-text="GitHubBranch" tabindex="-1">GitHubBranch</h2>

        <section id="GitHubBranch.description">
          <p>A GitHub branch.</p>
        </section>
        <section id="GitHubBranch.SCHEMA_REPRESENTATION">
          <table class="properties responsive fixed">
            <thead>
              <tr>
                <th>JSON representation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="margin:0;padding:0;"><div></div><devsite-code><pre style="border: 0;margin: 0;" translate="no" dir="ltr" is-upgraded><span class="pun">{</span>
  <span class="str">"displayName"</span><span class="pun">: </span><span class="kwd">string</span>
<span class="pun">}</span></pre></devsite-code></td>
              </tr>
            </tbody>
          </table>
        </section>
        <section id="GitHubBranch.FIELDS">
          <table class="properties responsive fixed" id="GitHubBranch.FIELDS-table">
            <colgroup>
              <col width="25%">
              <col>
            </colgroup>
            <thead>
              <tr>
                <th colspan="2">Fields</th>
              </tr>
            </thead>
            <tbody>
              <tr id="GitHubBranch.FIELDS.display_name">
                <td><code translate="no" dir="ltr">displayName</code></td>
                <td>
                  <p><code class="apitype" translate="no" dir="ltr">string</code></p>
                  <p>The name of the GitHub branch.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </section>
      <section id="METHODS_SUMMARY">
        <table class="methods responsive fixed" id="METHODS_SUMMARY-table">
          <colgroup>
            <col width="25%">
            <col>
          </colgroup>
          <thead>
            <tr>
              <th colspan="2"><h2 id="methods" data-text="Methods" tabindex="-1">Methods</h2></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <h3 id="get" data-text="get" tabindex="-1"><code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources/get">get</a></code></h3></td>
              <td>
                Gets a single source.</td>
            </tr>
            <tr>
              <td>
                <h3 id="list" data-text="list" tabindex="-1"><code translate="no" dir="ltr"><a href="/jules/api/reference/rest/v1alpha/sources/list">list</a></code></h3></td>
              <td>
                Lists sources.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>




</div>



      <devsite-recommendations display="in-page" hidden yield>
      </devsite-recommendations>



    <devsite-thumb-rating position="footer">
    </devsite-thumb-rating>




      <devsite-recommendations id="recommendations-link" yield></devsite-recommendations>



  <div class="devsite-floating-action-buttons"></div></article>


<devsite-content-footer class="nocontent" data-nosnippet>
  <p>Except as otherwise noted, the content of this page is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 License</a>, and code samples are licensed under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache 2.0 License</a>. For details, see the <a href="https://developers.google.com/site-policies">Google Developers Site Policies</a>. Java is a registered trademark of Oracle and/or its affiliates.</p>
  <p>Last updated 2025-09-29 UTC.</p>
</devsite-content-footer>


<devsite-notification
>
</devsite-notification>



<div class="devsite-content-data">


    <template class="devsite-content-data-template">
      [[["Easy to understand","easyToUnderstand","thumb-up"],["Solved my problem","solvedMyProblem","thumb-up"],["Other","otherUp","thumb-up"]],[["Missing the information I need","missingTheInformationINeed","thumb-down"],["Too complicated / too many steps","tooComplicatedTooManySteps","thumb-down"],["Out of date","outOfDate","thumb-down"],["Samples / code issue","samplesCodeIssue","thumb-down"],["Other","otherDown","thumb-down"]],["Last updated 2025-09-29 UTC."],[],[]]
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
    <h3 class="devsite-footer-linkbox-heading no-link">Engage</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="/program"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            Google Developer Program

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/community"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >


            Google Developer Groups

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/community/experts"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 3)"
            >


            Google Developer Experts

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/community/accelerators"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 4)"
            >


            Accelerators

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/community/nvidia"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 5)"
            >





            Google Cloud & NVIDIA

          </a>


        </li>

      </ul>
    </li>

    <li class="devsite-footer-linkbox ">
    <h3 class="devsite-footer-linkbox-heading no-link">Connect</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="//googledevelopers.blogspot.com"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            Blog

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://bsky.app/profile/developers.google.com"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >


            Bluesky

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://www.instagram.com/googlefordevs/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 3)"
            >


            Instagram

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://www.linkedin.com/showcase/googledevelopers/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 4)"
            >


            LinkedIn

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="//twitter.com/googledevs"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 5)"
            >


            X (Twitter)

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="//www.youtube.com/user/GoogleDevelopers"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 6)"
            >





            YouTube

          </a>


        </li>

      </ul>
    </li>

    <li class="devsite-footer-linkbox ">
    <h3 class="devsite-footer-linkbox-heading no-link">Build</h3>
      <ul class="devsite-footer-linkbox-list">

        <li class="devsite-footer-linkbox-item">

          <a href="https://developer.android.com/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 1)"
            >


            Android

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://developer.chrome.com/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 2)"
            >


            Chrome

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://firebase.google.com/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 3)"
            >


            Firebase

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://aistudio.google.com/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 4)"
            >


            Google AI Studio

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://antigravity.google/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 5)"
            >


            Google Antigravity

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://cloud.google.com/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 6)"
            >


            Google Cloud

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="https://play.google.com/console/about/"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 7)"
            >


            Google Play

          </a>


        </li>

        <li class="devsite-footer-linkbox-item">

          <a href="/products"
             class="devsite-footer-linkbox-link gc-analytics-event"
             data-category="Site-Wide Custom Events"

             data-label="Footer Link (index 8)"
            >





            View all

          </a>


        </li>

      </ul>
    </li>

  </ul>

</nav>

        </devsite-footer-linkboxes>
        <devsite-footer-utility class="devsite-footer">



<div class="devsite-footer-utility nocontent" data-nosnippet>


  <nav class="devsite-footer-sites" aria-label="Other Google Developers websites">
    <a href="https://developers.google.com/"
       class="devsite-footer-sites-logo-link gc-analytics-event"
       data-category="Site-Wide Custom Events"
       data-label="Footer Google Developers Link">
      <picture>

        <img class="devsite-footer-sites-logo"
             src="https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/images/lockup-google-for-developers.svg"
             loading="lazy"
             alt="Google Developers">
      </picture>
    </a>
    <ul class="devsite-footer-sites-list">

      <li class="devsite-footer-sites-item">
        <a href="//developer.android.com"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer Android Link"

         >
          Android
        </a>
      </li>

      <li class="devsite-footer-sites-item">
        <a href="//developer.chrome.com/home"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer Chrome Link"

         >
          Chrome
        </a>
      </li>

      <li class="devsite-footer-sites-item">
        <a href="//firebase.google.com"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer Firebase Link"

         >
          Firebase
        </a>
      </li>

      <li class="devsite-footer-sites-item">
        <a href="//cloud.google.com"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer Google Cloud Platform Link"

         >
          Google Cloud Platform
        </a>
      </li>

      <li class="devsite-footer-sites-item">
        <a href="//ai.google.dev/"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer Google AI Link"

         >
          Google AI
        </a>
      </li>

      <li class="devsite-footer-sites-item">
        <a href="/products"
           class="devsite-footer-sites-link
                  gc-analytics-event"
           data-category="Site-Wide Custom Events"

           data-label="Footer All products Link"

         >
          All products
        </a>
      </li>

    </ul>
  </nav>



  <nav class="devsite-footer-utility-links" aria-label="Utility links">

    <ul class="devsite-footer-utility-list">

      <li class="devsite-footer-utility-item
                 ">


        <a class="devsite-footer-utility-link gc-analytics-event"
           href="/terms/site-terms"
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
      <a role="menuitem" lang="es"
        >Español</a>
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
      <a role="menuitem" lang="pt_br"
        >Português – Brasil</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="ru"
        >Русский</a>
    </li>

    <li role="presentation">
      <a role="menuitem" lang="zh_cn"
        >中文 – 简体</a>
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

        <script type="application/json" analytics>[{&#34;dimensions&#34;: {&#34;dimension5&#34;: &#34;en&#34;, &#34;dimension11&#34;: false, &#34;dimension3&#34;: false, &#34;dimension1&#34;: &#34;Signed out&#34;, &#34;dimension6&#34;: &#34;en&#34;, &#34;dimension4&#34;: &#34;Jules API&#34;}, &#34;gaid&#34;: &#34;UA-24532603-1&#34;, &#34;metrics&#34;: {&#34;ratings_count&#34;: &#34;metric2&#34;, &#34;ratings_value&#34;: &#34;metric1&#34;}, &#34;purpose&#34;: 1}]</script>
<script type="application/json" tag-management>{&#34;at&#34;: &#34;True&#34;, &#34;ga4&#34;: [{&#34;id&#34;: &#34;G-272J68FCRF&#34;, &#34;purpose&#34;: 1}], &#34;ga4p&#34;: [{&#34;id&#34;: &#34;G-272J68FCRF&#34;, &#34;purpose&#34;: 1}], &#34;gtm&#34;: [{&#34;id&#34;: &#34;GTM-T98GCPGN&#34;, &#34;purpose&#34;: 1}], &#34;parameters&#34;: {&#34;internalUser&#34;: &#34;False&#34;, &#34;language&#34;: {&#34;machineTranslated&#34;: &#34;False&#34;, &#34;requested&#34;: &#34;en&#34;, &#34;served&#34;: &#34;en&#34;}, &#34;pageType&#34;: &#34;reference&#34;, &#34;projectName&#34;: &#34;Jules API&#34;, &#34;signedIn&#34;: &#34;False&#34;, &#34;tenant&#34;: &#34;developers&#34;, &#34;recommendations&#34;: {&#34;sourcePage&#34;: &#34;&#34;, &#34;sourceType&#34;: 0, &#34;sourceRank&#34;: 0, &#34;sourceIdenticalDescriptions&#34;: 0, &#34;sourceTitleWords&#34;: 0, &#34;sourceDescriptionWords&#34;: 0, &#34;experiment&#34;: &#34;&#34;}, &#34;experiment&#34;: {&#34;ids&#34;: &#34;&#34;}}}</script>

    </devsite-analytics>

      <devsite-badger></devsite-badger>




<script nonce="vgDXbEksOUqBQHbV6EnvbyuZge4q+C">

  (function(d,e,v,s,i,t,E){d['GoogleDevelopersObject']=i;
    t=e.createElement(v);t.async=1;t.src=s;E=e.getElementsByTagName(v)[0];
    E.parentNode.insertBefore(t,E);})(window, document, 'script',
    'https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/js/app_loader.js', '[1,"en",null,"/js/devsite_app_module.js","https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037","https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers","https://developers-dot-devsite-v2-prod.appspot.com",null,null,["/_pwa/developers/manifest.json","https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/images/video-placeholder.svg","https://www.gstatic.com/devrel-devsite/prod/v5e941f15ff6710591bee254538202655020220785b40a3f4d932e94adb9f6037/developers/images/favicon-new.png","https://fonts.googleapis.com/css?family=Google+Sans:400,500|Roboto:400,400italic,500,500italic,700,700italic|Roboto+Mono:400,500,700&display=swap"],1,null,[1,6,8,12,14,17,21,25,50,52,63,70,75,76,80,87,91,92,93,97,98,100,101,102,103,104,105,107,108,109,110,112,113,117,118,120,122,124,125,126,127,129,130,131,132,133,134,135,136,138,140,141,147,148,149,151,152,156,157,158,159,161,163,164,168,169,170,179,180,182,183,186,191,193,196],"AIzaSyAP-jjEJBzmIyKR4F-3XITp8yM9T1gEEI8","AIzaSyB6xiKGDR5O3Ak2okS4rLkauxGUG7XP0hg","developers.google.com","AIzaSyAQk0fBONSGUqCNznf6Krs82Ap1-NV6J4o","AIzaSyCCxcqdrZ_7QMeLCRY20bh_SXdAYqy70KY",null,null,null,["Search__enable_ai_eligibility_checks","DevPro__enable_free_benefits","Profiles__enable_purchase_prompts","DevPro__enable_code_assist","DevPro__enable_firebase_workspaces_card","Analytics__enable_clearcut_logging","DevPro__enable_google_one_card","Cloud__enable_free_trial_server_call","Cloud__enable_cloudx_experiment_ids","Cloud__enable_cloud_shell","DevPro__enable_nvidia_credits_card","Cloud__cache_serialized_dynamic_content","Profiles__enable_awarding_url","DevPro__enable_developer_subscriptions","MiscFeatureFlags__enable_variable_operator_index_yaml","Profiles__enable_auto_apply_credits","Search__enable_suggestions_from_borg","DevPro__remove_eu_tax_intake_form","Cloud__fast_free_trial","Cloud__enable_cloud_shell_fte_user_flow","Cloud__enable_legacy_calculator_redirect","Concierge__enable_key_takeaways","Profiles__enable_developer_profiles_callout","MiscFeatureFlags__enable_view_transitions","Profiles__require_profile_eligibility_for_signin","Search__enable_ai_search_summaries_for_all","Profiles__enable_completequiz_endpoint","MiscFeatureFlags__enable_firebase_utm","Concierge__enable_key_takeaways_new_ui","MiscFeatureFlags__developers_footer_dark_image","Profiles__enable_completecodelab_endpoint","DevPro__enable_embed_profile_creation","Profiles__enable_callout_notifications","DevPro__enable_cloud_innovators_plus","Profiles__enable_recognition_badges","DevPro__enable_g1_integration","Profiles__enable_developer_profile_pages_as_content","Concierge__enable_pushui","Search__enable_dynamic_content_confidential_banner","Profiles__enable_profile_collections","MiscFeatureFlags__developers_footer_image","EngEduTelemetry__enable_engedu_telemetry","AIStudioInteractionsToggle__interactions_are_default","MiscFeatureFlags__enable_variable_operator","MiscFeatureFlags__enable_explicit_template_dependencies","Cloud__enable_cloud_dlp_service","Profiles__enable_stripe_subscription_management","DevPro__enable_enterprise","DevPro__enable_vertex_credit_card","MiscFeatureFlags__enable_project_variables","Profiles__enable_developer_profile_benefits_ui_redesign","Profiles__enable_release_notes_notifications","MiscFeatureFlags__enable_framebox_badge_methods","Concierge__enable_devsite_llm_tools","Profiles__enable_targeted_hero","DevPro__enable_g1_ineligible_redirect","MiscFeatureFlags__enable_appearance_cookies","Profiles__enable_dashboard_curated_recommendations","BookNav__enable_tenant_cache_key","Profiles__enable_playlist_community_acl","MiscFeatureFlags__gdp_dashboard_reskin_enabled","MiscFeatureFlags__fix_lower_breadcrumbs","CloudShell__cloud_shell_button","SignIn__enable_l1_signup_flow","DevPro__enable_credits_banner","Concierge__enable_remove_info_panel_tags","Profiles__enable_complete_playlist_endpoint","Analytics__enable_devpro_interaction_logging","CloudShell__cloud_code_overflow_menu","Profiles__enable_user_type","Search__enable_page_map","Profiles__enable_page_saving","Experiments__reqs_query_experiments","Significatio__enable_by_tenant","MiscFeatureFlags__remove_cross_domain_tracking_params","Profiles__enable_join_program_group_endpoint","Concierge__enable_actions_menu","Profiles__enable_public_developer_profiles","DevPro__enable_devsite_captcha","DevPro__enable_google_payments_buyflow","TpcFeatures__enable_unmirrored_page_left_nav","DevPro__enable_devpro_offers","TpcFeatures__proxy_prod_host"],null,null,"AIzaSyBLEMok-5suZ67qRPzx0qUtbnLmyT_kCVE","https://developerscontentserving-pa.clients6.google.com","AIzaSyCM4QpTRSqP5qI4Dvjt4OAScIN8sOUlO-k","https://developerscontentsearch-pa.clients6.google.com",1,4,null,"https://developerprofiles-pa.clients6.google.com",[1,"developers","Google for Developers","developers.google.com",null,"developers-dot-devsite-v2-prod.appspot.com",null,null,[1,1,[1],null,null,null,null,null,null,null,null,[1],null,null,null,null,null,null,[1],[1,null,null,[1,20],"/recommendations/information"],null,null,null,[1,1,1],[1,1,null,1,1,null,null,["/meridian"]],[1,null,null,null,null,null,null,["/admob","/ad-manager/mobile-ads-sdk","/ml-kit"]],null,[null,["/meridian","/youtube/devices/"]],1,null,[1]],null,[null,null,null,null,null,null,"/images/lockup-new.svg","/images/touchicon-180-new.png",null,null,null,null,1,null,null,null,null,null,null,null,null,1,null,null,null,"/images/lockup-dark-theme-new.svg",[]],[],null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,[6,1,14,15,20,22,23,29,32,36],null,[[null,null,null,[3,7,10,2,39,17,4,32,24,11,12,13,34,15,25],null,null,[1,[["docType","Choose a content type",[["Tutorial",null,null,null,null,null,null,null,null,"Tutorial"],["Guide",null,null,null,null,null,null,null,null,"Guide"],["Sample",null,null,null,null,null,null,null,null,"Sample"]]],["product","Choose a product",[["Android",null,null,null,null,null,null,null,null,"Android"],["ARCore",null,null,null,null,null,null,null,null,"ARCore"],["ChromeOS",null,null,null,null,null,null,null,null,"ChromeOS"],["Firebase",null,null,null,null,null,null,null,null,"Firebase"],["Flutter",null,null,null,null,null,null,null,null,"Flutter"],["Assistant",null,null,null,null,null,null,null,null,"Google Assistant"],["GoogleCloud",null,null,null,null,null,null,null,null,"Google Cloud"],["GoogleMapsPlatform",null,null,null,null,null,null,null,null,"Google Maps Platform"],["GooglePay",null,null,null,null,null,null,null,null,"Google Pay & Google Wallet"],["GooglePlay",null,null,null,null,null,null,null,null,"Google Play"],["Tensorflow",null,null,null,null,null,null,null,null,"TensorFlow"]]],["category","Choose a topic",[["AiAndMachineLearning",null,null,null,null,null,null,null,null,"AI and Machine Learning"],["Data",null,null,null,null,null,null,null,null,"Data"],["Enterprise",null,null,null,null,null,null,null,null,"Enterprise"],["Gaming",null,null,null,null,null,null,null,null,"Gaming"],["Mobile",null,null,null,null,null,null,null,null,"Mobile"],["Web",null,null,null,null,null,null,null,null,"Web"]]]]]],[1,1],null,1],[[["UA-24532603-1"],["UA-22084204-5"],null,null,["UA-24532603-5"],["GTM-T98GCPGN"],null,[["G-272J68FCRF"],null,null,[["G-272J68FCRF",2]]],[["UA-24532603-1",2]],null,[["UA-24532603-5",2]],[["GTM-T98GCPGN",2]],1],[[15,12],[11,8],[3,2],[4,3],[13,10],[5,4],[16,13],[12,9],[14,11],[6,5],[1,1]],[[1,1],[2,2]]],null,4,null,null,null,null,null,null,null,null,null,null,null,null,null,"developers.devsite.google",null,null,null,null,null,[]],1,"pk_live_5170syrHvgGVmSx9sBrnWtA5luvk9BwnVcvIi7HizpwauFG96WedXsuXh790rtij9AmGllqPtMLfhe2RSwD6Pn38V00uBCydV4m",1,null,"https://developerscontentinsights-pa.clients6.google.com","AIzaSyCg-ZUslalsEbXMfIo9ZP8qufZgo3LSBDU","AIzaSyDxT0vkxnY_KeINtA4LSePJO-4MAZPMRsE","https://developers.clients6.google.com",["https://codeassist.google.com","https://code-assist-free-tier.corp.google.com"],null,"AIzaSyBQom12tzI-rybN7Sf-KfeL4nwm-Rf7PmI\n",null,null,"https://developers.googleapis.com"]')

</script>

    <devsite-a11y-announce></devsite-a11y-announce>
  </body>
</html>