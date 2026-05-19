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

let staticFilesPath = null;
if (isProd) {
	staticFilesPath = path.join(__dirname, '../public');
	app.use(express.static(staticFilesPath));
	app.get('*', (req, res) => {
		res.sendFile(path.join(staticFilesPath, 'index.html'));
	});
}

app.listen(PORT, () => {
	const version = process.env.VITE_VERSION || 'unknown';
	console.log(`[${new Date().toISOString()}] VPGA backend running on http://localhost:${PORT}`);
	console.log(`[${new Date().toISOString()}] SQLite database: ${db.__dbPath}`);
	console.log(`[${new Date().toISOString()}] NODE_ENV: ${process.env.NODE_ENV}`);
	if (staticFilesPath) {
		console.log(`[${new Date().toISOString()}] Serving static files from: ${staticFilesPath}`);
	}
	console.log(`[${new Date().toISOString()}] Version: ${version}`);
});
