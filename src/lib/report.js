/**
 * 启动服务对外提供覆盖率数据，
 * 在请求详细覆盖率统计数据的时候，生成覆盖率报告HTML
 */
const os = require('os')
const path = require('path')
const fs = require('fs')
const express = require('express')
const libCoverage = require('istanbul-lib-coverage')
const { createReporter, config } = require('istanbul-api')
const debug = require('debug')('qnc:report')
const archiver = require('archiver')

const QncTmpDir = path.resolve(os.tmpdir(), 'qnc')
const { ProcessMessageType, CoverageServerPort } = require('./constant')

const istanbulConfig = config.loadObject({
  verbose: true,
  reporting: {
    dir: path.join(QncTmpDir, 'coverage') // 报告输出的目录
  }
})

let CoverageMap = null // 默认的覆盖率数据，用户服务的数据会通过IPC的形式传进来
const ZipFile = 'coverage.zip'

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

// app.use(express.static(path.join(projectDir, 'coverage')))

app.get('/coverage', (req, res) => {
  const { file } = req.query
  const key = Object.keys(CoverageMap).find(k => {
    return new RegExp(`${file}$`).test(k)
  })
  res.send(CoverageMap[key] || CoverageMap)
})

app.get('/report-package', (req, res) => {
  let reporter = createReporter(istanbulConfig)

  reporter.add('html')
  reporter.write(CoverageMap)

  reporter = null

  const archive = archiver('zip', { zlib: { level: 9 } })

  archive.on('error', err => {
    console.error('zip file got error: %O', err)
    res.send(err)
  })

  const output = fs.createWriteStream(path.join(QncTmpDir, ZipFile))

  output.on('close', () => {
    res.download(path.join(QncTmpDir, ZipFile))
    debug(`${ZipFile} downloaded ${archive.pointer()} total bytes`)
  })
  archive.pipe(output)
  archive.directory(path.join(QncTmpDir, 'coverage'), 'coverage')
  archive.finalize()
})

app.get('/summary', (req, res) => {
  res.send(CoverageMap.getCoverageSummary())
})

app.listen(process.env.CoverageServerPort || CoverageServerPort, function () {
  console.log('coverage server started')
  process.send && process.send('ok')
})
