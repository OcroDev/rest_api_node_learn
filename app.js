/** ### Dependencies ### */
const crypto = require('node:crypto')
const express = require('express')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

/** ### Constants ### */
const PORT = process.env.PORT ?? 3000
// const ACCEPTED_ORIGINS = [
//   'http://localhost:8080',
//   'http://localhost:3000',
//   'http://192.168.0.104:8080',
//   'https://movies.com'
// ]

/** ### Server Config ### */
const app = express()
app.disable('x-powered-by')

/** ### Middelware ### */
app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    const ACCEPTED_ORIGINS = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://192.168.0.104:8080',
      'https://movies.com'
    ]

    if (ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true)
    }
    if (!origin) {
      return callback(null, true)
    }
    return callback(new Error('not allowed by CORS'))
  }
}
))

/** ### Routing ### */

/** ## GET ## */
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello World' })
})

app.get('/movies', (req, res) => {
  // res.header('Access-Control-Allow-Origin', '*')
  // res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
  // con st origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin)
  // }

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLocaleLowerCase())
    )
    return res.json(filteredMovies)
  }

  return res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) {
    return res.status(200).json(movie)
  } else {
    return res.status(404).json({ message: 'movie not found' })
  }
})

/** ## POST ## */
app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    res.status(422).json({ error: JSON.parse(result.error.message) })
  }

  // TODO: para hacer en base de datos
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // esto no es REST, porque estamos guardando
  // el estado de la aplicacion en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie) // ? devolver el recurso puede ser ideal para actualizar la cache del cliente
})

/** ## PATCH ## */
app.patch('/movies/:id', (req, res) => {
  const { id } = req.params
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  console.log({ movieIndex })
  console.log(result.data)
  console.log(movies[movieIndex])

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.status(200).json(updateMovie)
})

/** ## DELETE ## */
app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  // const origin = req.header('origin')
  // if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
  //   res.header('Access-Control-Allow-Origin', origin)
  //   res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  // }
  console.log(id)
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'movie not found - 404' })
  }

  movies.splice(movieIndex, 1)

  return res.status(202).json({ message: 'movie deleted' })
})

/** ## 404 ## */
app.use((req, res) => {
  res.status(200).send('page not found - 404')
})

/** ### Server Start ### */
app.listen(PORT, () => {
  console.log(`### Server is running on: ###
#
#
  -> http://localhost:${PORT}
#`)
})
