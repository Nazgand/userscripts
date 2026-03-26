# System Overview: Novel Updates Cover Preview

The `NovelUpdatesCoverPreview.user.js` is a unified Tampermonkey script designed
to asynchronously pre-fetch, parse, cache, and rapidly instantiate a rich
visual tooltip wrapper around web novel titles.

- - -
## Development Notes

### CHANGES 2.6.0 ➡ 2.68.94:

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
- **Preloader Throttle**: Added `MaximumTotalPreloads` and `InProgressPreloads`
  budget tracking.
- **Removed wlnupdates.com support**: Also removed `tv.com`, `mtlnovel.com`, and `
  batoto` (Bato.to).
- **Tabbed indentation**
- **Redid colors**: Fixed light text on light background (e.g., ScribbleHub Dark
  Mode).
- **Context Awareness**: Blocked links to the current page from triggering popups.
- **Freeze Mode**: Added `f` hotkey to freeze the popup and pin it for
  interaction.

### BUGS:

- Scrolling within the popup is disabled at 
  `https://www.mangaupdates.com/stats/new`.
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
- file:///\*/userscripts/TestNovelUpdatesCoverPreview.html

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
    2.  Instantly remove all matching nodes from the `pendingPreloadNodes` queue.
    3.  Update the global `preloadedUrlSet`.

- - -
## 2\. Interaction Matrix: Asynchronous Forces (High Precision)

The system stability depends on the interaction between three asynchronous
forces: **User Interaction**, the **Preloader Background Engine**, and **DOM
Mutation Events**.


|Force 1: User Action (Foreground)|Force 2: Preloader Engine (Background)|Force 3: DOM Mutation (Observer)|
|---------------------------------|--------------------------------------|--------------------------------|
|1\. **Mouse Enter Link**         |1\. **Loop Tick (`PreloadDelayMs`)**  |1\. **DOM Change Detected**     |
|2\. `syncLinksByCacheKey`: Loading|2\. Check Budget (< `MaximumTotalPreloads`) & Viewport|2\. Stop Observer               |
|3\. Fetch/Parse Page             |3\. `syncLinksByCacheKey`: Loading    |3\. `hidePopUp`                 |
|4\. `syncLinksByCacheKey`: Finished|4\. Fetch/Parse Page                  |4\. Full Page Re-discovery      |
|                                 |5\. `syncLinksByCacheKey`: Finished   |5\. Restart Observer            |

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
  - **Budgeted**: Loop Tick: `InProgressPreloads++`.
  - **Success**: `completedPreloads++`, `InProgressPreloads--`.
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

- **Recursive Extraction**: `tryToGetTextContent` converts block elements to
  breaks while preserving inline styling.
- **Cache Lifecycle**: Silent refresh triggered after `39 ** 6 ms` (~40.7 days).
  Background `updateStatus` validation runs transparently to re-verify expired
  cache objects.
  - **Diagnostics**: `drawLinkToPopupLine()` bridge verifies coordinate
    integrity.
