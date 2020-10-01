#!/usr/bin/env node

const { program } = require('commander')
const fs          = require('fs')
const path        = require('path')
const YTS         = require('./dist/index')

const YTSubtitles = YTS.default
const { validateLanguageCode } = YTS

const getLanguageList = async (video_id) => {
  YTSubtitles.getLanguagesList(video_id).then((resp) => {
    if (resp.length) {
      console.log('Code\t vssId\t Translatable\t Name')
      console.log('-'.repeat(50))
      resp.forEach(s => {
        const { languageCode: code, languageName: name, isTranslatable } = s
        const id = s.languageId.replace('.', '')
        console.log(`${code}\t ${id}\t ${isTranslatable}\t\t [${name}]`)
      })
    } else {
      console.log('Error getting subtitles list: use a valid YouTube video-id')
    }
  })
}

const getLanguageTranslate = async (video_id) => {
  YTSubtitles.getLanguagesList(video_id).then((resp) => {
    if (resp.length) {
      console.log('Code\t Name')
      console.log('-'.repeat(20))
      resp[0].translationLanguages.forEach((lang) => {
        const { languageCode: code, languageName: name } = lang
        console.log(`${code}\t [${name.simpleText.replace('+', ' ')}]`)
      })
    } else {
      console.log('Error getting subtitles list: use a valid YouTube video-id')
    }
  })
}

const contentOutput = (content, options) => {
  const { srt, output } = options

  if (output) {
    const out_path = path.resolve(output)
    const string_content = srt ? content.join('') : JSON.stringify(content)

    return fs.writeFile(out_path, string_content, { flags: 'w' }, (err) => {
      if (err) {
        return console.log(err.message)
      }
    })
  }
  
  if (srt) {
    return content.forEach(s => console.log(s))
  }
  console.log(content)
}

const getSubtitles = async (video_id, options) => {
  const { language, srt, translate } = options

  if (language && !validateLanguageCode(language)) {
    return console.log(`Language code invalid: ${language}`)
  }
  const lang_code = language ? language : 'en'
    
  YTSubtitles.getLanguagesList(video_id).then((subList) => {
    let subtitle = subList.find(sub => sub.languageCode === lang_code)
    if (!subtitle) {
      if (language || subList.length < 1) {
        return console.log(`Could not find subtitles for ${video_id} in language ${lang_code}`)
      } else {
        subtitle = subList[0]
      }
    }

    if (translate) {
      try {
        subtitle = subtitle.translate(translate)
      } catch (err) {
        return console.log(err.message)
      }
    }

    let fetch = srt ? subtitle.fetchSRT() : subtitle.fetch()
    fetch.then(content => contentOutput(content, options))
  }).catch(() => console.log('Error getting subtitles list: use a valid YouTube video-id'))
}

program
  .version('1.0.0')
  .name('ytsub')
  .arguments('<video-id>')
  .description('Download YouTube video subtitles using the video id')
  .option('-l, --language <language-code>', 'Set subtitles language')
  .option('-t, --translate <language-code>', 'Translate subtitles in another language')
  .option('-s, --srt', 'Output in SRT format')
  .option('-o, --output <path>', 'Output file')
  .action(getSubtitles)

program
  .command('list <video-id>')
  .description('Get the list of available languages with codes and names')
  .action(getLanguageList)

program
  .command('list-translations <video-id>')
  .description('Get the list of available languages for translation')
  .action(getLanguageTranslate)

program.on('--help', () => {
  console.log('')
  console.log('Examples:')
  console.log('  $ ytsub uICEJnBuhy0 -l en')
  console.log('  $ ytsub uICEJnBuhy0 -s')
  console.log('  $ ytsub uICEJnBuhy0 -l en -s -o sub.srt')
  console.log('  $ ytsub uICEJnBuhy0 -t el')
  console.log('  $ ytsub list uICEJnBuhy0')
  console.log('  $ ytsub list-translations uICEJnBuhy0')
})

program.parse(process.argv)
