const YTSubtitles = require('./dist/index').default

const id = YTSubtitles.extractIdFromUrl('https://www.youtube.com/watch?v=vG-QZOTc5_Q')

YTSubtitles.getLanguagesList(id).then((resp) => {
  resp[0].fetch().then(lang => {
    console.log(lang)
  })
})
