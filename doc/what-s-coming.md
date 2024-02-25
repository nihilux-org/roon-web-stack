# What's coming

I have many features in mind to continue to develop this project. This doc is not here to list them all, but rather to list some first order priorities and to describe how the priorisation should ideally be done, through community feedbacks.

## The missing parts that must be done

I see 2 features that are missing and that should be added as soon as possible:

### 1. Accessibility
Because it should be possible to use this app via the accessibility tools you usually use to browse the web.  
This has been one of the initial motivations to start a web client for `roon`, as I don't know how accessible is the native app.  

Using `Angular Material` was a way to be on the right track for this feature.  
I've never really worked on the subject in my previous experiences and would really appreciate the help of a `aria ninja`. 

Any feedback on how to improve the situation from the user perspective is also warmly welcome.

### 2. Internationalisation
Because it should be possible to enjoy this app in your favorite language. 

This feature will be split in two parts:
- internationalisation for latin alphabet languages
- internationalisation for non latin alphabet languages

This separation is not motivated by any personal preferences or hierarchy between alphabets, it's there because the standards available make it easier to internationalize a web application with latin alphabet.  
Starting by setting the base infrastructure for internationalisation of latin alphabets will make possible to deal with the challenges implied by non latin alphabets on the web (custom fonts, handling different reading direction, etc.).
Once again, I could use help to deliver the support of non latin alphabets as it's something I've never done.

Translations will be community driven: I can't write translations for other languages than English and French.

This will not translate the content of what's returned by the `api`, what's coming from `roon` is driven by what you choose in `roon` settings.

### 3. All the missing features  
Here's an unordered list, just to give an idea:
- Zone and Output management (limited to what's available in [node roon api](https://github.com/RoonLabs/node-roon-api))
- Offer more layout flexibility via `settings`:
  - ability to display more than one zone at the same time
  - minimalist theme
  - ...
- Custom actions: ability to define buttons launching an action you often do:
  - starting a web radio
  - starting one of your playlist
  - ...
- Implements something similar to [Roon Extension: Queue Bot](https://community.roonlabs.com/t/roon-extension-queue-bot-v0-2-1-track-2-standby/104271). I use it a lot.  
I'd like to add a `Stop (or Standby) at the end of currently played album` functionality.
- A share functionality, once again, inspired by a great Extension offered by [The Appgineer](https://github.com/TheAppgineer), [Sharoon](https://community.roonlabs.com/t/sharoon-v0-3-0-share-albums-and-tracks-via-streaming-services-links/170905)
- All the good ideas the community will have... 


## The priorisation and feature requests via issues

This project will use `github` issues as a way to request features, as also to deal with priorisation and development advancement.

The guide describing how to open a feature request and how the process of priorisation will work will be added later.
