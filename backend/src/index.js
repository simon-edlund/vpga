require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./db')

const app = express()
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use((req, res, next) => {
	const startedAt = Date.now()
	res.on('finish', () => {
		const durationMs = Date.now() - startedAt
		console.log(
			`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
		)
	})
	next()
})

app.use(cors(isProd ? {} : { origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())


app.use('/api/auth',     require('./routes/auth'))
app.use('/api/members',  require('./routes/members'))
app.use('/api/rounds',   require('./routes/rounds'))
app.use('/api/standings',require('./routes/standings'))
app.use('/api/events',   require('./routes/events'))
app.use('/api/calendar', require('./routes/calendar'))
app.use('/api/ompc',     require('./routes/ompc'))

// Serve Vue SPA in production
if (isProd) {
	const distDir = path.join(__dirname, '../../frontend/dist')
	app.use(express.static(distDir))
	app.get('*', (req, res) => {
		res.sendFile(path.join(distDir, 'index.html'))
	})
}

app.listen(PORT, () => {
	console.log(`[${new Date().toISOString()}] VPGA backend running on http://localhost:${PORT}`)
	console.log(`[${new Date().toISOString()}] SQLite database: ${db.__dbPath}`)
})
