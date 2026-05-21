const cron = require('node-cron')
const { updateAllMembersHcp } = require('./hcpUpdater')

// Schedule expression: default is every Friday at 08:00 (server local time)
// Override via HCP_UPDATE_CRON env var, e.g. "0 8 * * 5"
const schedule = process.env.HCP_UPDATE_CRON || '0 8 * * 5'

function startScheduler() {
  if (!cron.validate(schedule)) {
    console.error(`[${new Date().toISOString()}] Invalid HCP_UPDATE_CRON expression: "${schedule}". Scheduler not started.`)
    return
  }

  cron.schedule(schedule, () => {
    console.log(`[${new Date().toISOString()}] Running scheduled HCP update (cron: ${schedule})`)
    updateAllMembersHcp().catch(err => {
      console.error(`[${new Date().toISOString()}] Scheduled HCP update error: ${err.message}`)
    })
  })

  console.log(`[${new Date().toISOString()}] HCP update scheduler started (cron: ${schedule})`)
}

module.exports = { startScheduler }
