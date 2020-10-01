# Youtube Subtitles Downloader

[![dependencies Status](https://david-dm.org/elias94/youtube-subtitles-downloader/status.svg)](https://david-dm.org/elias94/youtube-subtitles-downloader)
[![devDependencies Status](https://david-dm.org/elias94/youtube-subtitles-downloader/dev-status.svg)](https://david-dm.org/elias94/youtube-subtitles-downloader?type=dev)

Node library for download subtitles from Youtube and translate them or convert to SRT. Also available as CLI.
Partially used with the **[Youtube Subtitles Viewer Chrome extension](https://chrome.google.com/webstore/detail/youtube-subtitles-viewer/ljblecifcbmcdjbabhimddlladlkfdfg)**

## Install 

```
npm install youtube-subtitles-downloader
```

install global for use the CLI

```
npm install -g youtube-subtitles-downloader
```

## Usage example

```javascript
const id = YTSubtitles.extractIdFromUrl('https://www.youtube.com/watch?v=vG-QZOTc5_Q')

YTSubtitles.getLanguagesList(id).then((resp) => {
  resp[0].fetch().then(lang => {
    console.log(lang)
    // do something else with subtitles
  })
})
```
or CLI
```
$ ytsub uICEJnBuhy0 -l en
$ ytsub uICEJnBuhy0 -s
$ ytsub uICEJnBuhy0 -l en -s -o sub.srt
$ ytsub uICEJnBuhy0 -t el
$ ytsub list uICEJnBuhy0
$ ytsub list-translations uICEJnBuhy0
```

## YTSubtitles

#### `async YTSubtitles.getSubtitles(videoID, languageCode)`

Download the subtitles of the video using the optional language code

##### Params

- `videoID`: YouTube video ID
- `languageCode` *(optional)*: language code of the subtitles to return

##### Return

Array with the fetched subtitles content

#### `async YTSubtitles.getLanguagesList(videoID)`

Get the languages list for the video

##### Params

- `videoID`: YouTube video ID

##### Return

An array of subtitles objects (YTSub)

#### `YTSubtitles.extractIdFromUrl(url)`

Extract the video ID

##### Params

- `url`: YouTube video URL

##### Return

String video ID

## YTSub

#### `async fetch()`

Download the subtitles of the video

##### Return

Array with the fetched subtitles content

#### `async fetchSRT()`

Download the subtitles of the video in SRT format

##### Return

Array with the fetched subtitles content in SRT format

#### `async translate(languageCode)`

Translate the subtitle into another language returning a new YTSub object

##### Params

- `languageCode`: Language code for translation

##### Return

A new YTSub object constructed with the new language

### Properties

#### `translationLanguages`

List of languages object available for translate the subtitles

#### `languageCode, languageName, languageId`

Code, name and vvsId of the subtitles retrieved from YouTube

#### `isTranslatable`

Is current language is translatable

## CLI

```
Usage: ytsub [options] [command] <video-id>

Download YouTube video subtitles using the video id

Options:
  -V, --version                    output the version number
  -l, --language <language-code>   Set subtitles language
  -t, --translate <language-code>  Translate subtitles in another language
  -s, --srt                        Output in SRT format
  -o, --output <path>              Output file
  -h, --help                       display help for command

Commands:
  list <video-id>                  Get the list of available languages with codes and names
  list-translations <video-id>     Get the list of available languages for translation

Examples:
  $ ytsub uICEJnBuhy0 -l en
  $ ytsub uICEJnBuhy0 -s
  $ ytsub uICEJnBuhy0 -l en -s -o sub.srt
  $ ytsub uICEJnBuhy0 -t el
  $ ytsub list uICEJnBuhy0
  $ ytsub list-translations uICEJnBuhy0
```
---

Elia Scotto | [Website](https://www.eliascotto.com)
