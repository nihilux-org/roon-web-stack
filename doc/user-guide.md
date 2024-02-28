# User guide and FAQ

A quick [user guide](#user-guide) and a [FAQ](#faq):

## User guide

### Zone selection

You can choose the `zone` to display via the `zone` selector in the app main screen or via `settings`:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-zone-selection.gif">

### Theme to use

You can choose the theme to use via `settings`:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-theme-selection.gif">

Available options are pretty straight forward.  
The browser settings is set via `window.matchMedia("(prefers-color-scheme: dark)").matches`, but, if your preference changes following the time of the day, the app won't follow this setting: there's no way to know when to recompute this value when it changes. It should be updated if you reload the page though (but as you can see, I'm a `dark` theme user, so this has not been tested).

### Display mode setting

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-display-mode-and-responsive.gif">

There are, for now, two display modes available: `wide` and `compact`.

With the ability to choose if the `queue` is displayed or not and the fact that the app is responsive (this feature is very young, please report any anomalies!), you should be able to build the presentation that suit the best both to your taste and the screen you want to use.

### Volume management

Everything happens via the `volume` drawer that you can open by clicking on the `volume` icon:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-volume-drawer.gif">

The stepper follows what's set in `roon` for this output for the step value.  
Changes done via the slider are only applied when you stop moving the slider.  
The `volume` icon at the left of the `volume` drawer toggles mute.

Grouped `zone` are managed as in `roon` and each output as its own setting in the drawer:

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-grouped-volume-drawer.gif">

### Browsing content

Everything happens via the `Browse` and the `Library` button.   
The `Search` functionality is not as good as the one in `roon` and is limited to what's in your library. It's not a choice, it's just the only one available in the `api`.

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-browse-and-library.gif">

Nothing is filtered out, so every item returned by the `api` is displayed.  
You can click on elements in the title bread crumbs to get back to a previous level in the navigation.

### Queue management

Queue management is minimal, but it's all what is available in the `api`.
- you can `Add next` a content (via `browse` or `library` navigation)
- you can `Queue` a content (via `browse` or `library` navigation)
- you can `Play Now` a content  (via `browse` or `library` navigation, doing so, as in `roon`, will skip all what's in the `queue` and will start your content)
- you can `Start Radio` from a content (via `browse` or `library` navigation)
- you can `Play from here` an item in the `queue`

You can't modify the `queue` order or remove an item as you can in `roon`.  
I miss these features too!  
But there's nothing in the `api` to do so 🤷.

When you launch a `Live Radio`, it will take precedence on what's playing in the `zone` but won't change the `queue`. To get back to what you were listening, use the `Play from here` functionality.

<img style="max-width: 800px;" alt="Selecting a zone at first app launch" src="./images/ug-live-radio-and-play-from-here.gif">

(I know, [radio covers are missing... it's on roon side sorry about that](#where-are-the-cover-images-of-the-live-radio))

## FAQ

### Some covers are missing, why?

The app displayed what's returned by the `api`.  
If you see the ugly default placeholder of your browser for a missing image, it's because the `api` says there's an image... and returns `Not Found` when trying to load it 🤷.  
I will implement a fallback image later (need to find a way that doesn't break accessibility standards for that), but for now, it's the ugly default placeholder for missing images that comes with your browser.

### I've modified or added a cover, but I don't see it in the app, why?

To avoid to overwhelm your `roon` server, images are cached in the browser via standard `http` headers for one day.
Any change will appear 24 hours after the last time the image has been loaded in the browser.

### Where are the cover images of the Live Radio?

They were there until version `2.0.27`... disappear with `2.0.28` and have not came back since.

Sorry about that, but as with every strange behavior regarding images, that what's returned by the `roon` api 🤷.

### Where are the parts of Beethoven's 9th (or any parts with any content)?

I think you start to see the pattern... but `parts` are not exposed through `roon` api...  
It's a pain for classical music, as they're widely used and useful for this genre.  
I miss them too, but can't invent them.

### Why are some artist name incorrect

There's a strange behavior with artists' name while browsing content form Tidal or Qobuz: they're returned as `[[some_kind_of_id|Artist Name]]`.

I've implemented a workaround to display them correctly, but it's not battle tested. From the `code`, only artists' name that contains `[[...]]` could be impacted, but once again, testing is light. 

Please open a `github` issue for further investigation if you find artists' name that are incorrectly displayed.

### Sometimes during browsing, navigation get kind of crazy, why?

Because, sometimes, the `api` does so 🤷.  
For instance, changing, in the `Browsing` window, some settings, works ok the first time and gets f***** up the second one...  
I've not fully investigated every case, but this one is pretty clear: the `api` is used as intended, but have this strange behavior 🤷.  
Please open an issue on `github` with proper description and reproduction for investigation if you discover these kind of unexpected behaviors.

### There's something strange that's not in the FAQ, what do I do?

Please open a `github` issue and try to document it the better you can.  
*It does not work does not help!*  
Please describe the observed behavior vs. the expected behavior, and if you can, share a screenshot or a screen capture to help to reproduce and understand what's happening.  
As already stated, this is done on my personal time, the app is free, so please be patient.  
Humour is fine, so you can mock the behavior you're observing, **but** if you're pissed, please, be kind, rewind. 
