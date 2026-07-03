# User guide and FAQ

A quick [user guide](#user-guide) and a [FAQ](#faq):

## User guide

### Zone selection

You can choose the `zone` to display via the `zone` selector in the app main screen or via `settings`:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-zone-selection.gif">

### Theme to use

You can choose the theme to use via `settings`:

<img style="max-width: 800px;" alt="Switching between light and dark themes" src="./images/ug-theme-selection.gif">

Available options are pretty straight forward.  
The browser settings is set via `window.matchMedia("(prefers-color-scheme: dark)").matches`, but, if your preference changes following the time of the day, the app won't follow this setting: there's no way to know when to recompute this value when it changes. It should be updated if you reload the page though (but as you can see, I'm a `dark` theme user, so this has not been tested).

### Display modes

<img style="max-width: 800px;" alt="Switching between display modes and responsive layout" src="./images/ug-display-mode-and-responsive.gif">

There are **four display modes** available:

| Mode | Description |
|------|-------------|
| **Compact** | Condensed layout optimized for smaller screens or when you want to see more content with less space. Shows essential controls and information in a compact form. |
| **One Column** | Single-column layout ideal for narrow screens or mobile devices. Stacks all elements vertically for easy vertical scrolling. |
| **Wide** | Full-featured layout that shows all controls and the queue side-by-side. Best for larger screens and desktop use. |
| **10 Feet** | TV-friendly layout with larger fonts and buttons, designed for use from a distance (e.g., on a TV or home theater setup). Optimized for remote control navigation. |

With the ability to choose if the `queue` is displayed or not and the fact that the app is responsive (this feature is very young, please report any anomalies!), you should be able to build the presentation that suit the best both to your taste and the screen you want to use.

### Volume management

Everything happens via the `volume` drawer that you can open by clicking on the `volume` icon:

<img style="max-width: 800px;" alt="Opening the volume drawer and adjusting volume levels" src="./images/ug-volume-drawer.gif">

The stepper follows what's set in `roon` for this output for the step value.  
Changes done via the slider are only applied when you stop moving the slider.  
The `volume` icon at the left of the `volume` drawer toggles mute.

Grouped `zone` are managed as in `roon` and each output as its own setting in the drawer:

<img style="max-width: 800px;" alt="Managing volume for grouped zone outputs" src="./images/ug-grouped-volume-drawer.gif">

### Browsing content

Everything happens via the `Browse` and the `Library` button.   
The `Search` functionality is not as good as the one in `roon` and is limited to what's in your library. It's not a choice, it's just the only one available in the `api`.

<img style="max-width: 800px;" alt="Browsing library and searching for content" src="./images/ug-browse-and-library.gif">

Nothing is filtered out, so every item returned by the `api` is displayed.  
You can click on elements in the title bread crumbs to get back to a previous level in the navigation.

### Custom actions

Custom actions provide quick access buttons for your most-used browsing destinations. The app includes **10 built-in actions**:

| Action | Description |
|--------|-------------|
| **Albums** | Browse your music library by albums |
| **Artists** | Browse your music library by artists |
| **Browse** | Open the full Roon browse hierarchy |
| **Composers** | Browse classical music by composer |
| **Genres** | Browse your library by genre |
| **Library** | Access your Roon library directly |
| **Playlists** | Browse your saved playlists |
| **Radios** | Access internet radio stations |
| **Queue** | Toggle the queue panel visibility |
| **AudioInput** | Start an audio input session (see AirPlay section) |

You can also **create your own custom actions** that navigate to any browse path in your library. This is useful for creating shortcuts to frequently accessed content like:
- Specific genres or composers
- Favorite playlists
- Custom browse hierarchies

To create a custom action, use the action recorder feature which captures your navigation path and saves it as a reusable button.

### Zone grouping

You can group multiple outputs together to play synchronized audio across several devices. This is useful for:
- Whole-home audio (playing the same music in multiple rooms)
- Combining speakers for a more immersive experience

Grouped zones share a single volume control with individual adjustments available for each output in the group. Use the zone grouping dialog to add or remove outputs from a group.

### Zone transfer

Zone transfer allows you to move playback from one zone to another. This is useful when you want to:
- Continue listening in a different room without interrupting playback
- Switch from headphones to speakers mid-track

The transfer preserves the current queue and playback position, seamlessly continuing on the destination zone.

### Queue management

Queue management is minimal, but it's all what is available in the `api`.
- you can `Add next` a content (via `browse` or `library` navigation)
- you can `Queue` a content (via `browse` or `library` navigation)
- you can `Play Now` a content  (via `browse` or `library` navigation, doing so, as in `roon`, will skip all what's in the `queue` and will start your content)
- you can `Start Radio` from a content (via `browse` or `library` navigation)
- you can `Play from here` an item in the `queue`

You can't modify the `queue` order or remove an item as you can in `roon`.  
I miss these features too!  
But there's nothing in the `api` to do so.

When you launch a `Live Radio`, it will take precedence on what's playing in the `zone` but won't change the `queue`. To get back to what you were listening, use the `Play from here` functionality.

<img style="max-width: 800px;" alt="Playing live radio and resuming from queue position" src="./images/ug-live-radio-and-play-from-here.gif">

### Queue Bot

The Queue Bot is an automation feature that can trigger actions when the queue reaches specific tracks. This enables "end of album" behaviors:

| Action | Description |
|--------|-------------|
| **Stop** | Automatically stops playback when a designated track becomes the next track in the queue |
| **Standby** | Puts the zone into standby mode when a designated track becomes next |

This works by configuring:
1. An artist name to watch for (the "bot artist")
2. Track names that trigger each action

To use Queue Bot, add tracks by a specific "bot artist" to your library with titles like "Stop" or "Standby". When these tracks appear as the next item in the queue, the corresponding action is triggered. This allows you to create albums that end with automation triggers.

Enable or configure Queue Bot in the extension settings within Roon.

### Fullscreen mode

The app supports fullscreen mode for an immersive, distraction-free listening experience. Use the fullscreen toggle button to enter or exit fullscreen. This is particularly useful when:
- Using the app on a dedicated display
- Running in 10-feet mode on a TV
- Wanting to focus solely on the music controls

### Audio Input / AirPlay

The app supports audio input sessions, which can be used with the companion [roon-airplay](../app/roon-airplay/README.md) Docker container to stream audio from iOS devices, macOS, or iTunes directly to Roon.

**How it works:**
1. The roon-airplay container creates an AirPlay receiver on your network
2. Connect your iOS device or Mac to the "roon airplay" AirPlay device
3. Audio is converted to an HTTP stream that Roon can play as an internet radio station
4. Metadata (artist, title, album) is displayed in the Roon interface

For detailed setup instructions, see the [roon-airplay documentation](../app/roon-airplay/README.md).

## FAQ

### Some covers are missing, why?

The app displayed what's returned by the `api`.  
If you see the ugly default placeholder of your browser for a missing image, it's because the `api` says there's an image... and returns `Not Found` when trying to load it.  
I will implement a fallback image later (need to find a way that doesn't break accessibility standards for that), but for now, it's the ugly default placeholder for missing images that comes with your browser.

### I've modified or added a cover, but I don't see it in the app, why?

To avoid to overwhelm your `roon` server, images are cached in the browser via standard `http` headers for one day.
Any change will appear 24 hours after the last time the image has been loaded in the browser.

### Where are the parts of Beethoven's 9th (or any parts with any content)?

I think you start to see the pattern... but `parts` are not exposed through `roon` api...  
It's a pain for classical music, as they're widely used and useful for this genre.  
I miss them too, but can't invent them.

### Sometimes during browsing, navigation get kind of crazy, why?

Because, sometimes, the `api` does so.  
For instance, changing, in the `Browsing` window, some settings, works ok the first time and gets f***** up the second one...  
I've not fully investigated every case, but this one is pretty clear: the `api` is used as intended, but have this strange behavior.  
Please open an issue on `github` with proper description and reproduction for investigation if you discover these kind of unexpected behaviors.

### There's something strange that's not in the FAQ, what do I do?

Please open a `github` issue and try to document it the better you can.  
*It does not work does not help!*  
Please describe the observed behavior vs. the expected behavior, and if you can, share a screenshot or a screen capture to help to reproduce and understand what's happening.  
As already stated, this is done on my personal time, the app is free, so please be patient.  
Humour is fine, so you can mock the behavior you're observing, **but** if you're pissed, please, be kind, rewind.
