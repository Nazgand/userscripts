# Novel Updates Cover Preview

The `NovelUpdatesCoverPreview.user.js` is a TamperMonkey script that previews covers when hovering over links to series, movies or shows.

- **Discussion Thread**: [Novel Updates Forum](https://forum.novelupdates.com/threads/novel-updates-userscript-to-preview-cover-images-on-greasyfork.117240/)
- **Repository**: [GitHub](https://github.com/Nazgand/UserScripts/)

## Features
- **Site Support**: Previews covers of links
  - From & to: `novelupdates.com`, `scribblehub.com`, `webnovel.com`, `royalroad.com`, `mangadex.org`, `mangaupdates.com`, `tvmaze.com`, `imdb.com`, `mydramalist.com`, `wiki.d-addicts.com`, and `asianwiki.com`.
  - Also from: `novelupdatesforum.com`, `scribblehubforum.com`, and subdomains (e.g., `www`, `m`).
- **Asynchronous Pre-fetching**: Automatically fetches and parses series data in the background.
- **Persistent Caching**: Caches cover images and metadata for `UpdateAtCacheAge` milliseconds (or until the script version changes) to ensure instant loading.
- **Automatic Caching of Viewed Pages**: Automatically stores data for the current series/show page in the cache upon viewing, ensuring subsequent links to that page load instantly with the latest data.
- **Dynamic Layout Positioning**: Viewport-aware positioning ensures the popup is always visible and does not overlap the link.

## Hotkeys

| Key | Action |
| :--- | :--- |
| **1** | Switch between detailed and simple popup style |
| **2** | Switch between description and tags (detailed mode) |
| **3** | Switch between small and big popup style |
| **4** | Pause/unpause auto-scrolling content |
| **5** | Reload cover data for the currently hovered link |
| **6** | Reload all links on current page (ignore network budget) |
| **7** | Cache all non-cached links on current page (ignore network budget) |
| **9** | Clear all cached cover data |
| **A** | Show alternative titles (hold to view) |
| **F** | Freeze/unfreeze the popup (pinned for interaction) |
| **I** | Toggle preloading/loading state icons next to links |
| **P** | Toggle reading list icons and title display |
| **H** | Show this hotkey list (hold to view) |

- - -
## Settings

The following settings can be configured at the top of the script (before `// END User Settings`):

- **UpdateAtCacheAge**: Minimum age of cached data (in milliseconds) before the script attempts a background update (~40.7 days by default).
- **EnablePreloader**: Enables or disables the autonomous background prefetching engine.
- **MaximumTotalPreloads**: Global limit for the number of background preloads allowed in a single session.
- **MaximumSitePreloads**: Per-site limit for background preloads to prevent hammering a single domain.
- **PreloadDelayMs**: Polling interval (in milliseconds) for the preloader discovery loop.
- **color**: Defines the theme palette (Background, Text, Border, Link, Important).
- **defaultShowIconNextToLink**: Default visibility for preloader status icons next to hyperlinks.
- **useReadingListIconAndTitle**: Toggles the display of Reading List icons and metadata within the popup.

- - -
## Development Notes

### CHANGES 2.6.0 ➡ 3:

- **Unified Synchronization Engine**: Implemented `syncLinksByCacheKey` to
  atomically update all duplicate links and preloader queues.
- **Eager Cache Filtering**: Optimized node discovery to instantly set icons for
  cached links and exclude them from the network budget.
- **Graceful Termination**: Fixed `preloaderLoop` to stop cycling once discovery
  exhaustion is reached.
- **On Screen Popup**: Fixed the error where the popup would sometimes be
  partially off screen in small windows.
- **Line Instead Of Arrow**: Replaced the arrow with a geometric line for better
  compatibility.
- **Regex-Powered URL Matching**: Replaced brittle string searches with robust
  regular expressions.
- **Universal Clickable Meta-Links**: Dynamically transforms scraped genres and
  tags into clickable links.
- **Localized Local Testing**: Protocol-aware origin check handles `file://`
  URLs for development.
- **Modern Lifecycle Management**: Transitioned from deprecated `onunload` to `
  pagehide` for more reliable observer disconnection.
- **MangaDex & TVmaze API Optimization**: All API interactions are now forced
  over HTTPS; TVmaze genres utilize a comprehensive ID map.
- **Preloader Throttle**: Added `MaximumTotalPreloads` (global) and `MaximumSitePreloads` (per-site) budget tracking using the `Preloads` state object.
- **Removed wlnupdates.com support**: Also removed `tv.com`, `mtlnovel.com`, and `
  batoto` (Bato.to).
- **Tabbed indentation**
- **Redid colors**: Fixed light text on light background (e.g., ScribbleHub Dark
  Mode).
- **Context Awareness**: Blocked links to the current page from triggering popups.
- **Freeze Mode**: Added `f` hotkey to freeze the popup and pin it for
  interaction.
- **Automatic Current Page Caching**: The script now automatically detects if
  the user is on an original series page and updates the local cache with the
  active DOM state.
- **Improved Manual Preloading**: Hotkeys 6 and 7 now ignore the `
  MaximumTotalPreloads` limit to ensure all links on the page are processed.
- **Hotkey 7**: Added Hotkey 7 to cache all non-cached links on the current page.

### BUGS:

- `imdb.com` may fail if the browser blocks cross-origin requests to IMDB API
  without a recent session.
- Hotkey overlap at `scribblehubforum.com`.

### TESTED/SUPPORTED SITES:

- novelupdates.com | scribblehub.com | imdb.com | royalroad.com | mangadex.org
  | webnovel.com | tvmaze.com | mangaupdates.com | mydramalist.com

### SCAN FOR LINKS AT:

- *://*.novelupdates.com/*
- *://*.novelupdatesforum.com/*
- *://*.scribblehub.com/*
- *://*.scribblehubforum.com/*
- *://*.royalroad.com/*
- *://*.tvmaze.com/*
- *://*.mangaupdates.com/*
- file:///\*/UserScripts/TestNovelUpdatesCoverPreview.html

### POPUP DOES NOT APPEAR (Known Issues):

- `https://scribblehub.com/profile/13352/nazgand/`
- `https://royalroad.com/my/favorites`
- `https://royalroad.com/fictions/trending`
- `https://www.webnovel.com/book/26009105205673805` \- the \[You May Also Like]
  section
- `https://www.tvmaze.com/shows`

- - -
## 1\. Unified Synchronization Engine

The script uses a centralized `syncLinksByCacheKey` mechanism to ensure absolute
consistency across all links.

- `data-cache-key`: During discovery, every link is tagged with its normalized
  series ID (from `getLinkToSeriesPage`). The sanitization logic unifies legacy
  domains (e.g., `royalroadl.com` \-> `royalroad.com`), strips parameters, and
  removes `www.` to ensure cache hits across inconsistent DOM hosts.
- **Atomic Operations**: When any link is updated (Manual Hover, Preload Success,
  or Cache Hit), the script performs a single pass to:
    1.  Update the icon state for all nodes with the matching `data-cache-key`.
    2.  Instantly remove all matching nodes from the relevant `Preloads[siteKey].PendingNodes` queue.
    3.  Update the global `preloadedUrlSet`.

- - -
## 2\. Interaction Matrix: Asynchronous Forces (High Precision)

The system stability depends on the interaction between three asynchronous
forces: **User Interaction**, the **Preloader Background Engine**, and **DOM
Mutation Events**.


|Force 1: User Action (Foreground)|Force 2: Preloader Engine (Background)|Force 3: DOM Mutation (Observer)|
|:--- |:--- |:--- |
|1\. **Mouse Enter Link**         |1\. **Loop Tick (`PreloadDelayMs`)** per site|1\. **DOM Change Detected**     |
|2\. `syncLinksByCacheKey`: Loading|2\. Check Per-Site & Global Budgets  |2\. `hidePopUp`                 |
|3\. Fetch/Parse Page             |3\. `syncLinksByCacheKey`: Loading    |3\. Full Page Re-discovery      |
|4\. `syncLinksByCacheKey`: Finished|4\. Fetch/Parse Page                  |            |
|                                 |5\. `syncLinksByCacheKey`: Finished   |            |

**Cross-Force Synchronization & Interaction:**

* **Queue Management**: Both *User Action* and *Preloader* remove links from `
  pendingPreloadNodes` during the `syncLinksByCacheKey: Loading` phase to
  prevent double-fetching.
* **Result Persistence**: Both forces add successfully parsed data to the `
  preloadedUrlSet` (History) upon completion via `syncLinksByCacheKey: Finished`.

- - -
## 3\. Preloader Engine (Autonomous Discovery)

- **State Transition Logic**:
  - **Pending**: Scanned for Regex Matches.
  - **Cached (Eager)**: Initial Scan sets Finished Icon Instantly. Excluded from
    Queue. Native cache hits load in exactly **0 frames** without TLS lag.
  - **Budgeted**: Loop Tick: `Preloads[siteKey].InProgress++` & `Preloads['AllSites'].InProgress++`.
  - **Success**: `Preloads[siteKey].Completed++` & `Preloads['AllSites'].Completed++`.
- **Deduplication**: Uses `preloadedUrlSet` to skip redundant network requests.
  For Chromium optimization, the script retains `rawNetworkUrl` parameters
  during misses to leverage native browser network cache states mapped to
  original tags.

- - -
## 4\. Viewport-Aware Positioning Framework

Deterministic geometric constraints ensure zero-overlap and constant visibility.

- **Bypassing Stutters**: The core geometry metrics bypass explicit `.transition`
  CSS properties, structurally guaranteeing physically instant 1-frame native
  HTML paints without sequential Javascript transition stutters.
- **Anchor Gap (`popupGap`)**: 5px fixed gap from anchor (link) in all directions.
- **Math Formula (Vertical Alignment)**: Used for **Top** or **Bottom** placement to center the popup horizontally while respecting viewport boundaries:
    $$P_x = \max\left(W_m, \min\left(L_{left} + \frac{L_{width}}{2} - \frac{P_{width}}{2}, V_w - P_{width} - W_m\right)\right)$$
    - $P_x$: Target horizontal (X) position of the popup.
    - $L_{left}$: Left coordinate of the link (anchor).
    - $L_{width}$: Width of the link (anchor).
    - $P_{width}$: Width of the popup content.
    - $V_w$: Viewport width (`window.innerWidth`).
    - $W_m$: `windowMargin` (9px padding) to prevent the popup from touching viewport edges.
    - *Note: For **Left/Right** placement, $P_x$ is fixed to the anchor edge ± `popupGap`.*

- - -
## 5\. Data Extraction & Maintenance

- **Recursive Extraction**: `tryToGetTextContent` recursively extracts text and links while preserving UPIB styling and converting `br` tags.
- **Cache Lifecycle**: Silent refresh triggered after `39 ** 6 ms` (~40.7 days).
  Background `updateStatus` validation runs transparently to re-verify expired
  cache objects.
  - **Diagnostics**: `drawLinkToPopupLine()` bridge verifies coordinate
    integrity.
- **Viewed Page Integration**: When on a supported series page, the `
  cacheCurrentPage()` function triggers immediately. This ensures that the
  "latest version" of the content is always cached, overriding any existing
  stale entries.
