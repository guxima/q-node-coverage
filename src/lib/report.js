/**
 * 启动服务对外提供覆盖率数据，
 * 在请求详细覆盖率统计数据的时候，生成覆盖率报告HTML
 */
const path = require('path')
const express = require('express')
const libCoverage = require('istanbul-lib-coverage')
const { createReporter } = require('istanbul-api')
const {ProcessMessageType} = require('./constant')

let CoverageData = {} // 默认的覆盖率数据，用户服务的数据会通过IPC的形式传进来

process.on('message', ({type, data}) => {
  //只处理qnc发出的进程消息
  if(type === ProcessMessageType){
    const {coverage} = data;

    CoverageData = coverage
    const coverageMap = libCoverage.createCoverageMap(CoverageData)
    const reporter = createReporter()

    reporter.addAll(['html'])
    reporter.write(coverageMap)
  }
})

const app = express()

const projectDir = process.cwd()

app.use(express.static(path.join(projectDir, 'coverage')))

app.get('/coverage', (req, res) => {
  const { file } = req.query
  const key = Object.keys(CoverageData).find(k => {
    return new RegExp(`${file}$`).test(k)
  })
  res.send(CoverageData[key] || CoverageData)
})

app.listen(8987)
