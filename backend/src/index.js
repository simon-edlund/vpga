require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json())

app.use('/api/auth',     require('./routes/auth'))
app.use('/api/members',  require('./routes/members'))
app.use('/api/rounds',   require('./routes/rounds'))
app.use('/api/standings',require('./routes/standings'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Golf tour backend running on http://localhost:${PORT}`))
