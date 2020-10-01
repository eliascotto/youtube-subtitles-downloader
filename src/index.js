import he from 'he'
import axios from 'axios'
import striptags from 'striptags'

// Subtitle class that cointain the subtitle information.
// Provide methods to fetch the subtiltes or translate them in another language.
class YTSub {
  constructor(subObj, translationLanguages) {
    // baseUrl: "https://www.youtube.com/api/timedtext?v=uICEJnBuhy0&...&lang=zh-CN"
    // isTranslatable: true
    // languageCode: "zh-CN"
    // name: {simpleText: "Chinese+(China)"}
    // vssId: ".zh-CN"
    this.subtitle = subObj
    // [ {languageCode: 'el', languageName: {simpleText: 'Greek'}} ]
    this.translationLanguages = translationLanguages

    this.languageCode = subObj.languageCode
    this.languageName = subObj.name.simpleText.replace('+', ' ')
    this.languageId = subObj.vssId
    this.isTranslatable = subObj.isTranslatable
  }

  // Fetch the subtitle performing a request to the baseUrl parameter.
  async fetch() {
    if (!this.subtitle.baseUrl) {
      throw new Error('Invalid property baseUrl')
    }

    // Get the subtitles with the url specified into the subtitle object.
    const { data: transcript } = await axios.get(this.subtitle.baseUrl)

    const lines = transcript
      .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
      .replace('</transcript>', '')
      .split('</text>')
      .filter(line => line && line.trim())
      .map(line => {
        const startRegex = /start="([\d.]+)"/
        const durRegex = /dur="([\d.]+)"/

        const [, start] = startRegex.exec(line)
        const [, duration] = durRegex.exec(line)

        const htmlText = line
          .replace(/<text.+>/, '')
          .replace(/&amp;/gi, '&')
          .replace(/<\/?[^>]+(>|$)/g, '')

        const decodedText = he.decode(htmlText)
        const text = striptags(decodedText)

        return { start, duration, text }
      })

    return lines
  }

  // Fetch the subtitles and convert the format to the SRT standard
  //
  // https://en.wikipedia.org/wiki/SubRip
  async fetchSRT() {
    return this.fetch().then((lines) => {
      return lines.map((line, index) => {
        const { start, duration, text } = line
        let end

        if (duration) {
          end = start + duration
        } else {
          // get start from the next line or use a default value 3
          end = lines[index] ? lines[index].start : start + 3
        }

        return `${index}\r\n${secToTime(start)} --> ${secToTime(end)}\r\n${text}\r\n\r\n`
      })
    })
  }

  // Return a new YTSub object with a different url that automatically fetch
  // the subtitles with the translation provided by YouTube.
  //
  // USAGE: YTSub(subtitleObj).translate('zh-CN').fetch()
  translate(languageCode) {
    if (!languageCode || !validateLanguageCode(languageCode)) {
      throw new Error(`Language code invalid: ${languageCode}`)
    }

    if (!this.subtitle.isTranslatable) {
      throw new Error(`Subtitles ${this.subtitle.languageCode} are not translatable`)
    }

    // check inside the translation languages list if available
    const lang = this.translationLanguages.find(({ languageCode: lc }) => {
      return lc === languageCode 
    })

    if (!lang) {
      throw new Error(`Subitles are not translatable in ${languageCode}`)
    }

    // create a new YTSub object with a modified baseUrl parameter
    return new YTSub({
      ...this.subtitle,
      // YouTube support automatic translation using a parameter `tlang` into the language request.
      baseUrl: `${this.subtitle.baseUrl}&tlang=${languageCode}`,
    }, this.translationLanguages)
  }
}

export default class YTSubtitles {
  // Extract the caption object from the video page html.
  //
  // INTERNAL USE ONLY
  static _extractCaptions(html) {
    const splittedHtml = html.split('"captions":')
    // html could contains captions or not
    if (splittedHtml.length > 1) {
      const [videoDetails,] = splittedHtml[1].split(',"videoDetails')
      const jsonObj = JSON.parse(videoDetails.replace('\n', ''))
      return jsonObj['playerCaptionsTracklistRenderer']
    }
    return null
  }

  // Utility for extract an Id from a video URL.
  //
  // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url/27728417#27728417
  static extractIdFromUrl(url) {
    const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
    const [, videoID] = url.match(regExp)
    return videoID
  }

  // Extract the list of available languages directly from the video page.
  //
  // videoID parameter is required
  static async getLanguagesList(videoID) {
    const videoURL = `https://www.youtube.com/watch?v=${videoID}`
    const { data } = await axios.get(videoURL)
    const decodedData = data.replace('\\u0026', '&').replace('\\', '')

    const captionJSON = YTSubtitles._extractCaptions(decodedData)

    if (!captionJSON || !'captionTracks' in captionJSON) {
      // could not find captions for video
      return []
    }

    const { translationLanguages } = captionJSON
    return captionJSON.captionTracks.map(
      track => new YTSub(track, translationLanguages)
    )
  }

  // Automatically get youtube subtitles using the videoID.
  //
  // A languageCode could be specified ('en' default).
  static async getSubtitles(videoID, languageCode) {
    if (languageCode && !validateLanguageCode(languageCode)) {
      throw new Error(`Language code invalid: ${languageCode}`)
    }

    // the default language is English
    const language = languageCode ? languageCode : 'en'
    
    return YTSubtitles.getLanguagesList(videoID).then((subList) => {
      // find the language in the list using the languageCode
      let subtitle = subList.find(sub => sub.languageCode === language)

      if (!subtitle) {
        if (languageCode || subList.length < 1) {
          // throw an error if the user specified a language not available
          // or the video has no subtitles
          throw new Error(`Could not find subtitles for video: ${videoID}`)
        } else {
          // select the first language if English is not available
          subtitle = subList[0]
        }
      }
      // fetch the subtitle
      return subtitle.fetch()
    })
  }
}

