require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { YoutubeTranscript } = require('youtube-transcript')
const bodyParser = require('body-parser')
const axios = require('axios')

const app = express()

// Configure CORS to allow requests from the frontend
app.use(cors({
  origin: 'http://localhost:4200', // Angular's default port
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

// Parse JSON bodies
app.use(bodyParser.json())

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[7].length === 11) ? match[7] : null
}

// Function to generate notes using Gemini
async function generateNotes(transcript) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a helpful assistant that creates concise, well-structured notes from video transcripts. Format the notes with proper headings, bullet points, and highlight key concepts. Please create comprehensive notes from this video transcript: ${transcript}`
          }]
        }]
      }
    )

    return response.data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('Error generating notes:', error.response?.data || error.message)
    throw new Error('Failed to generate notes')
  }
}

app.post('/', async function (req, res) {
  try {
    // Validate request body
    if (!req.body || !req.body.url) {
      return res.status(400).json({ error: 'No URL provided' })
    }

    const url = req.body.url
    const videoId = extractVideoId(url)

    // Validate YouTube URL
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' })
    }

    // Get video transcript
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId)
    if (!transcriptArray || transcriptArray.length === 0) {
      return res.status(404).json({ error: 'No transcript found for this video' })
    }

    // Combine transcript text
    const fullTranscript = transcriptArray
      .map(item => item.text)
      .join(' ')

    // Generate notes using Gemini
    const notes = await generateNotes(fullTranscript)

    res.json({ notes })

  } catch (error) {
    console.error('Error processing request:', error)
    res.status(500).json({ 
      error: 'Failed to process video',
      details: error.message 
    })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})