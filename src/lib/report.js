/**
 * 启动服务对外提供覆盖率数据，
 * 在请求详细覆盖率统计数据的时候，生成覆盖率报告HTML
 */
const path = require('path')
const express = require('express')
const libCoverage = require('istanbul-lib-coverage')
const { createReporter } = require('istanbul-api')
const debug = require('debug')('qnc:report')

const { ProcessMessageType, CoverageServerPort } = require('./constant')

let CoverageMap = null // 默认的覆盖率数据，用户服务的数据会通过IPC的形式传进来

process.on('message', ({ type, data }) => {
  // 只处理qnc发出的进程消息
  if (type === ProcessMessageType) {
    const { coverage } = data

    if (!CoverageMap) {
      CoverageMap = libCoverage.createCoverageMap(coverage)
      debug('init CoverageMap')
    } else {
      CoverageMap.merge(coverage)
      debug('merge coverage')
    }

    const reporter = createReporter()

    reporter.addAll(['html'])
    reporter.write(CoverageMap)
  }
})

// IPC通信丢失就退出进程
process.on('disconnect', function () {
  console.error('report IPC disconnect')
  process.exit(1)
})

process.on('uncaughtException', function (err) {
  console.error(err)
  process.exit()
})

const app = express()

const projectDir = process.cwd()

app.use(express.static(path.join(projectDir, 'coverage')))

app.get('/coverage', (req, res) => {
  const { file } = req.query
  const key = Object.keys(CoverageMap).find(k => {
    return new RegExp(`${file}$`).test(k)
  })
  res.send(CoverageMap[key] || CoverageMap)
})

app.get('/summary', (req, res) => {
  res.send(CoverageMap.getCoverageSummary())
})

app.listen(process.env.CoverageServerPort || CoverageServerPort, function () {
  console.log('coverage server started')
  process.send && process.send('ok')
})
