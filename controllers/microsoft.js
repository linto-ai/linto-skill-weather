'use strict'

const debug = require('debug')('linto:skill:v2:linto-skill:weather:controllers:microsoft')
const weather = require('weather-js')

const KEY_ENTITIE_LOCATION = 'location'
const KEY_ENTITIE_TIME = 'time'

module.exports = async function (msg) {
  let tts = this.skillConfig[this.skillConfig.language]

  let location = this.payloadAction.extractEntityFromName(msg.payload, KEY_ENTITIE_LOCATION)
  let time = this.payloadAction.extractEntityFromName(msg.payload, KEY_ENTITIE_TIME)

  let dataRequest = {
    lang: this.skillConfig.lang,
    degreeType: this.config.degreeType
  }

  if (location) {
    dataRequest.search = location.value
  } else if (this.config.defaultCity) {
    dataRequest.search = this.config.defaultCity
  } else {
    return tts.say.error_no_city
  }

  try {
    let weatherResult = await callWeatherApi(dataRequest)
    if (weatherResult) {
      return formatResponse(weatherResult, time === undefined, tts.say)
    } else {
      return tts.say.error_city_weather
    }

  } catch (error) {
    return tts.say.error_api
  }
}

async function callWeatherApi(dataRequest) {
  return new Promise((resolve, reject) => {
    try {
      weather.find(dataRequest, function (error, result) {
        if (result && result.length !== 0)
          resolve(result)
        else
          resolve(undefined)
      })
    } catch (err) {
      reject(err)
    }
  })
}

function formatResponse(apiResponse, today, tts) {
  if (today)
    return (apiResponse[0].location.name + tts.temperatureToday +
      apiResponse[0].current.temperature + apiResponse[0].location.degreetype + ', ' +
      tts.weatherTodayIs + apiResponse[0].current.skytext)
  else
    return (apiResponse[0].location.name + tts.temperatureNextDay +
      apiResponse[0].forecast[2].low + ' - ' + apiResponse[0].forecast[2].high +
      apiResponse[0].location.degreetype + ', ' + tts.weatherNextIs +
      apiResponse[0].forecast[2].skytextday)
}