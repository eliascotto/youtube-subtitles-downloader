import localeCode from 'locale-code'
import ISO6391 from 'iso-639-1'

// Validate the language code using iso-639-1 for `en` format and 
// locale-code for `zh-CN` format
export function validateLanguageCode(languageCode) {
  return ISO6391.validate(languageCode) || localeCode.validateLanguageCode(languageCode)
}

// Convert the time in seconds to SRT valid format
//
//  The timecode format used is hours:minutes:seconds,milliseconds with time units
// fixed to two zero-padded digits and fractions fixed to three zero-padded digits (00:00:00,000)
// https://en.wikipedia.org/wiki/SubRip
export function secToTime(secs) {
  const pad = (n, z=2) => ('00' + n).slice(-z)
  const time = parseFloat(secs)
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor(time / 60) % 60
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.round((time % 1) * 1000)
  return [hours, minutes, seconds]
    .map(v => pad(v))
    .join(':')
    .concat('.', pad(milliseconds, 3))
}
